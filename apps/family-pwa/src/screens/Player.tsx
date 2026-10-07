import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CircleCheck, Send, Timer, X } from 'lucide-react';
import { Button, Callout, Card, Chip, Dialog, EmptyState, Progress, TextArea, TextField, errorText, useToast } from '@school-intel/ui';
import { getDb, learn, nowIso, useDb } from '@school-intel/api';
import { useFamily } from '../family-context';
import { KIND } from './Tests';
import '../student-c2.css';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

/** Clock in demo time: the demo date with the real time of day (matches the API). */
const demoNow = () => Date.parse(nowIso());

function clock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function Player() {
  const { attemptId = '' } = useParams();
  const { actor } = useFamily();
  useDb();
  const at = getDb().attempts.find((a) => a.id === attemptId);
  if (at && at.status !== 'in-progress') return <Navigate to={`/tests/result/${attemptId}`} replace />;
  let data: ReturnType<typeof learn.player> | undefined;
  let error = '';
  try {
    data = learn.player(actor, attemptId);
  } catch (e) {
    error = errorText(e);
  }
  if (!data) {
    return (
      <Card>
        <EmptyState icon={X} title="This test can’t be opened" action={<a className="btn btn-secondary" href="#/tests">Back to tests</a>}>
          {error}
        </EmptyState>
      </Card>
    );
  }
  return <PlayerView key={attemptId} data={data} />;
}

