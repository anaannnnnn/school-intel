import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, CalendarClock, CircleCheck, Clock, FileText, Hourglass, ListChecks, PauseCircle, PenLine, Play, Target, Timer } from 'lucide-react';
import { Button, Callout, Card, Chip, Dialog, EmptyState, Segmented, errorText, formatDate, formatDateTime, formatTime, useToast, type Tone } from '@school-intel/ui';
import { DEMO_DATE, learn, useDb } from '@school-intel/api';
import type { AssessmentKind } from '@school-intel/contracts';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { AiNote, PRow, Ring, SectionTitle, SubjectTile, daysLabel, scoreTone } from '../kit';
import '../student-c2.css';

type Tab = 'todo' | 'results' | 'papers' | 'plan';
const TABS: { value: Tab; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'results', label: 'Results' },
  { value: 'papers', label: 'Past papers' },
  { value: 'plan', label: 'Exam plan' },
];

export const KIND: Record<AssessmentKind, { label: string; tone: Tone }> = {
  quiz: { label: 'Quiz', tone: 'info' },
  test: { label: 'Test', tone: 'warning' },
  mock: { label: 'Practice', tone: 'neutral' },
};

type Rows = ReturnType<typeof learn.assessmentsFor>;
type Row = Rows['todo'][number];

function closesLabel(iso?: string) {
  if (!iso) return 'No closing time';
  return iso.slice(0, 10) === DEMO_DATE ? `Closes today ${formatTime(iso)}` : `Closes ${formatDateTime(iso)}`;
}

