import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Info, Lock, Save, Sparkles, X } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Checkbox, Chip, EmptyState, Segmented, SelectField, Steps, Switch, TextField, errorText, useToast, type Tone } from '@school-intel/ui';
import { AI_DISCLOSURE, getDb, teach, useDb } from '@school-intel/api';
import type { Actor, Question, QuestionType } from '@school-intel/contracts';
import { AiTag, PageFoot, PageHead } from '../ui';
import { Dots } from './Questions';
import '../teaching-a.css';

const TYPE: Record<QuestionType, { label: string; tone: Tone }> = {
  mcq: { label: 'Multiple choice', tone: 'info' },
  numeric: { label: 'Numeric', tone: 'neutral' },
  short: { label: 'Written', tone: 'restricted' },
};

// Demo date is Tuesday 6 October 2026, Dubai time (+04:00).
const toIso = (local: string) => (local ? `${local}:00+04:00` : '');

export function AssessmentBuilder({ actor }: { actor: Actor }) {
  useDb();
  const own = teach.mySubjects(actor);
  if (!own.length) {
    return (
      <Card>
        <EmptyState icon={Lock} title="Only subject teachers build quizzes and tests" action={<Link to="/assessments" className="btn btn-secondary">Back to quizzes & tests</Link>}>
          Your role can read assessments and results across subjects, but not create them.
        </EmptyState>
      </Card>
    );
  }
  return <Builder actor={actor} />;
}