function PlayerView({ data }: { data: ReturnType<typeof learn.player> }) {
  const { actor } = useFamily();
  const navigate = useNavigate();
  const toast = useToast();
  const { attempt, assessment, subject, questions, deadline } = data;
  const [idx, setIdx] = useState(() => Math.max(0, attempt.items.findIndex((i) => !i.answer)));
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(attempt.items.map((i) => [i.questionId, i.answer])));
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [now, setNow] = useState(demoNow);
  const submitted = useRef(false);
  const promptRef = useRef<HTMLHeadingElement>(null);

  const end = deadline ? Date.parse(deadline) : undefined;
  const left = end !== undefined ? end - now : undefined;
  const total = questions.length;
  const q = questions[idx];
  const answered = questions.filter((x) => (answers[x.id] ?? '').trim()).length;
  const unanswered = questions.map((x, i) => ({ x, i })).filter(({ x }) => !(answers[x.id] ?? '').trim());
  const k = KIND[assessment.kind];

  const submit = useCallback(
    (auto = false) => {
      if (submitted.current) return;
      submitted.current = true;
      try {
        learn.submitAttempt(actor, attempt.id);
        if (auto) toast('Time’s up. Your answers have been submitted.');
        navigate(`/tests/result/${attempt.id}`, { replace: true });
      } catch (e) {
        submitted.current = false;
        toast(errorText(e), 'danger');
      }
    },
    [actor, attempt.id, navigate, toast],
  );

  useEffect(() => {
    if (end === undefined) return;
    const t = setInterval(() => setNow(demoNow()), 1000);
    return () => clearInterval(t);
  }, [end]);

  useEffect(() => {
    if (left !== undefined && left <= 0) submit(true);
  }, [left, submit]);

  const go = (i: number) => {
    setIdx(i);
    requestAnimationFrame(() => promptRef.current?.focus());
  };

  const set = (value: string) => {
    setAnswers((a) => ({ ...a, [q.id]: value }));
    try {
      learn.saveAnswer(actor, attempt.id, q.id, value);
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const value = answers[q.id] ?? '';
  const low = left !== undefined && left < 120_000;

  return (
    <>
      <div className="player-top">
        <button type="button" className="icon-btn" aria-label="Leave test" onClick={() => setLeaveOpen(true)}>
          <X size={20} aria-hidden />
        </button>
        <div className="grow">
          <strong>{assessment.title}</strong>
          <small>{subject.name} · {k.label}</small>
        </div>
        {left !== undefined ? (
          <span className="timer" data-low={low} role="timer" aria-live={low ? 'polite' : 'off'} aria-label={`Time left ${clock(left)}`}>
            <Timer size={16} aria-hidden /> {clock(left)}
          </span>
        ) : (
          <Chip tone="neutral" dot={false}>Untimed</Chip>
        )}
      </div>

      <div className="stack-sm">
        <Progress value={(answered / total) * 100} label={`${answered} of ${total} answered`} />
        <div className="qdots" role="group" aria-label="Jump to question">
          {questions.map((x, i) => (
            <button
              key={x.id}
              type="button"
              aria-current={i === idx ? 'true' : undefined}
              data-answered={!!(answers[x.id] ?? '').trim()}
              aria-label={`Question ${i + 1}${(answers[x.id] ?? '').trim() ? ', answered' : ', not answered'}`}
              onClick={() => go(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <section className="qcard" aria-labelledby="qprompt">
        <div className="qcard-head">
          <p className="eyebrow">Question {idx + 1} of {total}</p>
          <Chip tone="info" dot={false}>{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</Chip>
        </div>
        <h2 className="qprompt" id="qprompt" tabIndex={-1} ref={promptRef}>{q.prompt}</h2>

        {q.type === 'mcq' && (
          <div className="options" role="group" aria-labelledby="qprompt">
            {(q.options ?? []).map((o, i) => (
              <button key={i} type="button" className="option" aria-pressed={value === String(i)} onClick={() => set(String(i))}>
                <span className="letter" aria-hidden>{LETTERS[i]}</span>
                <span>{o}</span>
              </button>
            ))}
          </div>
        )}

        {q.type === 'numeric' && (
          <TextField
            key={q.id}
            label="Your answer"
            className="input num-answer"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => set(e.target.value)}
            hint="Type a number. Fractions like 3/4 are fine."
          />
        )}

        {q.type === 'short' && (
          <div className="stack-sm">
            <TextArea key={q.id} label="Your answer" rows={8} value={value} onChange={(e) => set(e.target.value)} hint="Write in full sentences. Your teacher marks this answer." />
            <p className="word-count" aria-live="polite">{words(value)} words</p>
          </div>
        )}
      </section>

      <div className="player-nav">
        <Button variant="secondary" icon={ChevronLeft} disabled={idx === 0} onClick={() => go(idx - 1)}>Previous</Button>
        {idx < total - 1 ? (
          <Button variant="brand" onClick={() => go(idx + 1)}>
            Next <ChevronRight size={18} aria-hidden className="flip-rtl" />
          </Button>
        ) : (
          <Button variant="brand" icon={CircleCheck} onClick={() => setReviewOpen(true)}>Review &amp; submit</Button>
        )}
      </div>
      <p className="small muted" style={{ textAlign: 'center' }}>Answers save automatically.</p>

      <Dialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Ready to submit?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setReviewOpen(false)}>Keep checking</Button>
            <Button variant="brand" icon={Send} onClick={() => submit()}>Submit</Button>
          </>
        }
      >
        <div className="stack-sm">
          <p><strong>{answered} of {total}</strong> questions answered.</p>
          <Progress value={(answered / total) * 100} label={`${answered} of ${total} answered`} />
        </div>
        {unanswered.length > 0 ? (
          <div className="stack-sm">
            <p className="small muted">Not answered yet. Tap one to go back to it:</p>
            <ul className="unanswered">
              {unanswered.map(({ x, i }) => (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewOpen(false);
                      go(i);
                    }}
                  >
                    Question {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Callout tone="success" title="Every question has an answer" />
        )}
        <p className="small muted">
          {assessment.kind === 'test'
            ? 'You can’t change your answers after you submit. Your teacher releases results when the class has finished.'
            : 'You’ll see your score and explanations straight away.'}
        </p>
      </Dialog>

      <Dialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave for now?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setLeaveOpen(false)}>Keep going</Button>
            <Button variant="brand" onClick={() => navigate('/tests')}>Leave</Button>
          </>
        }
      >
        <p>Your answers are saved. You can resume from Tests.</p>
        {end !== undefined && <Callout tone="warning" title="The timer keeps running">Come back before it reaches zero, or your answers will be submitted automatically.</Callout>}
      </Dialog>
    </>
  );
}
