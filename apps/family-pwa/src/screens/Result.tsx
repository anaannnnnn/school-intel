import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleCheck, CircleX, Clock, Lightbulb, MessageCircleQuestion, NotebookPen, Target, TriangleAlert } from 'lucide-react';
import { Button, Callout, Card, Chip, Confetti, EmptyState, Steps, errorText, formatDate, formatTime, useToast } from '@school-intel/ui';
import { learn, useDb } from '@school-intel/api';
import type { AttemptItem, Question } from '@school-intel/contracts';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { Ring, SectionTitle } from '../kit';
import { KIND } from './Tests';
import '../student-c2.css';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function band(pct: number, first: string, parent: boolean) {
  const who = parent ? first : 'you';
  if (pct >= 90) return parent ? `Excellent work from ${first}.` : 'Brilliant work. You really know this topic.';
  if (pct >= 70) return parent ? `${first} has a good grasp of this, with a few things to tidy up.` : 'Good work. A couple of things to tidy up below.';
  if (pct >= 45) return parent ? `A solid start. The review shows what ${who} can practise next.` : 'A solid start. The review below shows what to practise next.';
  return parent ? `This topic needs more practice. The review shows where ${first} can focus.` : 'Every mistake here is something to learn from. Let’s go through them together.';
}

export function Result() {
  const { attemptId = '' } = useParams();
  const { actor, isParent, child } = useFamily();
  useDb();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState('');

  let r: ReturnType<typeof learn.attemptResult> | undefined;
  let error = '';
  try {
    r = learn.attemptResult(actor, attemptId);
  } catch (e) {
    error = errorText(e);
  }

  const back = isParent ? '/progress' : '/tests?tab=results';

  if (!r) {
    return (
      <>
        <PageHeader back={back} title="Result" />
        <Card>
          <EmptyState icon={TriangleAlert} title="This result isn’t available">{error}</EmptyState>
        </Card>
      </>
    );
  }

  const { attempt, assessment, subject, released, score, items, pending } = r;
  const kind = KIND[assessment.kind];
  const first = child?.firstName ?? '';

  const practise = (topicId: string) => {
    setBusy(topicId);
    try {
      const at = learn.startTopicPractice(actor, topicId);
      navigate(`/tests/play/${at.id}`);
    } catch (e) {
      toast(errorText(e), 'danger');
      setBusy('');
    }
  };

  if (!released) {
    const checking = attempt.status === 'submitted';
    return (
      <>
        <PageHeader back={back} eyebrow={`${subject.name} · ${kind.label}`} title={assessment.title} />
        <Card>
          <div className="stack">
            <div className="card-top">
              <span className="prow-tile" aria-hidden><Clock size={22} /></span>
              <div className="grow">
                <h3>{checking ? 'Thanks, your test is in' : 'Results on their way'}</h3>
                <p className="muted">{pending}</p>
              </div>
            </div>
            <Steps
              steps={[
                { label: 'Submitted', done: true, meta: attempt.submittedAt ? `${formatDate(attempt.submittedAt)}, ${formatTime(attempt.submittedAt)}` : undefined },
                { label: checking ? 'Teacher checks your written answer' : 'Marked', done: !checking, meta: checking ? 'Objective questions are already marked' : undefined },
                { label: 'Results released to you', done: false, meta: 'You’ll get a notification' },
              ]}
            />
          </div>
        </Card>
        <Callout tone="neutral" title="What happens next">
          Your answers are safe and can’t be changed. When your teacher releases results you’ll see your score, the correct answers and an explanation for every question.
        </Callout>
        <Link className="btn btn-secondary btn-block" to={back}>Back to tests</Link>
      </>
    );
  }

  const s = score!;
  const right = items.filter((x) => x.item.awarded === x.item.max).length;
  const mins = attempt.submittedAt ? Math.max(1, Math.round((Date.parse(attempt.submittedAt) - Date.parse(attempt.startedAt)) / 60000)) : undefined;

  return (
    <>
      <PageHeader back={back} eyebrow={`${subject.name} · ${kind.label}`} title={assessment.title} />

      {s.pct >= 70 && <Confetti />}
      <section className="hero-card" aria-label="Your score">
        <div className="score-hero">
          <Ring pct={s.pct} size={96} />
          <div className="grow">
            <span className="eyebrow">{isParent ? `${first}’s score` : 'Your score'}</span>
            <span className="marks">{s.got} / {s.max} marks</span>
            <p>{band(s.pct, first, isParent)}</p>
          </div>
        </div>
        <div className="mini-stats">
          <div><strong>{right}</strong><small>Correct</small></div>
          <div><strong>{items.length - right}</strong><small>To review</small></div>
          <div><strong>{mins ?? '–'}{mins ? <small> min</small> : null}</strong><small>Time taken</small></div>
        </div>
      </section>

      {attempt.teacherComment && (
        <Card>
          <div className="stack-sm">
            <p className="eyebrow">Teacher comment</p>
            <p>{attempt.teacherComment}</p>
          </div>
        </Card>
      )}

      <SectionTitle>Question by question</SectionTitle>
      {items.map((x, i) => (
        <ReviewCard
          key={x.question.id}
          n={i + 1}
          item={x.item}
          q={x.question}
          note={x.note}
          student={!isParent}
          subjectId={subject.id}
          busy={busy === x.question.topicId}
          onPractise={() => practise(x.question.topicId)}
        />
      ))}

      <Link className="btn btn-secondary btn-block" to={back}>{isParent ? 'Back to progress' : 'Back to tests'}</Link>
    </>
  );
}

