import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, CircleStop, Info, Lock, Megaphone, PenLine, Play, Sparkles, Timer, TriangleAlert, Undo2, Users } from 'lucide-react';
import { Avatar, Button, Callout, Card, CardHeader, Chip, Dialog, EmptyState, errorText, formatDateTime, formatTime, useToast, type Tone } from '@school-intel/ui';
import { AI_DISCLOSURE, className, getDb, teach, useDb, ValidationError } from '@school-intel/api';
import type { Actor, Assessment, Attempt } from '@school-intel/contracts';
import { AiTag, DataTable, Heat, PageFoot, PageHead, Restricted, Stat, SubjectDot, Tabs, band } from '../ui';
import { Dots, QuestionBody } from './Questions';
import { ASSESSMENT_STATUS } from './Assessments';
import '../teaching-a.css';

type Detail = ReturnType<typeof teach.assessmentDetail>;

const ATTEMPT: Record<'none' | Attempt['status'], { label: string; tone: Tone }> = {
  none: { label: 'Not started', tone: 'neutral' },
  'in-progress': { label: 'In progress', tone: 'info' },
  submitted: { label: 'Submitted · awaiting marking', tone: 'warning' },
  marked: { label: 'Marked', tone: 'success' },
  released: { label: 'Released', tone: 'success' },
};

export function AssessmentDetail({ actor }: { actor: Actor }) {
  const { id = '' } = useParams();
  useDb();
  let data: Detail;
  try {
    data = teach.assessmentDetail(actor, id);
  } catch (e) {
    return <Restricted message={errorText(e)} />;
  }
  return <DetailView key={data.assessment.id} actor={actor} data={data} />;
}

