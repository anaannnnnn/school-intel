import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarClock, Send, Sparkles, TriangleAlert } from 'lucide-react';
import { Button, Callout, Card, Chip, Dialog, EmptyState, Steps, TextArea, errorText, formatDate, formatDateTime, useToast } from '@school-intel/ui';
import { learn, useDb } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { AiNote, Ring, SubjectTile } from '../kit';
import '../student-c2.css';

const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const MET = { yes: '✓', partly: '◐', 'not yet': '○' } as const;
type Feedback = ReturnType<typeof learn.checkDraft> & { text: string };

const draftKey = (studentId: string, id: string) => `school-intel:written-draft:${studentId}:${id}`;

function readDraft(key: string) {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

export function WrittenTask() {
  const { id = '' } = useParams();
  const { actor, isParent, child } = useFamily();
  useDb();
  if (!child) return null;
  let w: ReturnType<typeof learn.writtenTask> | undefined;
  let error = '';
  try {
    w = learn.writtenTask(actor, child.id, id);
  } catch (e) {
    error = errorText(e);
  }
  const back = isParent ? '/progress' : '/tests';
  if (!w) {
    return (
      <>
        <PageHeader back={back} title="Written task" />
        <Card><EmptyState icon={TriangleAlert} title="This task isn’t available">{error}</EmptyState></Card>
      </>
    );
  }

  const sub = w.submission;
  return (
    <>
      <PageHeader back={back} eyebrow={`${w.subject.name} · written task`} title={w.title} />

      <Card as="article" aria-label="Task">
        <div className="stack">
          <div className="card-top">
            <SubjectTile subjectId={w.subject.id} hue={w.subject.hue} />
            <div className="grow">
              <div className="chip-row">
                <Chip tone={sub ? 'success' : 'warning'}>{sub ? 'Submitted' : `Due ${formatDateTime(w.due)}`}</Chip>
                <Chip tone="neutral" dot={false}>{w.minWords}+ words</Chip>
              </div>
              <span className="small muted">{w.max} marks · marked by your teacher</span>
            </div>
          </div>
          <p style={{ lineHeight: 1.6 }}>{w.prompt}</p>
          <div className="stack-sm">
            <p className="eyebrow">What your teacher looks for</p>
            <ul className="rubric-list">
              {w.rubric.map((r) => (
                <li key={r.id}><span>{r.criterion}</span><b>{r.marks} {r.marks === 1 ? 'mark' : 'marks'}</b></li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {!sub ? (
        isParent ? (
          <Callout tone="neutral" icon={CalendarClock} title="Not submitted yet">
            {child.firstName} hasn’t submitted this task. It’s due {formatDateTime(w.due)}.
          </Callout>
        ) : (
          <Editor key={id} taskId={id} studentId={child.id} minWords={w.minWords} />
        )
      ) : (
        <Submitted w={w} parent={isParent} first={child.firstName} />
      )}
    </>
  );
}

function Editor({ taskId, studentId, minWords }: { taskId: string; studentId: string; minWords: number }) {
  const { actor } = useFamily();
  const toast = useToast();
  const key = draftKey(studentId, taskId);
  const [text, setText] = useState(() => readDraft(key));
  const [fb, setFb] = useState<Feedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const n = words(text);

  useEffect(() => {
    try {
      if (text) localStorage.setItem(key, text);
      else localStorage.removeItem(key);
    } catch {
      /* drafts are a convenience only */
    }
  }, [key, text]);

  const check = () => {
    setChecking(true);
    setTimeout(() => {
      try {
        setFb({ ...learn.checkDraft(actor, taskId, text), text });
      } catch (e) {
        toast(errorText(e), 'danger');
      }
      setChecking(false);
    }, 500);
  };

  const submit = () => {
    setBusy(true);
    try {
      learn.submitWritten(actor, taskId, text);
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      setConfirm(false);
      toast('Submitted. Your teacher will check it.');
    } catch (e) {
      toast(errorText(e), 'danger');
      setBusy(false);
      setConfirm(false);
    }
  };

  return (
    <>
      <div className="stack-sm">
        <TextArea label="Your paragraph" rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Start with your point: what do you think, and why?" hint="Your draft is saved on this device as you type." />
        <p className="word-count" data-ok={n >= minWords} aria-live="polite">{n} / {minWords} words</p>
      </div>

      <div className="btn-row">
        <Button variant="secondary" icon={Sparkles} busy={checking} disabled={n < 5} onClick={check}>Check my draft</Button>
        <Button variant="brand" icon={Send} disabled={n < Math.min(20, minWords)} onClick={() => setConfirm(true)}>Submit</Button>
      </div>

      {fb && (
        <Card className="ai-card" aria-live="polite">
          <div className="stack">
            <div className="row-between">
              <span className="ai-badge"><Sparkles size={12} aria-hidden /> AI feedback</span>
              <span className="small muted">{fb.words} words checked</span>
            </div>
            <p style={{ lineHeight: 1.6 }}>{fb.feedback}</p>
            <ul className="criteria">
              {fb.criteria.map((c) => (
                <li key={c.criterion}>
                  <span className="crit-icon" data-met={c.met} aria-hidden>{MET[c.met as keyof typeof MET]}</span>
                  <span className="grow">{c.criterion}</span>
                  <span className="small muted">{c.met === 'yes' ? 'Yes' : c.met === 'partly' ? 'Partly' : 'Not yet'}</span>
                </li>
              ))}
            </ul>
            {fb.text !== text && <p className="draft-note">You’ve changed your draft since this check.</p>}
            <AiNote>Feedback only — your teacher decides the marks.</AiNote>
          </div>
        </Card>
      )}

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Submit your work?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Keep editing</Button>
            <Button variant="brand" icon={Send} busy={busy} onClick={submit}>Submit</Button>
          </>
        }
      >
        <p>You’ve written <strong>{n} words</strong>. Once you submit you can’t change it.</p>
        {n < minWords && <Callout tone="warning">The task asks for at least {minWords} words. You can still submit, or keep writing.</Callout>}
        <p className="small muted">Your teacher reads your work and decides the marks. You’ll get a notification when feedback is ready.</p>
      </Dialog>
    </>
  );
}

function Submitted({ w, parent, first }: { w: ReturnType<typeof learn.writtenTask>; parent: boolean; first: string }) {
  const sub = w.submission!;
  const released = sub.status === 'released';
  const confirmed = sub.status === 'confirmed' || released;
  const pct = released && sub.total !== undefined ? Math.round((sub.total / w.max) * 100) : 0;

  return (
    <>
      <Card>
        <div className="stack">
          <p className="eyebrow">Status</p>
          <Steps
            steps={[
              { label: 'Submitted', done: true, meta: formatDateTime(sub.submittedAt) },
              { label: 'Teacher checking', done: confirmed, meta: confirmed ? 'Marks confirmed' : 'Your teacher reads every answer' },
              { label: 'Feedback released', done: released, meta: released ? 'Marks and comments below' : 'You’ll get a notification' },
            ]}
          />
        </div>
      </Card>

      {released && (
        <>
          <section className="hero-card" aria-label="Marks">
            <div className="score-hero">
              <Ring pct={pct} size={96} />
              <div className="grow">
                <span className="eyebrow">{parent ? `${first}’s marks` : 'Your marks'}</span>
                <span className="marks">{sub.total} / {w.max} marks</span>
                <p>Confirmed by your teacher</p>
              </div>
            </div>
          </section>

          <Card>
            <div className="stack">
              <p className="eyebrow">Marks by criterion</p>
              <ul className="criteria">
                {sub.suggestions.map((s) => {
                  const got = s.awarded ?? s.suggested;
                  const met = got === s.max ? 'yes' : got > 0 ? 'partly' : 'not yet';
                  return (
                    <li key={s.criterionId}>
                      <span className="crit-icon" data-met={met} aria-hidden>{MET[met]}</span>
                      <span className="grow">{s.criterion}</span>
                      <span className="crit-marks">{got}/{s.max}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>

          {sub.teacherFeedback && (
            <Card>
              <div className="stack-sm">
                <p className="eyebrow">Teacher feedback</p>
                <p style={{ lineHeight: 1.6 }}>{sub.teacherFeedback}</p>
              </div>
            </Card>
          )}

          {sub.aiFeedback && (
            <Card className="ai-card">
              <div className="stack-sm">
                <span className="ai-badge" style={{ alignSelf: 'flex-start' }}><Sparkles size={12} aria-hidden /> AI feedback</span>
                <p style={{ lineHeight: 1.6 }}>{sub.aiFeedback.replace(/\s*\(\d+\/\d+ suggested\)$/, '')}</p>
                <AiNote>Suggested by the study helper and checked by your teacher.</AiNote>
              </div>
            </Card>
          )}
        </>
      )}

      {parent ? (
        <details className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 800 }}>Read {first}’s answer</summary>
          <p className="answer-text" style={{ marginBlockStart: 12 }}>{sub.text}</p>
        </details>
      ) : (
        <Card>
          <div className="stack-sm">
            <div className="row-between">
              <p className="eyebrow">What you submitted</p>
              <span className="small muted">{words(sub.text)} words · {formatDate(sub.submittedAt)}</span>
            </div>
            <p className="answer-text">{sub.text}</p>
          </div>
        </Card>
      )}

      {!released && <Callout tone="neutral">Marks stay hidden until your teacher has checked your work and released feedback.</Callout>}
      {!parent && <Link className="btn btn-secondary btn-block" to="/tests?tab=results">Back to results</Link>}
    </>
  );
}
