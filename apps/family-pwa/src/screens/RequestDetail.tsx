import { Fragment, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowUp, ListChecks, MessagesSquare, Phone } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Chip, Dialog, Steps, errorText, formatDate, formatTime, useToast } from '@school-intel/ui';
import { AccessDenied, family, getDb, useDb } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { REQUEST_STATUS } from '../statuses';

export function RequestDetail() {
  const { id = '' } = useParams();
  const { actor } = useFamily();
  useDb();
  const toast = useToast();
  const [reply, setReply] = useState('');
  const [confirm, setConfirm] = useState(false);

  let r;
  try {
    r = family.getRequest(actor, id);
  } catch (e) {
    return (
      <>
        <PageHeader back="/requests" title="Request unavailable" />
        <Callout tone="danger">{e instanceof AccessDenied ? e.message : errorText(e)}</Callout>
      </>
    );
  }
  const student = getDb().students.find((s) => s.id === r.studentId);
  const st = REQUEST_STATUS[r.status];

  return (
    <>
      <PageHeader back="/requests" eyebrow={`${r.id} · ${student?.firstName}`} title={r.status === 'awaiting-approval' && r.messages.length <= 1 ? 'Request received' : r.subject} />
      <div className="row wrap"><Chip tone={st.tone}>{st.label}</Chip><span className="small muted">Submitted {formatDate(r.submittedAt)}, {formatTime(r.submittedAt)}</span></div>

      <Card>
        <CardHeader title={r.subject} sub="Assigned to: School office" />
        <dl className="kv">
          {Object.entries(r.details).map(([k, v]) => (
            <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>
          ))}
        </dl>
      </Card>

      <Card>
        <CardHeader icon={ListChecks} title="What happens next" />
        <Steps steps={r.steps.map((s) => ({ label: s.label, done: s.done, meta: s.at ? `${formatDate(s.at)}, ${formatTime(s.at)}` : undefined }))} />
        {r.type === 'early-collection' && r.status !== 'approved' && (
          <p className="small muted" style={{ marginBlockStart: 12 }}>We will notify you when the plan is confirmed. Until then, no collection arrangement is in place.</p>
        )}
      </Card>

      <Card>
        <CardHeader icon={MessagesSquare} title="Messages" />
        <div className="chat">
          {r.messages.map((m, i) => (
            <div key={i} className={`bubble ${m.from === 'guardian' ? 'bubble-me' : 'bubble-school'}`}>
              <p>{m.text}</p>
              <p className="small" style={{ opacity: 0.75, marginBlockStart: 4 }}>{m.author} · {formatTime(m.at)}</p>
            </div>
          ))}
          {r.messages.length === 0 && <p className="small muted">No messages yet.</p>}
        </div>
        {!['withdrawn', 'declined'].includes(r.status) && (
          <form
            className="composer"
            style={{ position: 'static', marginBlockStart: 12, boxShadow: 'none' }}
            onSubmit={(e) => {
              e.preventDefault();
              try {
                family.replyToRequest(actor, r.id, reply);
                setReply('');
              } catch (err) {
                toast(errorText(err), 'danger');
              }
            }}
          >
            <label htmlFor="reply" className="sr-only">Message the office</label>
            <input id="reply" className="input" placeholder="Message the office…" value={reply} onChange={(e) => setReply(e.target.value)} />
            <button type="submit" className="btn btn-brand btn-icon" aria-label="Send message" disabled={!reply.trim()}><ArrowUp size={18} aria-hidden /></button>
          </form>
        )}
      </Card>

      {r.status === 'awaiting-approval' && (
        <Card>
          <CardHeader title="Need to change your request?" sub="Edit or withdraw before approval." />
          <div className="stack-sm">
            <Button variant="secondary" block onClick={() => setConfirm(true)}>Withdraw request</Button>
            <a className="btn btn-ghost btn-block" href="tel:+97140000000"><Phone size={16} aria-hidden /> For urgent changes, call the office</a>
          </div>
        </Card>
      )}

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Withdraw this request?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Keep request</Button>
            <Button variant="danger" onClick={() => { family.withdrawRequest(actor, r.id); setConfirm(false); toast('Request withdrawn'); }}>Withdraw</Button>
          </>
        }
      >
        <p>The office will stop processing {r.id}. You can submit a new request at any time.</p>
      </Dialog>
    </>
  );
}