export function dayHeading(date: string) {
  if (date === DEMO_DATE) return 'Today';
  const t = new Date(`${DEMO_DATE}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  if (date === t.toISOString().slice(0, 10)) return 'Tomorrow';
  return formatDate(date, { weekday: 'long', day: 'numeric', month: 'short' });
}

export function Tests() {
  const { actor, isParent, child } = useFamily();
  useDb();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [confirm, setConfirm] = useState<Row | null>(null);
  const [busy, setBusy] = useState('');

  if (isParent) return <Navigate to="/progress" replace />;
  if (!child) return null;

  const raw = params.get('tab');
  const tab: Tab = TABS.some((t) => t.value === raw) ? (raw as Tab) : 'todo';
  const setTab = (t: Tab) => setParams(t === 'todo' ? {} : { tab: t }, { replace: true });

  const run = (key: string, fn: () => { id: string }) => {
    setBusy(key);
    try {
      const at = fn();
      navigate(`/tests/play/${at.id}`);
    } catch (e) {
      toast(errorText(e), 'danger');
      setBusy('');
    }
  };
  const start = (r: Row) => run(r.id, () => learn.startAttempt(actor, r.id));

  return (
    <>
      <PageHeader eyebrow="Quizzes, tests and revision" title="Tests" />
      <div className="seg-tight">
        <Segmented label="Tests sections" value={tab} onChange={setTab} options={TABS} />
      </div>

      {tab === 'todo' && <TodoTab onStart={(r) => (r.kind === 'test' && !r.attempt ? setConfirm(r) : start(r))} busy={busy} />}
      {tab === 'results' && <ResultsTab />}
      {tab === 'papers' && <PapersTab busy={busy} onStart={(id) => run(id, () => learn.startPastPaper(actor, id))} />}
      {tab === 'plan' && <PlanTab busy={busy} onPractise={(topicId) => run(topicId, () => learn.startTopicPractice(actor, topicId))} />}

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Ready to start?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Not yet</Button>
            <Button
              variant="brand"
              icon={Play}
              busy={busy === confirm?.id}
              onClick={() => {
                const r = confirm!;
                setConfirm(null);
                start(r);
              }}
            >
              Start test
            </Button>
          </>
        }
      >
        {confirm && (
          <div className="stack-sm">
            <strong>{confirm.title}</strong>
            <ul className="glance">
              <li>
                <span className="glance-icon" data-tone="info" aria-hidden><Timer size={16} /></span>
                <span className="glance-body">
                  <span className="glance-title">Timed test · {confirm.durationMin ?? 20} minutes</span>
                  <span className="glance-detail">The timer starts when you press Start and keeps running if you leave.</span>
                </span>
              </li>
              <li>
                <span className="glance-icon" data-tone="warning" aria-hidden><PauseCircle size={16} /></span>
                <span className="glance-body">
                  <span className="glance-title">The study helper is paused until you submit</span>
                  <span className="glance-detail">Show what you know. It switches back on as soon as you finish.</span>
                </span>
              </li>
              <li>
                <span className="glance-icon" data-tone="success" aria-hidden><CircleCheck size={16} /></span>
                <span className="glance-body">
                  <span className="glance-title">Answers save as you go</span>
                  <span className="glance-detail">Results appear once your teacher releases them.</span>
                </span>
              </li>
            </ul>
          </div>
        )}
      </Dialog>
    </>
  );
}

function TodoTab({ onStart, busy }: { onStart: (r: Row) => void; busy: string }) {
  const { actor, child } = useFamily();
  const a = learn.assessmentsFor(actor, child!.id);
  const written = learn.writtenTasksFor(actor, child!.id).filter((w) => !w.submission);

  return (
    <>
      {a.todo.length === 0 && written.length === 0 ? (
        <Card>
          <EmptyState icon={CircleCheck} title="You’re all caught up">
            New quizzes and tests from your teachers will appear here.
          </EmptyState>
        </Card>
      ) : (
        <>
          <SectionTitle>Open now</SectionTitle>
          {a.todo.map((r) => {
            const resume = r.attempt?.status === 'in-progress';
            const k = KIND[r.kind];
            return (
              <Card key={r.id} as="article" aria-labelledby={`t-${r.id}`}>
                <div className="stack">
                  <div className="card-top">
                    <SubjectTile subjectId={r.subject.id} hue={r.subject.hue} />
                    <div className="grow">
                      <div className="chip-row">
                        <Chip tone={k.tone}>{k.label}</Chip>
                        {resume && <Chip tone="info" dot={false}>In progress</Chip>}
                      </div>
                      <h3 id={`t-${r.id}`}>{r.title}</h3>
                      <div className="meta-line">
                        <span>{r.subject.name}</span>
                        <span><ListChecks size={14} aria-hidden /> {r.questionCount} questions</span>
                        <span><Timer size={14} aria-hidden /> {r.durationMin ? `${r.durationMin} min` : 'Untimed'}</span>
                      </div>
                      <div className="meta-line">
                        <span><Clock size={14} aria-hidden /> {closesLabel(r.closesAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant={resume ? 'secondary' : 'brand'} icon={Play} block busy={busy === r.id} onClick={() => onStart(r)}>
                    {resume ? 'Resume' : r.kind === 'test' ? 'Start test' : 'Start quiz'}
                  </Button>
                  {r.kind === 'quiz' && !resume && <p className="fine">Practice quiz · you’ll see your score and explanations straight away.</p>}
                </div>
              </Card>
            );
          })}

          {written.length > 0 && (
            <>
              <SectionTitle>Written work</SectionTitle>
              <div className="rows">
                {written.map((w) => (
                  <PRow
                    key={w.id}
                    to={`/written/${w.id}`}
                    tile={<SubjectTile subjectId={w.subject.id} hue={w.subject.hue} />}
                    title={w.title}
                    sub={`${w.subject.name} · at least ${w.minWords} words`}
                    end={<Chip tone="warning">Due {formatDate(w.due)}</Chip>}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {a.upcoming.length > 0 && (
        <>
          <SectionTitle>Coming up</SectionTitle>
          <div className="rows">
            {a.upcoming.map((r) => (
              <PRow
                key={r.id}
                tile={<SubjectTile subjectId={r.subject.id} hue={r.subject.hue} />}
                title={r.title}
                sub={`${KIND[r.kind].label} · opens ${formatDate(r.opensAt, { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(r.opensAt)}${r.durationMin ? ` · ${r.durationMin} min` : ''}`}
                end={<Chip tone="neutral" dot={false}><CalendarClock size={12} aria-hidden /> Scheduled</Chip>}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ResultsTab() {
  const { actor, child } = useFamily();
  const a = learn.assessmentsFor(actor, child!.id);
  const written = learn.writtenTasksFor(actor, child!.id).filter((w) => w.submission);

  if (a.done.length === 0 && written.length === 0) {
    return (
      <Card>
        <EmptyState icon={Hourglass} title="No results yet">
          Finish a quiz or test and your results will appear here.
        </EmptyState>
      </Card>
    );
  }

  return (
    <>
      {a.done.length > 0 && (
        <div className="rows">
          {a.done.map((r) => {
            const at = r.attempt!;
            return (
              <PRow
                key={r.id}
                to={`/tests/result/${at.id}`}
                tile={<SubjectTile subjectId={r.subject.id} hue={r.subject.hue} />}
                title={r.title}
                sub={`${KIND[r.kind].label} · ${at.submittedAt ? formatDate(at.submittedAt) : 'Submitted'}`}
                end={
                  r.score ? (
                    <Ring pct={r.score.pct} size={46} color={toneColor(scoreTone(r.score.pct))} />
                  ) : (
                    <Chip tone={at.status === 'submitted' ? 'warning' : 'info'}>{at.status === 'submitted' ? 'Awaiting teacher' : 'Marked'}</Chip>
                  )
                }
              />
            );
          })}
        </div>
      )}
      {written.length > 0 && (
        <>
          <SectionTitle>Written work</SectionTitle>
          <div className="rows">
            {written.map((w) => {
              const released = w.submission!.status === 'released';
              return (
                <PRow
                  key={w.id}
                  to={`/written/${w.id}`}
                  tile={<SubjectTile subjectId={w.subject.id} hue={w.subject.hue} />}
                  title={w.title}
                  sub={`Submitted ${formatDate(w.submission!.submittedAt)}`}
                  end={<Chip tone={released ? 'success' : 'warning'}>{released ? 'Feedback ready' : 'Teacher checking'}</Chip>}
                />
              );
            })}
          </div>
        </>
      )}
      <p className="small muted">Test results appear once your teacher releases them. Quizzes and practice papers are scored straight away.</p>
    </>
  );
}

export function toneColor(t: Tone) {
  return t === 'success' ? 'var(--color-success)' : t === 'warning' ? 'var(--color-warning-solid)' : t === 'danger' ? 'var(--color-danger)' : undefined;
}

function PapersTab({ onStart, busy }: { onStart: (id: string) => void; busy: string }) {
  const { actor, child } = useFamily();
  const papers = learn.pastPapersFor(actor, child!.id);
  if (!papers.length) {
    return (
      <Card>
        <EmptyState icon={FileText} title="No past papers yet">
          Your teachers add past papers for your year group here.
        </EmptyState>
      </Card>
    );
  }
  return (
    <>
      <p className="small muted">Real exam questions under timed conditions. You’ll get your score and worked explanations as soon as you finish.</p>
      {papers.map((p) => {
        const mins = p.questionIds.length * 4;
        return (
          <Card key={p.id} as="article" aria-labelledby={`p-${p.id}`}>
            <div className="stack">
              <div className="card-top">
                <SubjectTile subjectId={p.subject.id} hue={p.subject.hue} />
                <div className="grow">
                  <h3 id={`p-${p.id}`}>{p.title}</h3>
                  <div className="meta-line">
                    <span>{p.session} {p.year}</span>
                    <span>{p.board}</span>
                  </div>
                  <div className="meta-line">
                    <span><ListChecks size={14} aria-hidden /> {p.questionIds.length} questions · {p.marks} marks</span>
                    <span><Timer size={14} aria-hidden /> {mins} min</span>
                  </div>
                </div>
                {p.best && <Ring pct={p.best.pct} size={52} color={toneColor(scoreTone(p.best.pct))} />}
              </div>
              <div className="row-between">
                <span className="small muted">{p.tries ? `Best ${p.best!.got}/${p.best!.max} · ${p.tries} ${p.tries === 1 ? 'try' : 'tries'}` : 'Not tried yet'}</span>
                <Button variant="brand" size="sm" icon={Timer} busy={busy === p.id} onClick={() => onStart(p.id)}>Practise (timed)</Button>
              </div>
              <p className="fine">{p.licence}</p>
            </div>
          </Card>
        );
      })}
    </>
  );
}

const TASK_ICON = { read: BookOpen, practise: Target, 'past-paper': FileText } as const;

function PlanTab({ onPractise, busy }: { onPractise: (topicId: string) => void; busy: string }) {
  const { actor, child } = useFamily();
  const plan = learn.examPlan(actor, child!.id);

  if (!plan.exams.length) {
    return (
      <Card>
        <EmptyState icon={CalendarClock} title="No exams coming up">
          When your teachers schedule an exam, you’ll see a revision plan here.
        </EmptyState>
      </Card>
    );
  }

  const days = [...new Set(plan.tasks.map((t) => t.date))];
  const exam = (id: string) => plan.exams.find((e) => e.id === id);

  return (
    <>
      <SectionTitle>Upcoming exams</SectionTitle>
      {plan.exams.map((e) => (
        <Card key={e.id} as="article" aria-labelledby={`e-${e.id}`}>
          <div className="stack">
            <div className="card-top">
              <SubjectTile subjectId={e.subject.id} hue={e.subject.hue} />
              <div className="grow">
                <Chip tone={e.days <= 3 ? 'warning' : 'info'}>{daysLabel(e.days)}</Chip>
                <h3 id={`e-${e.id}`}>{e.title}</h3>
                <div className="meta-line">
                  <span>{formatDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })}, {formatTime(e.date)}</span>
                </div>
              </div>
              <div className="stack-sm" style={{ alignItems: 'center', gap: 4 }}>
                {e.readiness !== undefined ? <Ring pct={e.readiness} size={56} color={toneColor(scoreTone(e.readiness))} /> : <Ring pct={0} size={56} label="–" />}
                <span className="fine">Readiness</span>
              </div>
            </div>
            <ul className="topic-bars" aria-label="Topics in this exam">
              {e.topics.map(({ topic, score }) => (
                <li key={topic.id}>
                  <span>{topic.name}</span>
                  <b>{score ? `${score.pct}%` : '–'}</b>
                  <TopicBar pct={score?.pct} name={topic.name} />
                </li>
              ))}
            </ul>
            {e.planTotal > 0 && <p className="small muted">{e.planDone} of {e.planTotal} plan tasks done</p>}
          </div>
        </Card>
      ))}

      <SectionTitle>Your study plan</SectionTitle>
      <AiNote>Plan built from your quiz results; weakest topics first.</AiNote>
      {days.map((d) => {
        const tasks = plan.tasks.filter((t) => t.date === d);
        const mins = tasks.reduce((n, t) => n + t.minutes, 0);
        return (
          <section key={d} className="plan-day" aria-label={dayHeading(d)}>
            <div className="plan-day-head">
              <span>{dayHeading(d)}</span>
              <span>{mins} min</span>
            </div>
            {tasks.map((t) => {
              const Icon = TASK_ICON[t.kind];
              const ex = exam(t.examId);
              return (
                <label key={t.id} className="plan-task" data-done={t.done}>
                  <input type="checkbox" checked={t.done} onChange={() => learn.togglePlanTask(actor, t.id)} />
                  <span className="grow">
                    <strong>{t.label}</strong>
                    <small><Icon size={12} aria-hidden style={{ verticalAlign: '-1px' }} /> {ex?.subject.name} · for {ex?.title}</small>
                  </span>
                  {t.kind === 'practise' && !t.done && d === DEMO_DATE ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      busy={busy === t.topicId}
                      aria-label={`Start ${t.label}`}
                      onClick={(ev) => {
                        ev.preventDefault();
                        onPractise(t.topicId);
                      }}
                    >
                      Start
                    </Button>
                  ) : (
                    <span className="mins">{t.minutes} min</span>
                  )}
                </label>
              );
            })}
          </section>
        );
      })}
      <Callout tone="neutral" icon={PenLine}>Tick tasks off as you go. The plan updates after each quiz you finish.</Callout>
    </>
  );
}

function TopicBar({ pct, name }: { pct?: number; name: string }) {
  const tone = scoreTone(pct);
  return (
    <div className="progress" data-tone={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : tone === 'danger' ? 'danger' : undefined} role="progressbar" aria-label={`${name} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? 0}>
      <span style={{ width: `${pct ?? 0}%` }} />
    </div>
  );
}