function ReviewCard({ n, item, q, note, student, subjectId, busy, onPractise }: { n: number; item: AttemptItem; q: Question; note?: string; student: boolean; subjectId: string; busy: boolean; onPractise: () => void }) {
  const full = item.awarded === item.max;
  const some = (item.awarded ?? 0) > 0;
  const tone = full ? 'success' : some ? 'warning' : 'danger';
  const given = item.answer.trim();
  const ask = `/ask?subject=${encodeURIComponent(subjectId)}&q=${encodeURIComponent(`Can you help me understand this question? ${q.prompt}`)}`;

  return (
    <Card as="article" aria-labelledby={`rq-${q.id}`}>
      <div className="stack">
        <div className="qcard-head">
          <span className="row" style={{ gap: 6 }}>
            {full ? <CircleCheck size={18} color="var(--color-success)" aria-hidden /> : <CircleX size={18} color={some ? 'var(--color-warning-solid)' : 'var(--color-danger)'} aria-hidden />}
            <span className="eyebrow">Question {n}</span>
          </span>
          <Chip tone={tone} dot={false}>{item.awarded ?? 0} / {item.max} {item.max === 1 ? 'mark' : 'marks'}</Chip>
        </div>
        <h3 id={`rq-${q.id}`} style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.35 }}>{q.prompt}</h3>

        {q.type === 'mcq' && (
          <div className="options" role="list">
            {(q.options ?? []).map((o, i) => {
              const isCorrect = String(i) === q.answer;
              const isMine = String(i) === item.answer;
              const result = isCorrect ? 'right' : isMine ? 'wrong' : undefined;
              return (
                <div key={i} role="listitem" className="option" data-static data-result={result}>
                  <span className="letter" aria-hidden>{LETTERS[i]}</span>
                  <span>{o}</span>
                  {(isCorrect || isMine) && (
                    <span className="opt-tag">{isMine && isCorrect ? 'Your answer ✓' : isCorrect ? 'Correct answer' : 'Your answer'}</span>
                  )}
                </div>
              );
            })}
            {!given && <p className="small muted">You didn’t choose an answer.</p>}
          </div>
        )}

        {q.type === 'numeric' && (
          <div className="answer-pair">
            <div data-result={full ? 'right' : 'wrong'}>
              <small>Your answer</small>
              <strong>{given || '—'}</strong>
            </div>
            <div>
              <small>Correct answer</small>
              <strong>{q.answer}</strong>
            </div>
          </div>
        )}

        {q.type === 'short' && (
          <>
            <div className="stack-sm">
              <p className="eyebrow">Your answer</p>
              <p className="answer-text">{given || 'No answer given.'}</p>
            </div>
            {item.suggestions && item.suggestions.length > 0 && (
              <div className="stack-sm">
                <p className="eyebrow">Marked against</p>
                <ul className="criteria">
                  {item.suggestions.map((c) => {
                    const got = c.awarded ?? c.suggested;
                    const met = got === c.max ? 'yes' : got > 0 ? 'partly' : 'not yet';
                    return (
                      <li key={c.criterionId}>
                        <span className="crit-icon" data-met={met} aria-hidden>{met === 'yes' ? '✓' : met === 'partly' ? '◐' : '○'}</span>
                        <span className="grow">{c.criterion}</span>
                        <span className="crit-marks">{got}/{c.max}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}

        {note && <Callout tone="warning" icon={TriangleAlert}>{note}</Callout>}

        {q.type === 'short' ? (
          <div className="why"><NotebookPen size={16} aria-hidden /><span><strong>Model answer: </strong>{q.answer}</span></div>
        ) : (
          q.explanation && <div className="why"><Lightbulb size={16} aria-hidden /><span><strong>Why: </strong>{q.explanation}</span></div>
        )}

        {student && !full && (
          <div className="btn-row">
            <Link className="btn btn-sm btn-tonal" to={ask}>
              <MessageCircleQuestion size={16} aria-hidden /> Ask the study helper about this
            </Link>
            <Button size="sm" variant="secondary" icon={Target} busy={busy} onClick={onPractise}>Practise this topic</Button>
          </div>
        )}
      </div>
    </Card>
  );
}
