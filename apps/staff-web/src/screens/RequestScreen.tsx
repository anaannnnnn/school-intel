import { Fragment, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUp, Check, ListChecks, MessagesSquare, ShieldCheck, UserRound } from 'lucide-react';
import { Avatar, Button, Callout, Card, CardHeader, Chip, Dialog, Steps, TextArea, errorText, formatDate, formatTime, useToast } from '@school-intel/ui';
import { getDb, staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { PageFoot, PageHead, Restricted } from '../ui';
import { REQUEST } from '../statuses';

export function RequestScreen({ actor }: { actor: Actor }) {
  const { id = '' } = useParams();
  useDb();
  const toast = useToast();
  const [reply, setReply] = useState('');
  const [decision, setDecision] = useState<'approve' | 'decline' | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  let r;
  try {
    r = staff.officeRequest(actor, id);
  } catch (e) {
    return <Restricted message={errorText(e)} />;
  }
  const d = getDb();
  const rel = d.relationships.find((x) => x.guardianId === r.guardianId && x.studentId === r.studentId);
  const siblings = d.relationships.filter((x) => x.guardianId === r.guardianId && x.studentId !== r.studentId && x.status === 'verified').map((x) => d.students.find((s) => s.id === x.studentId)!);
  const decidable = r.status === 'awaiting-approval';
  const isQuestion = r.type === 'question' || r.type === 'general';

  return (
    <>
      <PageHead
        title={r.subject}
        sub={<>{r.id} · submitted {formatDate(r.submittedAt)}, {formatTime(r.submittedAt)} · <Chip tone={REQUEST[r.status].tone}>{REQUEST[r.status].label}</Chip></>}
        spec="P07 · FR-Q01–Q03"
        actions={
          decidable && !isQuestion ? (
            <>
              <Button variant="secondary" onClick={() => setDecision('decline')}>Decline</Button>
              <Button variant="brand" icon={Check} onClick={() => setDecision('approve')}>Approve</Button>
            </>
          ) : undefined
        }
      />

      <div className="grid-main">
        <div className="stack">
          <Card>
            <CardHeader title="Request details" />
            <dl className="kv">
              {Object.entries(r.details).map(([k, v]) => (
                <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader icon={ListChecks} title="Workflow" sub={r.type === 'early-collection' ? 'Not confirmed to the family until every acknowledgement is recorded' : undefined} />
            <Steps
              steps={r.steps.map((s, i) => ({
                label: s.label,
                done: s.done,
                meta: s.done ? `${formatDate(s.at!)}, ${formatTime(s.at!)}` : r.status === 'in-progress' && i > 0 ? (
                  <button type="button" className="btn btn-ghost btn-sm" style={{ paddingInline: 0 }} onClick={() => { staff.completeRequestStep(actor, r.id, i); toast(`${s.label} recorded`); }}>Record acknowledgement</button>
                ) : undefined,
              }))}
            />
          </Card>

          <Card>
            <CardHeader icon={MessagesSquare} title="Conversation" sub="Visible to the family" />
            <div className="stack-sm">
              {r.messages.map((m, i) => (
                <div key={i} className="evidence" style={{ background: m.from === 'staff' ? 'var(--color-soft)' : undefined }}>
                  <Avatar initials={m.author.split(' ').map((x) => x[0]).join('')} />
                  <div className="grow">
                    <strong>{m.author}</strong> <span className="small muted">· {formatDate(m.at)}, {formatTime(m.at)}</span>
                    <p style={{ marginBlockStart: 2 }}>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {!['withdrawn', 'declined'].includes(r.status) && (
              <form
                className="stack-sm"
                style={{ marginBlockStart: 14 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    staff.answerRequest(actor, r.id, reply);
                    setReply('');
                    toast('Reply sent to the family');
                  } catch (err) {
                    toast(errorText(err), 'danger');
                  }
                }}
              >
                <TextArea label={isQuestion ? 'Answer the family' : 'Message the family'} value={reply} onChange={(e) => setReply(e.target.value)} rows={3} hint={isQuestion ? 'Answering resolves this question. Consider asking for the circular to be updated if this comes up often.' : undefined} />
                <div><Button type="submit" icon={ArrowUp} disabled={!reply.trim()}>{isQuestion ? 'Send answer' : 'Send message'}</Button></div>
              </form>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card>
            <CardHeader icon={UserRound} title="Family" />
            <div className="row" style={{ gap: 12, marginBlockEnd: 12 }}>
              <Avatar initials={r.student.initials} size="lg" />
              <div>
                <Link to={`/students/${r.studentId}`} className="strong" style={{ fontWeight: 600 }}>{r.student.name}</Link>
                <div className="small muted">Year {r.student.classId}</div>
              </div>
            </div>
            <dl className="kv">
              <dt>Guardian</dt><dd>{r.guardian.name}</dd>
              <dt>Relationship</dt><dd>{rel?.relationship} · {rel?.status === 'verified' ? <Chip tone="success">Verified</Chip> : <Chip tone="danger">Revoked</Chip>}</dd>
              <dt>Email</dt><dd style={{ wordBreak: 'break-all' }}>{r.guardian.email}</dd>
              <dt>Phone</dt><dd>{r.guardian.phone}</dd>
              {siblings.length > 0 && (<><dt>Siblings</dt><dd>{siblings.map((s) => <Link key={s.id} to={`/students/${s.id}`} style={{ marginInlineEnd: 8 }}>{s.name}</Link>)}</dd></>)}
            </dl>
          </Card>
          {r.type === 'early-collection' && (
            <Callout tone="info" icon={ShieldCheck} title="Identity and security">The collector must be on the authorised list and show photo ID at reception. Security receives the approved plan only.</Callout>
          )}
        </div>
      </div>
      <PageFoot />

      <Dialog
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision === 'approve' ? 'Approve this request?' : 'Decline this request?'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setDecision(null)}>Cancel</Button>
            <Button
              variant={decision === 'approve' ? 'brand' : 'danger'}
              onClick={() => {
                try {
                  staff.decideRequest(actor, r.id, decision!, note);
                  toast(decision === 'approve' ? 'Approved · class teacher notified' : 'Declined · family notified');
                  setDecision(null);
                  setNote('');
                } catch (e) {
                  setError(errorText(e));
                }
              }}
            >
              {decision === 'approve' ? 'Approve' : 'Decline'}
            </Button>
          </>
        }
      >
        {decision === 'approve' && <p>The class teacher is notified now. Security and transport must still acknowledge before the family sees the plan as confirmed.</p>}
        <TextArea label={decision === 'approve' ? 'Message to the family (optional)' : 'Reason for the family'} value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} error={error} rows={3} />
      </Dialog>
    </>
  );
}
