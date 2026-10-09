import { useMemo, useState } from 'react';
import { Check, CircleCheck, FileQuestion, Info, ListChecks, Pencil, Sparkles, Target, Trash2, X } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Chip, Dialog, EmptyState, Segmented, SelectField, TextArea, TextField, errorText, useToast, type Tone } from '@school-intel/ui';
import { AI_DISCLOSURE, getDb, teach, useDb } from '@school-intel/api';
import type { Actor, Question, QuestionType } from '@school-intel/contracts';
import { AiTag, DataTable, Heat, PageFoot, PageHead, Stat, SubjectDot } from '../ui';
import '../teaching-a.css';

type Row = ReturnType<typeof teach.questionBank>[number];

const TYPE: Record<QuestionType, { label: string; tone: Tone }> = {
  mcq: { label: 'Multiple choice', tone: 'info' },
  numeric: { label: 'Numeric', tone: 'neutral' },
  short: { label: 'Written', tone: 'restricted' },
};
const LETTERS = 'ABCDEFGH';

export function Dots({ level }: { level: number }) {
  return (
    <span className="ta-dots" data-level={level} role="img" aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <i key={i} data-on={i <= level} />
      ))}
    </span>
  );
}

/** Question body: prompt, options with the correct one marked, answer and explanation. */
export function QuestionBody({ q, wrong }: { q: Pick<Question, 'type' | 'prompt' | 'options' | 'answer' | 'explanation' | 'rubric'>; wrong?: string }) {
  return (
    <>
      {q.type === 'mcq' && q.options ? (
        <ul className="ta-options" aria-label="Options">
          {q.options.map((o, i) => {
            const correct = String(i) === q.answer;
            const isWrong = wrong !== undefined && String(i) === wrong;
            return (
              <li key={i} data-correct={correct} data-wrong={isWrong}>
                <span className="ta-opt-letter" aria-hidden>{LETTERS[i]}</span>
                <span>{o}</span>
                {correct && <span className="ta-opt-note" style={{ color: 'var(--color-success)' }}><Check size={12} aria-hidden style={{ display: 'inline', verticalAlign: -1 }} /> Correct</span>}
                {isWrong && <span className="ta-opt-note" style={{ color: 'var(--color-danger)' }}>Most common wrong answer</span>}
              </li>
            );
          })}
        </ul>
      ) : (
        <span className="ta-answer">
          <CircleCheck size={14} aria-hidden />
          {q.type === 'short' ? 'Model answer:' : 'Answer:'} {q.answer}
        </span>
      )}
      {q.rubric?.length ? (
        <div className="ta-explain">
          <strong>Mark scheme:</strong> {q.rubric.map((r) => `${r.criterion} (${r.marks})`).join(' · ')}
        </div>
      ) : null}
      {q.explanation && (
        <p className="ta-explain">
          <strong>Explanation:</strong> {q.explanation}
        </p>
      )}
    </>
  );
}