function Builder({ actor }: { actor: Actor }) {
  const navigate = useNavigate();
  const toast = useToast();
  const d = getDb();
  const own = teach.mySubjects(actor);

  const [kind, setKind] = useState<'quiz' | 'test'>('quiz');
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(own[0].id);
  const topicsOf = (sid: string) => d.topics.filter((t) => t.subjectId === sid).sort((a, b) => a.order - b.order);
  const [topicIds, setTopicIds] = useState<string[]>(() => topicsOf(own[0].id).slice(0, 1).map((t) => t.id));
  const [count, setCount] = useState('6');
  const [includeWritten, setIncludeWritten] = useState(false);
  const [duration, setDuration] = useState('20');
  const [opens, setOpens] = useState('2026-10-06T14:00');
  const [closes, setCloses] = useState('2026-10-07T18:00');
  const [paper, setPaper] = useState<Question[] | null>(null);
  const [requested, setRequested] = useState(0);

  const topics = topicsOf(subjectId);
  const approved = d.questions.filter((q) => q.subjectId === subjectId && q.status === 'approved');
  const available = (tid: string) => approved.filter((q) => q.topicId === tid && (includeWritten || q.type !== 'short')).length;
  const pool = topicIds.reduce((n, t) => n + available(t), 0);

  // Any blueprint change invalidates the built paper.
  const changeBlueprint = (fn: () => void) => {
    fn();
    setPaper(null);
  };

  const build = () => {
    try {
      const n = Math.max(1, Math.min(30, Number(count) || 1));
      const qs = teach.previewPaper(actor, { subjectId, topicIds, count: n, includeWritten });
      setPaper(qs);
      setRequested(n);
      if (!qs.length) toast('No approved questions match those topics yet', 'danger');
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const save = () => {
    try {
      const a = teach.createAssessment(actor, {
        kind,
        title,
        subjectId,
        topicIds,
        count: paper?.length ?? Number(count),
        includeWritten,
        durationMin: kind === 'test' ? Number(duration) || undefined : undefined,
        opensAt: toIso(opens),
        closesAt: closes ? toIso(closes) : undefined,
        questionIds: paper?.map((q) => q.id),
      });
      toast(`${a.title} saved as a draft · schedule or open it when ready`);
      navigate(`/assessments/${a.id}`);
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const totalMarks = paper?.reduce((n, q) => n + q.marks, 0) ?? 0;
  const coverage = topicIds.map((tid) => {
    const qs = paper?.filter((q) => q.topicId === tid) ?? [];
    return { id: tid, name: topics.find((t) => t.id === tid)?.name ?? tid, n: qs.length, marks: qs.reduce((m, q) => m + q.marks, 0) };
  });
  const windowError = closes && opens && closes <= opens ? 'Closing time must be after opening time.' : undefined;

  return (
    <>
      <PageHead
        title="New quiz or test"
        sub="Set the blueprint, let the AI pick a balanced paper from your approved questions, then check it before saving."
        spec="Teaching · assessment builder"
        actions={
          <Link to="/assessments" className="btn btn-secondary">
            <ArrowLeft size={18} aria-hidden /> All quizzes & tests
          </Link>
        }
      />

      <div className="grid-main">
        <Card>
          <section className="ta-section" aria-labelledby="b-1">
            <div className="ta-section-head">
              <span className="ta-step-num" aria-hidden>1</span>
              <h3 id="b-1">Details</h3>
            </div>
            <div className="field">
              <span className="field-label">Type</span>
              <Segmented label="Assessment type" value={kind} onChange={setKind} options={[{ value: 'quiz', label: 'Quiz · practice, instant results' }, { value: 'test', label: 'Test · timed, results held' }]} />
            </div>
            <div className="ta-form-grid">
              <div className="ta-span">
                <TextField label="Title" value={title} placeholder={kind === 'quiz' ? 'For example: Simplifying fractions check' : 'For example: Fractions end-of-unit test'} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <SelectField
                label="Subject and class"
                value={subjectId}
                onChange={(e) => {
                  const sid = e.target.value;
                  changeBlueprint(() => {
                    setSubjectId(sid);
                    setTopicIds(topicsOf(sid).slice(0, 1).map((t) => t.id));
                  });
                }}
                options={own.map((s) => ({ value: s.id, label: `${s.name} · Year ${s.classId}` }))}
              />
              {kind === 'test' ? (
                <TextField label="Time limit (minutes)" type="number" min={5} max={180} value={duration} onChange={(e) => setDuration(e.target.value)} />
              ) : (
                <div className="field">
                  <span className="field-label">Time limit</span>
                  <span className="field-hint" style={{ paddingBlock: 10 }}>Quizzes are untimed. Students see their score straight away.</span>
                </div>
              )}
            </div>
          </section>

          <section className="ta-section" aria-labelledby="b-2">
            <div className="ta-section-head">
              <span className="ta-step-num" aria-hidden>2</span>
              <h3 id="b-2">Blueprint</h3>
            </div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="field-label" style={{ marginBlockEnd: 6 }}>Topics</legend>
              <div className="ta-topic-checks">
                {topics.map((t) => (
                  <Checkbox
                    key={t.id}
                    label={
                      <>
                        {t.name}
                        <small>{available(t.id)} approved</small>
                      </>
                    }
                    checked={topicIds.includes(t.id)}
                    onChange={(v) => changeBlueprint(() => setTopicIds((ids) => (v ? [...ids, t.id] : ids.filter((x) => x !== t.id))))}
                  />
                ))}
              </div>
            </fieldset>
            <div className="ta-form-grid">
              <TextField label="Number of questions" type="number" min={1} max={30} value={count} hint={`${pool} approved question${pool === 1 ? '' : 's'} match`} onChange={(e) => changeBlueprint(() => setCount(e.target.value))} />
              <div style={{ alignSelf: 'center' }}>
                <Switch label="Include written questions" hint="Marked by you, with AI-suggested marks" checked={includeWritten} onChange={(v) => changeBlueprint(() => setIncludeWritten(v))} />
              </div>
            </div>
          </section>

          <section className="ta-section" aria-labelledby="b-3">
            <div className="ta-section-head">
              <span className="ta-step-num" aria-hidden>3</span>
              <h3 id="b-3">Schedule</h3>
            </div>
            <div className="ta-form-grid">
              <TextField label="Opens" type="datetime-local" value={opens} onChange={(e) => setOpens(e.target.value)} hint="Dubai time" />
              <TextField label="Closes" type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} error={windowError} hint={windowError ? undefined : 'Leave empty for no closing time'} />
            </div>
          </section>
        </Card>

        <div className="stack">
          <Card>
            <CardHeader icon={ClipboardList} title="Progress" />
            <Steps
              steps={[
                { label: 'Details', done: !!title.trim(), meta: title.trim() ? `${kind === 'test' ? 'Test' : 'Quiz'} · ${own.find((s) => s.id === subjectId)?.short}` : 'Add a title' },
                { label: 'Blueprint', done: topicIds.length > 0, meta: `${topicIds.length} topic${topicIds.length === 1 ? '' : 's'} · ${count || 0} questions` },
                { label: 'Schedule', done: !!opens && !windowError, meta: windowError ?? 'Saved as a draft first' },
                { label: 'Paper built and checked', done: !!paper?.length, meta: paper ? `${paper.length} questions · ${totalMarks} marks` : 'Not built yet' },
              ]}
            />
          </Card>
          <Card className="ai-panel">
            <CardHeader icon={Sparkles} title="Build paper with AI" sub="Balances topics and orders easiest first" action={<AiTag>Demo AI</AiTag>} />
            <Callout tone="info" icon={Info}>Questions come only from your approved bank. Drafts and other teachers’ questions are never used.</Callout>
            <div className="row wrap" style={{ marginBlockStart: 14, gap: 8 }}>
              <Button className="btn-ai" icon={Sparkles} onClick={build} disabled={!topicIds.length}>
                {paper ? 'Rebuild paper' : 'Build paper with AI'}
              </Button>
              <Button icon={Save} onClick={save} disabled={!paper?.length || !title.trim() || !!windowError}>
                Save as draft
              </Button>
            </div>
            {!topicIds.length && <p className="field-error" style={{ marginBlockStart: 8 }}>Choose at least one topic.</p>}
            {paper && !title.trim() && <p className="small muted" style={{ marginBlockStart: 8 }}>Add a title to save.</p>}
            <p className="ta-disclosure" style={{ marginBlockStart: 14 }}>
              <Info size={13} aria-hidden />
              <span>{AI_DISCLOSURE}</span>
            </p>
          </Card>
        </div>
      </div>

      {paper && (
        <div className="grid-main">
          <Card className="card-flush ta-flush">
            <CardHeader icon={ClipboardList} title="Selected questions" sub="Remove anything you do not want; rebuild to start again" action={<AiTag>AI-selected</AiTag>} />
            <div className="ta-card-gap" />
            {paper.length < requested && (
              <div style={{ padding: '0 22px 12px' }}>
                <Callout tone="warning">
                  Only {paper.length} of {requested} requested questions could be selected from your approved bank. Generate and approve more in the Question bank, or add topics.
                </Callout>
              </div>
            )}
            {paper.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No questions selected">Rebuild the paper or choose different topics.</EmptyState>
            ) : (
              <ol className="ta-paper" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {paper.map((q, i) => (
                  <li key={q.id} className="ta-paper-row">
                    <span className="ta-qnum" aria-hidden>{i + 1}</span>
                    <div className="ta-paper-body">
                      <span className="ta-prompt">
                        <span className="sr-only">Question {i + 1}: </span>
                        {q.prompt}
                      </span>
                      <span className="ta-meta">
                        <span>{topics.find((t) => t.id === q.topicId)?.name}</span>
                        <span>
                          <Chip tone={TYPE[q.type].tone} dot={false}>{TYPE[q.type].label}</Chip>
                        </span>
                        <span className="ta-mono">{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
                        <span>
                          <Dots level={q.difficulty} />
                        </span>
                        {q.paperId && <span>Past paper</span>}
                      </span>
                    </div>
                    <div className="ta-paper-side">
                      <Button size="sm" variant="ghost" icon={X} aria-label={`Remove question ${i + 1}`} onClick={() => setPaper((p) => p!.filter((x) => x.id !== q.id))}>
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="ta-totals">
              <span><b>{paper.length}</b>questions</span>
              <span><b>{totalMarks}</b>marks</span>
              <span><b>{paper.filter((q) => q.type === 'short').length}</b>written</span>
              {kind === 'test' && <span><b>{duration || '—'}</b>minutes</span>}
            </div>
          </Card>
          <Card>
            <CardHeader icon={ClipboardList} title="Topic coverage" sub="Share of marks by topic" />
            <div className="ta-bars">
              {coverage.map((c) => {
                const pct = totalMarks ? Math.round((c.marks / totalMarks) * 100) : 0;
                return (
                  <div key={c.id} className="ta-bar">
                    <span>{c.name}</span>
                    <span className="ta-bar-value">{c.n} q · {c.marks} marks</span>
                    <div className="ta-bar-track" role="progressbar" aria-label={`${c.name}: ${pct}% of marks`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {coverage.some((c) => c.n === 0) && (
              <p className="small muted" style={{ marginBlockStart: 12 }}>
                {coverage.filter((c) => c.n === 0).map((c) => c.name).join(', ')} {coverage.filter((c) => c.n === 0).length === 1 ? 'has' : 'have'} no questions in this paper.
              </p>
            )}
            <p className="small muted" style={{ marginBlockStart: 12 }}>
              Difficulty mix: {[1, 2, 3].map((l) => `${paper.filter((q) => q.difficulty === l).length} ${['easy', 'medium', 'hard'][l - 1]}`).join(' · ')}
            </p>
          </Card>
        </div>
      )}
      <PageFoot />
    </>
  );
}
