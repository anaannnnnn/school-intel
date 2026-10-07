import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowUp, BookOpen, CircleCheck, Eye, Lock, MessageCircleQuestion, Send, Sparkles, Timer, UserRound } from 'lucide-react';
import { Avatar, Button, Callout, Chip, Dialog, EmptyState, errorText, formatDate, formatTime, useToast } from '@school-intel/ui';
import { AI_LABEL, getDb, learn, useDb } from '@school-intel/api';
import type { DoubtMessage } from '@school-intel/contracts';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { AiNote } from '../kit';
import { DOUBT_STATUS } from './StudyHelper';
import '../student-c1.css';

export function DoubtThread() {
  const { id = '' } = useParams();
  const { actor } = useFamily();
  useDb();
  const navigate = useNavigate();
  const toast = useToast();
  const [reply, setReply] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [thinking, setThinking] = useState(false);
  // How many hint steps are showing in each helper message (by message index). Not stored.
  const [revealed, setRevealed] = useState<Record<number, number>>({});
  const end = useRef<HTMLDivElement>(null);

  let doubt: ReturnType<typeof learn.doubt> | undefined;
  let notFound: string | undefined;
  try {
    doubt = learn.doubt(actor, id);
  } catch (e) {
    notFound = errorText(e);
  }
  const count = doubt?.messages.length ?? 0;

  useEffect(() => {
    if (count > 2 || thinking) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [count, thinking]);

  if (!doubt) {
    return (
      <>
        <PageHeader title="Question" back="/ask" />
        <EmptyState icon={MessageCircleQuestion} title="Conversation not found" action={<Link to="/ask" className="btn btn-brand">Back to Ask</Link>}>
          {notFound}
        </EmptyState>
      </>
    );
  }

  const d = getDb();
  const teacherName = (doubt.subject && d.staff.find((s) => s.id === doubt.subject!.teacherId)?.name) ?? 'your teacher';
  const teacherInitials = teacherName.split(' ').map((p) => p[0]).join('').slice(0, 2);
  const access = learn.doubtAccess(actor);
  const active = learn.activeTest(actor);
  const status = DOUBT_STATUS[doubt.status];
  const escalated = doubt.status === 'escalated';
  const materials = d.materials.filter((m) => m.status === 'published');
  const doubtId = doubt.id;

  const run = (fn: () => void, ok?: string) => {
    try {
      fn();
      if (ok) toast(ok);
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = reply.trim();
    if (!text) return;
    setThinking(true);
    setTimeout(() => {
      run(() => learn.followUpDoubt(actor, doubtId, text));
      setReply('');
      setThinking(false);
    }, 500);
  };

  const shownFor = (i: number) => revealed[i] ?? 1;

  return (
    <>
      <PageHeader
        eyebrow={`${doubt.subject?.name ?? 'Study helper'} · ${formatDate(doubt.createdAt)}`}
        title="Your question"
        back="/ask"
        action={<Chip tone={status.tone} dot={false}>{status.label}</Chip>}
      />

      {!access.allowed && (
        <Callout tone="warning" icon={Lock} title={active ? 'Paused during your test' : 'Study helper unavailable'}>
          {access.reason}
          {active && (
            <div style={{ marginBlockStart: 8 }}>
              <Button size="sm" variant="brand" icon={Timer} onClick={() => navigate(`/tests/play/${active.id}`)}>Back to your test</Button>
            </div>
          )}
        </Callout>
      )}

      <div className="chat" aria-live="polite">
        {doubt.messages.map((m, i) => (
          <Message key={i} m={m} shown={shownFor(i)} onMore={() => setRevealed((r) => ({ ...r, [i]: shownFor(i) + 1 }))} materials={materials} />
        ))}
        {thinking && (
          <div className="bubble bubble-school" aria-label="The study helper is thinking">
            <span className="bubble-who">{AI_LABEL} <span className="ai-badge">AI</span></span>
            <span className="c1-thinking" aria-hidden><i /><i /><i /></span>
          </div>
        )}
        <div ref={end} />
      </div>

      <AiNote />

      {escalated ? (
        <div className="c1-waiting" role="status">
          <Avatar initials={teacherInitials} />
          <span>
            <strong style={{ display: 'block' }}>Waiting for {teacherName}</strong>
            Your teacher can see this whole conversation and will reply here, usually within a school day.
          </span>
        </div>
      ) : (
        actor.kind === 'student' && (
          <div className="c1-thread-actions">
            {doubt.status === 'resolved' ? (
              <Callout tone="success" icon={CircleCheck}>You marked this as solved. Still unsure? Ask a follow-up below.</Callout>
            ) : (
              <Button variant="secondary" icon={CircleCheck} block onClick={() => run(() => learn.resolveDoubt(actor, doubtId), 'Marked as solved. Nice work!')}>
                That helped
              </Button>
            )}
            <Button variant="ghost" className="btn-tonal" icon={UserRound} block onClick={() => setConfirm(true)}>
              Still stuck — ask my teacher
            </Button>
          </div>
        )
      )}

      {!escalated && actor.kind === 'student' && (
        <form className="composer" onSubmit={send} aria-label="Ask a follow-up question">
          <label htmlFor="follow-up" className="sr-only">Follow-up question</label>
          <input
            id="follow-up"
            className="input"
            placeholder={access.allowed ? 'Ask a follow-up…' : 'Paused for now'}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={!access.allowed || thinking}
            autoComplete="off"
            maxLength={600}
          />
          <button type="submit" className="btn btn-brand btn-icon" aria-label="Send follow-up" disabled={!access.allowed || !reply.trim() || thinking}>
            <ArrowUp size={18} aria-hidden />
          </button>
        </form>
      )}

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Send to ${teacherName}?`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Not yet</Button>
            <Button
              variant="brand"
              icon={Send}
              onClick={() => {
                setConfirm(false);
                run(() => learn.escalateDoubt(actor, doubtId), `Sent to ${teacherName}`);
              }}
            >
              Send to teacher
            </Button>
          </>
        }
      >
        <p>Your teacher will see this whole conversation, including your question and the hints the study helper gave.</p>
        <Callout tone="neutral" icon={Eye}>They usually reply within a school day. You can keep revising while you wait.</Callout>
      </Dialog>
    </>
  );
}

function Message({ m, shown, onMore, materials }: { m: DoubtMessage; shown: number; onMore: () => void; materials: { id: string; title: string }[] }) {
  if (m.from === 'student') {
    return (
      <div className="bubble bubble-me" dir="auto">
        <span className="sr-only">You said: </span>
        {m.text}
      </div>
    );
  }
  if (m.from === 'teacher') {
    return (
      <div className="bubble bubble-teacher">
        <span className="bubble-who"><UserRound size={13} aria-hidden /> {m.author} · Teacher</span>
        <p dir="auto">{m.text}</p>
        <span className="small muted">{formatTime(m.at)}</span>
      </div>
    );
  }
  const steps = m.steps ?? [];
  const visible = Math.min(shown, steps.length);
  return (
    <div className="bubble bubble-school">
      <span className="bubble-who">
        <Sparkles size={13} aria-hidden /> {AI_LABEL} <span className="ai-badge">AI</span>
      </span>
      <p dir="auto">{m.text}</p>
      {steps.length > 0 && (
        <>
          <ol className="hint-steps" aria-label={`Hints, ${visible} of ${steps.length} shown`}>
            {steps.map((s, i) =>
              i < visible ? (
                <li key={i} dir="auto">
                  <b aria-hidden>{i + 1}</b>
                  <span><span className="sr-only">Hint {i + 1}: </span>{s}</span>
                </li>
              ) : (
                <li key={i} data-hidden="true" aria-hidden>
                  <b>{i + 1}</b>
                  <span>Hint {i + 1} · try the step above first</span>
                </li>
              ),
            )}
          </ol>
          {visible < steps.length && (
            <Button size="sm" variant="ghost" className="btn-tonal c1-next-hint" icon={Sparkles} onClick={onMore}>
              Show next hint
            </Button>
          )}
        </>
      )}
      {m.sources && m.sources.length > 0 && (
        <div className="bubble-source">
          {m.sources.map((title) => {
            const mat = materials.find((x) => x.title === title);
            return mat ? (
              <Link key={title} to={`/material/${mat.id}`} className="c1-source">
                <BookOpen size={13} aria-hidden /> From your notes: {title}
              </Link>
            ) : (
              <span key={title} className="row" style={{ gap: 6 }}>
                <BookOpen size={13} aria-hidden /> From your notes: {title}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
