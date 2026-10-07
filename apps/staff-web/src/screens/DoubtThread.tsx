import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Bot, MessagesSquare, Send, UserRound } from 'lucide-react';
import { Avatar, Button, Callout, Card, CardHeader, TextArea, errorText, formatDateTime, formatTime, useToast } from '@school-intel/ui';
import { AI_DISCLOSURE, getDb, teach, useDb } from '@school-intel/api';
import type { Actor, DoubtMessage } from '@school-intel/contracts';
import { AiTag, PageFoot, PageHead, Restricted, SubjectDot } from '../ui';
import { DoubtStatus } from './Doubts';
import '../teaching-b.css';

const SUGGESTED = [
  'Let’s go over this at the start of tomorrow’s lesson.',
  'Have a look at worked example 2 in the notes, then try 1/3 + 1/4.',
  'Good question. Try the first hint again and tell me which step you get stuck on.',
];

function Message({ m, initials }: { m: DoubtMessage; initials: string }) {
  return (
    <div className="tb-msg" data-from={m.from}>
      {m.from === 'ai' ? <span className="tb-ai-face" aria-hidden><Bot size={16} /></span> : <Avatar initials={m.from === 'student' ? initials : m.author.split(' ').map((p) => p[0]).slice(0, 2).join('')} />}
      <div className="tb-bubble">
        <span className="tb-msg-meta">
          <strong>{m.author}</strong>
          {m.from === 'ai' && <AiTag>Hints only</AiTag>}
          <span>{formatTime(m.at)}</span>
        </span>
        <span>{m.text}</span>
        {m.steps && m.steps.length > 0 && (
          <ol className="tb-steps" aria-label="Hint steps">
            {m.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        )}
        {m.sources?.map((s) => (
          <span key={s} className="tb-cite"><BookOpen size={12} aria-hidden />Source: {s}</span>
        ))}
      </div>
    </div>
  );
}

export function DoubtThread({ actor }: { actor: Actor }) {
  const { id = '' } = useParams();
  useDb();
  const toast = useToast();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  let inbox;
  try {
    inbox = teach.doubtsInbox(actor);
  } catch (e) {
    return <Restricted message={errorText(e)} />;
  }
  const x = inbox.list.find((y) => y.id === id);
  if (!x) return <Restricted message="This question is not for one of your subjects." />;
  const editable = x.subject.teacherId === actor.id;
  const others = inbox.list.filter((y) => y.studentId === x.studentId);
  const studentCount = getDb().doubts.filter((y) => y.studentId === x.studentId).length;

  const send = () => {
    try {
      teach.replyToDoubt(actor, x.id, text);
      setText('');
      setError('');
      toast(`Reply sent to ${x.student.firstName}`);
    } catch (e) {
      setError(errorText(e));
      toast(errorText(e), 'danger');
    }
  };

  return (
    <>
      <PageHead
        title={x.question}
        sub={<><SubjectDot hue={x.subject.hue} className="tb-inline-dot" />{x.subject.name}{x.topic ? ` · ${x.topic.name}` : ''} · asked {formatDateTime(x.createdAt)} <DoubtStatus status={x.status} /></>}
        spec="Teaching · Study helper escalations"
        actions={<Link to="/doubts" className="btn btn-secondary btn-sm"><ArrowLeft size={16} aria-hidden className="flip-rtl" />All questions</Link>}
      />

      <div className="grid-main">
        <div className="stack">
          <Card>
            <CardHeader icon={MessagesSquare} title="Conversation" sub={`${x.messages.length} message${x.messages.length === 1 ? '' : 's'} · the study helper gives hints, not answers`} />
            <div className="tb-thread">
              {x.messages.map((m, i) => <Message key={i} m={m} initials={x.student.initials} />)}
            </div>
            <p className="tb-note" style={{ marginBlockStart: 16 }}>{AI_DISCLOSURE}</p>
          </Card>

          {editable ? (
            <Card>
              <CardHeader icon={Send} title={`Reply to ${x.student.firstName}`} sub="Your reply goes to the student’s study helper thread and their notifications" />
              <div className="tb-composer">
                <div className="tb-chips" aria-label="Suggested replies">
                  {SUGGESTED.map((s) => (
                    <button key={s} type="button" className="tb-chip-btn" onClick={() => { setText(s); setError(''); }}>{s}</button>
                  ))}
                </div>
                <TextArea label="Your reply" value={text} onChange={(e) => { setText(e.target.value); setError(''); }} rows={4} error={error} placeholder={`Write to ${x.student.firstName}…`} />
                <div className="row wrap">
                  <Button icon={Send} onClick={send} disabled={!text.trim()}>Send reply</Button>
                  <span className="tb-note">Recorded in the audit log.</span>
                </div>
              </div>
            </Card>
          ) : (
            <Callout tone="neutral">Read only. Only the {x.subject.name} teacher can reply to this question.</Callout>
          )}
        </div>

        <div className="stack">
          <Card>
            <CardHeader icon={UserRound} title="Student" />
            <div className="tb-who" style={{ marginBlockEnd: 14 }}>
              <Avatar initials={x.student.initials} />
              <span><strong>{x.student.name}</strong><small>Year {x.student.classId} · {x.student.sisId}</small></span>
            </div>
            <dl className="kv">
              <dt>Class</dt><dd>{x.student.classId}</dd>
              <dt>Subject</dt><dd>{x.subject.name}</dd>
              <dt>Topic</dt><dd>{x.topic?.name ?? '—'}</dd>
              <dt>Questions asked</dt><dd className="mono">{studentCount}</dd>
            </dl>
            <Link to={`/students/${x.student.id}`} className="btn btn-secondary btn-sm" style={{ marginBlockStart: 16 }}>Open student record</Link>
          </Card>
          {others.length > 1 && (
            <Card>
              <CardHeader icon={MessagesSquare} title={`Other questions from ${x.student.firstName}`} />
              <ul className="list">
                {others.filter((o) => o.id !== x.id).map((o) => (
                  <li key={o.id} className="list-item">
                    <Link to={`/doubts/${o.id}`} className="grow" style={{ color: 'inherit', textDecoration: 'none' }}>
                      <span className="list-title">{o.question}</span><br />
                      <span className="list-meta">{o.subject.short} · {formatDateTime(o.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <PageFoot />
    </>
  );
}
