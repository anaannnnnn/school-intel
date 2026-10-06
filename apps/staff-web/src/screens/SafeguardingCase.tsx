import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileLock2, History, MessageCircleHeart, TriangleAlert, UserCheck } from 'lucide-react';
import { Avatar, Button, Callout, Card, CardHeader, Chip, Dialog, TextArea, errorText, formatDate, formatTime, useToast } from '@school-intel/ui';
import { getDb, staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { PageFoot, PageHead, Restricted, Stat } from '../ui';

type A = 'schedule' | 'note' | 'status' | 'close';
const COPY: Record<A, { title: string; label: string; hint: string }> = {
  schedule: { title: 'Schedule a private check-in', label: 'When and where', hint: 'For example: 6 Oct, 13:30 · pastoral office' },
  note: { title: 'Add restricted action', label: 'Action taken', hint: 'Visible only to authorised safeguarding staff.' },
  status: { title: 'Update the student’s safe status', label: 'Message the student will see', hint: 'Keep it reassuring and free of detail. It appears in the student’s app.' },
  close: { title: 'Close with safe follow-up plan', label: 'Follow-up plan', hint: 'Closure requires an action record and a plan.' },
};

export function SafeguardingCase({ actor }: { actor: Actor }) {
  const { id = '' } = useParams();
  useDb();
  const toast = useToast();
  const [a, setA] = useState<A | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  let c;
  try {
    c = staff.concern(actor, id);
  } catch (e) {
    return <Restricted message={errorText(e)} />;
  }
  const d = getDb();
  const lead = d.staff.find((s) => s.id === c.dutyLeadId)!;
  const backup = d.staff.find((s) => s.id === c.backupId)!;
  const closed = c.status === 'closed';

  return (
    <>
      <PageHead
        title={`${c.id} · Safeguarding case`}
        sub={<>Restricted to safeguarding lead · <Chip tone="restricted">Restricted evidence</Chip></>}
        spec="PHASE 2 · FR-C01–C04"
        actions={!closed && (
          <>
            {c.status === 'received' && <Button variant="brand" icon={UserCheck} onClick={() => { staff.concernAction(actor, c.id, 'acknowledge'); toast('Acknowledged'); }}>Acknowledge</Button>}
            <Button variant="secondary" onClick={() => setA('schedule')}>Schedule check-in</Button>
            <Button onClick={() => setA('note')}>Add restricted action</Button>
          </>
        )}
      />
      {c.primaryDelivery === 'failed' && (
        <Callout tone="warning" icon={TriangleAlert} title="Concern stored; primary notification delayed">The primary notification failed. Backup duty lead routing was used and assigned staff can open the case directly.</Callout>
      )}
      <div className="stats">
        <Stat value={c.id} label="Case reference" tone="neutral" />
        <Stat value={c.status === 'received' ? 'Pending' : 'Acknowledged'} label="Duty staff status" tone={c.status === 'received' ? 'danger' : undefined} />
        <Stat value="7 Oct" label="Follow-up due" tone="warning" />
      </div>
      <div className="grid-main">
        <div className="stack">
          <Card>
            <CardHeader icon={FileLock2} title="Confidential report" sub={`${c.category} · ${c.whenWhere || 'time not given'}`} />
            <div className="row" style={{ marginBlockEnd: 12 }}><Avatar initials={c.student.initials} /><span><strong>{c.student.name}</strong> · Year {c.student.classId}</span></div>
            <p className="draft-text">{c.description}</p>
            <dl className="kv" style={{ marginBlockStart: 14 }}>
              <dt>Contact preference</dt><dd>{c.contactPreference}</dd>
              <dt>Attachments</dt><dd>{c.attachments} {c.attachments === 1 ? 'file' : 'files'} · restricted</dd>
            </dl>
            <div style={{ marginBlockStart: 12 }}><Callout tone="neutral">No allegation is treated as established fact. Identity and attachments are visible only to authorised staff.</Callout></div>
          </Card>
          <Card>
            <CardHeader icon={MessageCircleHeart} title="Student-facing status" action={!closed && <Button size="sm" variant="ghost" onClick={() => { setA('status'); setText(c.studentStatus); }}>Update</Button>} />
            <p>“{c.studentStatus}”</p>
          </Card>
        </div>
        <div className="stack">
          <Card>
            <CardHeader icon={UserCheck} title="Required follow-up" />
            <dl className="kv">
              <dt>Duty lead</dt><dd>{lead.name}</dd>
              <dt>Primary notification</dt><dd>{c.primaryDelivery === 'delivered' ? <Chip tone="success">Delivered</Chip> : <Chip tone="warning">Failed · backup used</Chip>}</dd>
              <dt>Backup contact</dt><dd>{backup.name}</dd>
            </dl>
            <p className="small muted" style={{ marginBlockStart: 12 }}>Closure requires an authorised action record and safe follow-up plan.</p>
            {!closed && <Button size="sm" variant="secondary" style={{ marginBlockStart: 12 }} onClick={() => setA('close')}>Close case</Button>}
          </Card>
          <Card>
            <CardHeader icon={History} title="Timeline" sub="Every access and action is audited" />
            <ol className="timeline">
              {[...c.events].reverse().map((e, i) => (
                <li key={i} data-state="done">
                  <strong>{e.label}</strong>
                  <div className="small muted">{formatDate(e.at)}, {formatTime(e.at)} · {e.by}</div>
                  {e.note && <div className="small">{e.note}</div>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
      <PageFoot />
      <Dialog
        open={!!a}
        onClose={() => setA(null)}
        title={a ? COPY[a].title : ''}
        actions={<><Button variant="secondary" onClick={() => setA(null)}>Cancel</Button><Button onClick={() => {
          try {
            staff.concernAction(actor, c.id, a!, text);
            setA(null);
            setText('');
            toast('Saved to the restricted record');
          } catch (e) {
            setError(errorText(e));
          }
        }}>Save</Button></>}
      >
        {a && <TextArea label={COPY[a].label} hint={COPY[a].hint} value={text} onChange={(e) => { setText(e.target.value); setError(''); }} error={error} rows={4} />}
      </Dialog>
    </>
  );
}