export function Questions({ actor }: { actor: Actor }) {
  useDb();
  const toast = useToast();
  const d = getDb();
  const bank = teach.questionBank(actor);
  const subjects = teach.subjectsVisible(actor);
  const own = teach.mySubjects(actor);
  const ownIds = new Set(own.map((s) => s.id));

  const [subject, setSubject] = useState(() => (own.length === 1 ? own[0].id : 'all'));
  const [topic, setTopic] = useState('all');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState<string | null>(null);

  const ownTopics = d.topics.filter((t) => ownIds.has(t.subjectId)).sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.order - b.order);
  const [genTopic, setGenTopic] = useState(ownTopics[0]?.id ?? '');
  const [genCount, setGenCount] = useState('3');

  // Facility is only meaningful where at least one answer has been marked.
  const answered = useMemo(() => {
    const set = new Set<string>();
    d.attempts.forEach((a) => a.status !== 'in-progress' && a.items.forEach((i) => i.awarded !== undefined && set.add(i.questionId)));
    return set;
  }, [d.attempts]);
  const facility = (q: Row) => (answered.has(q.id) ? q.facility?.pct : undefined);

  const rows = bank.filter(
    (q) =>
      (subject === 'all' || q.subjectId === subject) &&
      (topic === 'all' || q.topicId === topic) &&
      (type === 'all' || q.type === type) &&
      (status === 'all' || (status === 'ai' ? q.aiGenerated : q.status === status)),
  );
  const drafts = bank.filter((q) => q.status === 'draft');
  const myDrafts = drafts.filter((q) => ownIds.has(q.subjectId));
  const withData = bank.filter((q) => facility(q) !== undefined);
  const avgFacility = withData.length ? Math.round(withData.reduce((n, q) => n + (facility(q) ?? 0), 0) / withData.length) : undefined;
  const filterTopics = d.topics.filter((t) => (subject === 'all' ? subjects.some((s) => s.id === t.subjectId) : t.subjectId === subject));

  const review = (q: Row, decision: 'approve' | 'reject') => {
    try {
      teach.reviewQuestion(actor, q.id, decision);
      toast(decision === 'approve' ? `${q.id} approved · now available for quizzes and tests` : `${q.id} rejected and removed`);
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const generate = () => {
    try {
      const made = teach.generateQuestionDrafts(actor, genTopic, Number(genCount) || 1);
      const name = d.topics.find((t) => t.id === genTopic)?.name;
      toast(`${made.length} AI draft question${made.length === 1 ? '' : 's'} added for ${name} · review before use`);
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const current = open ? bank.find((q) => q.id === open) : undefined;

  return (
    <>
      <PageHead
        title="Question bank"
        sub={own.length ? `Approved questions feed your quizzes and tests · ${own.map((s) => s.name).join(', ')}` : 'Read-only view of every Year 7 question bank'}
        spec="Teaching · question bank"
      />

      <div className="stats">
        <Stat icon={ListChecks} value={bank.filter((q) => q.status === 'approved').length} label="Approved questions" />
        <Stat icon={Sparkles} value={drafts.length} label="AI drafts awaiting review" tone={drafts.length ? 'warning' : undefined} foot="Hidden from students" />
        <Stat icon={FileQuestion} value={bank.filter((q) => q.used > 0).length} label="Used in assessments" tone="neutral" />
        <Stat icon={Target} value={avgFacility === undefined ? '—' : `${avgFacility}%`} label="Average facility" foot={`Share of marks gained · ${withData.length} questions with answers`} tone={avgFacility !== undefined && avgFacility < 50 ? 'warning' : undefined} />
      </div>

      <div className="grid-main">
        <Card>
          <CardHeader icon={Sparkles} title="Review AI drafts" sub="Approve to add to the bank; reject to delete" action={<AiTag>{`${drafts.length} draft${drafts.length === 1 ? '' : 's'}`}</AiTag>} />
          {drafts.length === 0 ? (
            <EmptyState icon={CircleCheck} title="No drafts waiting">Generated questions appear here for you to check before anyone sees them.</EmptyState>
          ) : (
            <div>
              {drafts.map((q) => {
                const mine = ownIds.has(q.subjectId);
                return (
                  <article key={q.id} className="ta-draft" aria-labelledby={`dq-${q.id}`}>
                    <div className="ta-meta">
                      <span className="ta-subj">
                        <SubjectDot hue={q.subject.hue} />
                        {q.subject.short}
                      </span>
                      <span>{q.topic?.name}</span>
                      <span>{TYPE[q.type].label}</span>
                      <span>{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
                      <span className="ta-id">{q.id}</span>
                    </div>
                    <p className="ta-draft-prompt" id={`dq-${q.id}`}>{q.prompt}</p>
                    <QuestionBody q={q} />
                    {mine ? (
                      <div className="ta-draft-actions">
                        <Button size="sm" icon={Check} onClick={() => review(q, 'approve')}>Approve</Button>
                        <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setOpen(q.id)}>Edit first</Button>
                        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => review(q, 'reject')}>Reject</Button>
                      </div>
                    ) : (
                      <p className="small muted">Awaiting review by the {q.subject.name} teacher.</p>
                    )}
                  </article>
                );
              })}
              {myDrafts.length > 0 && (
                <p className="ta-disclosure" style={{ marginBlockStart: 14 }}>
                  <Info size={13} aria-hidden />
                  <span>{AI_DISCLOSURE}</span>
                </p>
              )}
            </div>
          )}
        </Card>

        {own.length ? (
          <Card className="ai-panel">
            <CardHeader icon={Sparkles} title="AI question generator" sub="Drafts questions from your published materials" action={<AiTag>Rules-based AI</AiTag>} />
            <div className="stack">
              <div className="ta-gen">
                <SelectField
                  label="Topic"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  options={ownTopics.map((t) => ({ value: t.id, label: `${d.subjects.find((s) => s.id === t.subjectId)?.short} · ${t.name}` }))}
                />
                <TextField label="How many" type="number" min={1} max={10} inputMode="numeric" value={genCount} onChange={(e) => setGenCount(e.target.value)} />
              </div>
              <Button className="btn-ai" icon={Sparkles} onClick={generate} disabled={!genTopic}>
                Generate drafts
              </Button>
              <Callout tone="info" icon={Info}>
                Drafts are never shown to students. They join the bank only after you approve them, and only approved questions are used to build quizzes and tests.
              </Callout>
              <p className="ta-disclosure">
                <Info size={13} aria-hidden />
                <span>{AI_DISCLOSURE}</span>
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader icon={Info} title="Read-only access" />
            <p className="small muted">Subject teachers generate, edit and approve questions. You can browse every bank and see how questions perform.</p>
          </Card>
        )}
      </div>

      <Card className="card-flush ta-flush">
        <div className="table-toolbar">
          <h2 className="card-title">All questions <span className="ta-id">· {rows.length} shown</span></h2>
          <div className="toolbar" role="group" aria-label="Filter questions">
            <label className="sr-only" htmlFor="qb-subject">Subject</label>
            <select id="qb-subject" className="select" value={subject} onChange={(e) => { setSubject(e.target.value); setTopic('all'); }}>
              <option value="all">All subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="qb-topic">Topic</label>
            <select id="qb-topic" className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="all">All topics</option>
              {filterTopics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="qb-type">Type</label>
            <select id="qb-type" className="select" value={type} onChange={(e) => setType(e.target.value)} style={{ minWidth: 130 }}>
              <option value="all">All types</option>
              {(Object.keys(TYPE) as QuestionType[]).map((k) => <option key={k} value={k}>{TYPE[k].label}</option>)}
            </select>
            <label className="sr-only" htmlFor="qb-status">Status</label>
            <select id="qb-status" className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 130 }}>
              <option value="all">Any status</option>
              <option value="approved">Approved</option>
              <option value="draft">Draft</option>
              <option value="ai">AI-generated</option>
            </select>
          </div>
        </div>
        <DataTable
          caption="Question bank"
          rows={rows}
          onRow={(q) => setOpen(q.id)}
          empty={<EmptyState icon={FileQuestion} title="No questions match">Try a different subject, topic or status.</EmptyState>}
          columns={[
            {
              key: 'p',
              label: 'Question',
              width: '38%',
              render: (q) => (
                <span className="stack-sm" style={{ gap: 2, maxWidth: 420 }}>
                  <span className="ta-clamp" style={{ fontWeight: 500 }}>{q.prompt}</span>
                  <span className="row" style={{ gap: 8 }}>
                    <SubjectDot hue={q.subject.hue} />
                    <span className="ta-id">{q.id}{q.paperId ? ' · past paper' : ''}</span>
                  </span>
                </span>
              ),
            },
            { key: 't', label: 'Topic', render: (q) => <span className="small">{q.topic?.name}</span> },
            { key: 'ty', label: 'Type', render: (q) => <Chip tone={TYPE[q.type].tone} dot={false}>{TYPE[q.type].label}</Chip> },
            { key: 'd', label: 'Level', render: (q) => <Dots level={q.difficulty} /> },
            { key: 'm', label: 'Marks', align: 'end', render: (q) => <span className="ta-mono">{q.marks}</span> },
            { key: 'f', label: 'Facility', align: 'end', render: (q) => <Heat pct={facility(q)} label={facility(q) === undefined ? 'No answers yet' : `Facility ${facility(q)}%`} /> },
            { key: 'u', label: 'Used', align: 'end', render: (q) => <span className="ta-mono">{q.used}×</span> },
            {
              key: 's',
              label: 'Status',
              render: (q) => (
                <span className="row wrap" style={{ gap: 6 }}>
                  {q.status === 'approved' ? <Chip tone="success">Approved</Chip> : <Chip tone="warning">Draft</Chip>}
                  {q.aiGenerated && <AiTag>AI</AiTag>}
                </span>
              ),
            },
          ]}
        />
      </Card>
      <PageFoot />

      {current && (
        <QuestionDialog
          key={current.id}
          actor={actor}
          row={current}
          editable={ownIds.has(current.subjectId)}
          facility={facility(current)}
          startEditing={current.status === 'draft' && ownIds.has(current.subjectId)}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

function QuestionDialog({ actor, row, editable, facility, startEditing, onClose }: { actor: Actor; row: Row; editable: boolean; facility?: number; startEditing: boolean; onClose: () => void }) {
  const toast = useToast();
  const base = getDb().questions.find((x) => x.id === row.id)!;
  const [editing, setEditing] = useState(startEditing);
  const [q, setQ] = useState<Question>(() => ({ ...base, options: base.type === 'mcq' ? [...(base.options ?? []), '', '', '', ''].slice(0, Math.max(4, base.options?.length ?? 0)) : base.options }));
  const set = <K extends keyof Question>(k: K, v: Question[K]) => setQ((x) => ({ ...x, [k]: v }));

  const save = () => {
    try {
      const options = q.type === 'mcq' ? (q.options ?? []).map((o) => o.trim()) : q.options;
      // Keep the correct option index stable when trailing blank options are dropped.
      const trimmed = q.type === 'mcq' ? options!.slice(0, Math.max(Number(q.answer) + 1, options!.reduce((n, o, i) => (o ? i + 1 : n), 0))) : options;
      teach.saveQuestion(actor, { ...q, options: trimmed, marks: Math.max(1, Number(q.marks) || 1) });
      toast(`${q.id} saved`);
      setEditing(false);
      onClose();
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? `Edit ${row.id}` : `Question ${row.id}`}
      actions={
        editing ? (
          <>
            <Button variant="secondary" onClick={() => (startEditing ? onClose() : setEditing(false))}>Cancel</Button>
            <Button onClick={save}>Save question</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" icon={X} onClick={onClose}>Close</Button>
            {editable && <Button icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>}
          </>
        )
      }
    >
      <div className="ta-meta">
        <span className="ta-subj">
          <SubjectDot hue={row.subject.hue} />
          {row.subject.short}
        </span>
        <span>{row.topic?.name}</span>
        <span>{TYPE[row.type].label}</span>
        <span>
          <Dots level={row.difficulty} />
        </span>
        {row.aiGenerated && <span><AiTag>AI-generated</AiTag></span>}
      </div>
      {editing ? (
        <div className="ta-dialog-wide">
          <TextArea label="Question" rows={3} value={q.prompt} onChange={(e) => set('prompt', e.target.value)} />
          {q.type === 'mcq' ? (
            <fieldset className="stack-sm" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
              <legend className="field-label" style={{ marginBlockEnd: 8 }}>Options · select the correct one</legend>
              {(q.options ?? []).map((o, i) => (
                <div key={i} className="ta-opt-edit">
                  <input type="radio" name="correct" aria-label={`Option ${LETTERS[i]} is correct`} checked={q.answer === String(i)} onChange={() => set('answer', String(i))} />
                  <input className="input" aria-label={`Option ${LETTERS[i]}`} value={o} placeholder={`Option ${LETTERS[i]}`} onChange={(e) => set('options', (q.options ?? []).map((x, j) => (j === i ? e.target.value : x)))} />
                </div>
              ))}
            </fieldset>
          ) : q.type === 'numeric' ? (
            <TextField label="Correct answer" value={q.answer} onChange={(e) => set('answer', e.target.value)} hint="Exact value students must enter, e.g. 5/12 or 75" />
          ) : (
            <TextArea label="Model answer" rows={4} value={q.answer} onChange={(e) => set('answer', e.target.value)} />
          )}
          <TextArea label="Explanation shown after marking" rows={2} value={q.explanation} onChange={(e) => set('explanation', e.target.value)} />
          <div className="ta-form-grid">
            <TextField label="Marks" type="number" min={1} max={20} value={String(q.marks)} onChange={(e) => set('marks', Number(e.target.value))} />
            <div className="field">
              <span className="field-label">Difficulty</span>
              <Segmented label="Difficulty" value={String(q.difficulty) as '1' | '2' | '3'} onChange={(v) => set('difficulty', Number(v) as 1 | 2 | 3)} options={[{ value: '1', label: 'Easy' }, { value: '2', label: 'Medium' }, { value: '3', label: 'Hard' }]} />
            </div>
          </div>
          {q.status === 'draft' && <p className="small muted">Saving keeps this question as a draft. Approve it from the review list when you are happy with it.</p>}
        </div>
      ) : (
        <>
          <p className="ta-draft-prompt">{row.prompt}</p>
          <QuestionBody q={row} />
          <div className="row wrap" style={{ gap: 16 }}>
            <span className="small muted">Marks <b className="ta-mono" style={{ color: 'var(--color-ink)' }}>{row.marks}</b></span>
            <span className="small muted">Used in <b className="ta-mono" style={{ color: 'var(--color-ink)' }}>{row.used}</b> assessment{row.used === 1 ? '' : 's'}</span>
            <span className="small muted row" style={{ gap: 6 }}>Facility <Heat pct={facility} /></span>
          </div>
          {!editable && <Callout tone="neutral">Only the {row.subject.name} teacher can edit this question.</Callout>}
        </>
      )}
    </Dialog>
  );
}