function DetailView({ actor, data }: { actor: Actor; data: Detail }) {
  const toast = useToast();
  const { assessment: a, editable, students, questions, topicScores, insight } = data;
  const [tab, setTab] = useState<'students' | 'questions'>('students');
  const [releaseError, setReleaseError] = useState('');
  const [confirmRelease, setConfirmRelease] = useState(false);
  const teacher = getDb().staff.find((s) => s.id === a.subject.teacherId)?.name;
  const st = ASSESSMENT_STATUS[a.status];

  const setStatus = (status: Assessment['status'], msg: string) => {
    try {
      teach.setAssessmentStatus(actor, a.id, status);
      toast(msg);
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const release = () => {
    setConfirmRelease(false);
    try {
      const n = teach.releaseResults(actor, a.id);
      setReleaseError('');
      toast(`Results released to ${n} student${n === 1 ? '' : 's'} and their families`);
    } catch (e) {
      if (e instanceof ValidationError) setReleaseError(e.message);
      toast(errorText(e), 'danger');
    }
  };

  const canRelease = editable && !a.resultsReleased && (a.status === 'open' || a.status === 'closed') && a.submitted > 0;
  const actions = (
    <>
      <Link to="/assessments" className="btn btn-secondary">
        <ArrowLeft size={18} aria-hidden /> All assessments
      </Link>
      {editable && a.status === 'draft' && (
        <>
          <Button variant="secondary" icon={CalendarClock} onClick={() => setStatus('scheduled', `Scheduled · opens ${formatDateTime(a.opensAt)}`)}>Schedule</Button>
          <Button icon={Play} onClick={() => setStatus('open', 'Open now · the class has been notified')}>Open now</Button>
        </>
      )}
      {editable && a.status === 'scheduled' && (
        <>
          <Button variant="ghost" icon={Undo2} onClick={() => setStatus('draft', 'Moved back to draft')}>Back to draft</Button>
          <Button icon={Play} onClick={() => setStatus('open', 'Open now · the class has been notified')}>Open now</Button>
        </>
      )}
      {editable && a.status === 'open' && <Button variant="secondary" icon={CircleStop} onClick={() => setStatus('closed', 'Closed · no new attempts can start')}>Close</Button>}
      {canRelease && <Button icon={Megaphone} onClick={() => setConfirmRelease(true)}>Release results</Button>}
    </>
  );

  return (
    <>
      <PageHead
        title={a.title}
        sub={
          <span className="ta-meta" style={{ fontSize: 14 }}>
            <span className="ta-subj">
              <SubjectDot hue={a.subject.hue} />
              {a.subject.name} · {className(a.classId)}
            </span>
            <span>
              {formatDateTime(a.opensAt)}
              {a.closesAt ? ` – ${a.opensAt.slice(0, 10) === a.closesAt.slice(0, 10) ? formatTime(a.closesAt) : formatDateTime(a.closesAt)}` : ''}
            </span>
            {a.durationMin ? <span>{a.durationMin} min</span> : null}
            <span>{a.questionIds.length} questions · {a.marks} marks</span>
          </span>
        }
        spec="Teaching · assessment detail"
        actions={actions}
      />

      <div className="row wrap" style={{ gap: 8 }}>
        <Chip tone={a.kind === 'test' ? 'info' : 'neutral'} dot={false}>{a.kind === 'test' ? 'Test' : 'Quiz'}</Chip>
        <Chip tone={st.tone}>{st.label}</Chip>
        {a.status !== 'draft' && (a.resultsReleased ? <Chip tone="success">Results visible to students</Chip> : <Chip tone="warning">Results held</Chip>)}
        <span className="ta-id">{a.id}</span>
      </div>

      {!editable && (
        <Callout tone="neutral" icon={Lock}>
          Read-only. Only {teacher ?? 'the subject teacher'} can open, close or release this {a.kind}.
        </Callout>
      )}
      {releaseError && (
        <Callout tone="danger" icon={TriangleAlert} title="Results not released">
          {releaseError}{' '}
          <Link to="/marking" style={{ color: 'inherit', fontWeight: 600 }}>Go to marking</Link>
        </Callout>
      )}

      <div className="stats">
        <Stat icon={Users} value={`${a.submitted}/${a.classSize}`} label="Submitted" foot={`${a.classSize - a.submitted - a.inProgress} not started`} />
        <Stat icon={Timer} value={a.inProgress} label="In progress" tone="neutral" />
        <Stat icon={PenLine} value={a.toMark} label="To mark" tone={a.toMark ? 'warning' : undefined} to={editable && a.toMark ? '/marking' : undefined} foot={a.toMark ? 'Confirm AI-suggested marks' : 'Nothing waiting'} />
        <Stat icon={Sparkles} value={a.average === undefined ? '—' : `${a.average}%`} label="Average score" tone={a.average !== undefined && a.average < 50 ? 'warning' : a.average !== undefined ? 'success' : undefined} foot="Fully marked attempts" />
      </div>

      <div className="grid-main">
        <Card className="card-flush ta-flush">
          <div className="table-toolbar" style={{ paddingBlockEnd: 0 }}>
            <Tabs
              label="Assessment views"
              value={tab}
              onChange={setTab}
              items={[
                { value: 'students', label: 'Students', count: students.length },
                { value: 'questions', label: 'Questions', count: questions.length },
              ]}
            />
          </div>
          <div className="ta-card-gap" />
          {tab === 'students' ? (
            <DataTable
              caption="Student attempts"
              rows={students}
              columns={[
                {
                  key: 'n',
                  label: 'Student',
                  render: (s) => (
                    <span className="row">
                      <Avatar initials={s.student.initials} />
                      <Link to={`/students/${s.student.id}`} className="strong" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
                        {s.student.name}
                      </Link>
                    </span>
                  ),
                },
                { key: 's', label: 'Status', render: (s) => { const x = ATTEMPT[s.attempt?.status ?? 'none']; return <Chip tone={x.tone}>{x.label}</Chip>; } },
                { key: 'sc', label: 'Score', align: 'end', render: (s) => (s.score ? <span className="row" style={{ justifyContent: 'flex-end', gap: 8 }}><span className="ta-id">{s.score.got}/{s.score.max}</span><Heat pct={s.score.pct} /></span> : <Heat pct={undefined} label="No score yet" />) },
                { key: 't', label: 'Submitted', render: (s) => <span className="small muted" style={{ whiteSpace: 'nowrap' }}>{s.attempt?.submittedAt ? formatDateTime(s.attempt.submittedAt) : s.attempt ? `Started ${formatTime(s.attempt.startedAt)}` : '—'}</span> },
              ]}
            />
          ) : (
            <ol className="ta-paper" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {questions.map(({ question: q, topic, insight: it }, i) => {
                const answered = !!it && students.some((s) => s.attempt && s.attempt.status !== 'in-progress' && s.attempt.items.some((x) => x.questionId === q.id && x.awarded !== undefined));
                const wrong = it?.commonWrong;
                const wrongText = wrong === undefined ? undefined : q.type === 'mcq' ? q.options?.[Number(wrong)] ?? wrong : wrong;
                return (
                  <li key={q.id} className="ta-paper-row">
                    <span className="ta-qnum" aria-hidden>{i + 1}</span>
                    <div className="ta-paper-body">
                      <span className="ta-prompt">
                        <span className="sr-only">Question {i + 1}: </span>
                        {q.prompt}
                      </span>
                      <span className="ta-meta">
                        <span>{topic?.name}</span>
                        <span className="ta-mono">{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
                        <span><Dots level={q.difficulty} /></span>
                      </span>
                      {q.type === 'mcq' ? (
                        <QuestionBody q={{ ...q, explanation: '' }} wrong={wrong} />
                      ) : (
                        <>
                          <QuestionBody q={{ ...q, explanation: '', rubric: undefined }} />
                          {wrongText && (
                            <span className="ta-wrong">
                              <TriangleAlert size={13} aria-hidden /> Most common wrong answer: <b className="ta-mono">{wrongText}</b>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="ta-paper-side" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <Heat pct={answered ? it.pct : undefined} label={answered ? `Facility ${it.pct}%` : 'No answers yet'} />
                      <span className="ta-id">facility</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card className="ai-panel">
          <CardHeader icon={Sparkles} title="Class insight" sub="From marked answers in this assessment" action={<AiTag>AI insight</AiTag>} />
          {topicScores.length > 0 && <p className="ta-insight">{insight}</p>}
          {topicScores.length === 0 ? (
            <EmptyState icon={Sparkles} title="No marked answers yet">Topic scores appear once attempts are submitted and marked.</EmptyState>
          ) : (
            <div className="ta-bars">
              {[...topicScores].sort((x, y) => x.pct - y.pct).map((t) => (
                <div key={t.topicId} className="ta-bar">
                  <span>{t.name}</span>
                  <span className="ta-bar-value">{t.pct}% · {t.correct}/{t.total} marks</span>
                  <div className="ta-bar-track" data-band={band(t.pct)} role="progressbar" aria-label={`${t.name}: ${t.pct}%`} aria-valuenow={t.pct} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${Math.max(2, t.pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="ta-disclosure" style={{ marginBlockStart: 16 }}>
            <Info size={13} aria-hidden />
            <span>{AI_DISCLOSURE}</span>
          </p>
        </Card>
      </div>

      <PageFoot />

      <Dialog
        open={confirmRelease}
        onClose={() => setConfirmRelease(false)}
        title="Release results?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmRelease(false)}>Cancel</Button>
            <Button icon={Megaphone} onClick={release}>Release results</Button>
          </>
        }
      >
        <p>Students who submitted will see their score and feedback, and their families are notified. Every written answer must be confirmed in Marking first.</p>
        {a.toMark > 0 && <Callout tone="warning">{a.toMark} attempt{a.toMark === 1 ? ' is' : 's are'} still awaiting marking.</Callout>}
      </Dialog>
    </>
  );
}
