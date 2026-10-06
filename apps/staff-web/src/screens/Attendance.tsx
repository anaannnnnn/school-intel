import { BellOff, ClipboardCheck, FileText } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Chip, formatDate, formatTime, useToast } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';

export function Attendance({ actor }: { actor: Actor }) {
  useDb();
  const toast = useToast();
  const a = staff.attendance(actor);
  const me = staff.me(actor);
  const canComplete = (classId: string) => me.roles.includes('attendance') || me.classIds.includes(classId);
  const awaiting = a.explanations.filter((e) => e.status === 'awaiting-review');
  const pending = a.registers.filter((r) => r.status === 'pending');

  return (
    <>
      <PageHead title="Attendance reconciliation" sub="Tuesday, 6 October · Official SIS register · 09:15 update" spec="PHASE 2 · FR-A01–A04" />
      <div className="stats">
        <Stat value={`${a.presentRate.toFixed(1)}%`} label="Confirmed present" foot="Complete registers only" />
        <Stat value={a.pending} label="Registers pending" tone={a.pending ? 'warning' : undefined} />
        <Stat value={awaiting.length} label="Explanations awaiting review" tone="neutral" />
      </div>
      <div className="grid-2">
        <Card>
          <CardHeader icon={BellOff} tone="warning" title="Register quality" />
          {pending.length ? (
            <ul className="list">
              {pending.map((r) => <li key={r.id} className="list-item">{r.label} {r.period.toLowerCase()} is incomplete · absence notifications paused.</li>)}
            </ul>
          ) : <p>All registers are complete. Absence notifications are active.</p>}
          <p className="small muted" style={{ marginBlockStart: 10 }}>Only authorised attendance officers can correct the official record.</p>
        </Card>
        <Card>
          <CardHeader icon={FileText} title="Guardian explanations" />
          {a.explanations.map((e) => (
            <div key={e.id} className="evidence">
              <div className="grow">
                <strong>{e.student}</strong> · {e.reason} · {formatDate(e.date)}
                <small>Received from verified guardian {e.guardian} at {formatTime(e.receivedAt)}{e.hasAttachment ? ' · attachment restricted to attendance staff' : ''}</small>
              </div>
              {e.status === 'awaiting-review' ? (
                a.canAmend ? (
                  <span className="row">
                    <Button size="sm" variant="secondary" onClick={() => { staff.reviewExplanation(actor, e.id, 'queried'); toast('Guardian asked for more detail'); }}>Query</Button>
                    <Button size="sm" variant="brand" onClick={() => { staff.reviewExplanation(actor, e.id, 'accepted'); toast('Accepted · register amended as authorised absence'); }}>Accept</Button>
                  </span>
                ) : <Chip tone="warning">Awaiting review</Chip>
              ) : <Chip tone={e.status === 'accepted' ? 'success' : 'info'}>{e.status === 'accepted' ? 'Accepted · register amended' : 'Queried'}</Chip>}
            </div>
          ))}
          {!a.canAmend && <div style={{ marginBlockStart: 12 }}><Callout tone="neutral">Only an attendance officer can accept explanations and amend the register.</Callout></div>}
        </Card>
      </div>
      <Card className="card-flush table-card">
        <div className="table-toolbar"><h2 className="card-title">Registers</h2></div>
        <DataTable
          caption="Registers"
          rows={a.registers}
          columns={[
            { key: 'c', label: 'Class', render: (r) => <span className="strong">{r.label}</span> },
            { key: 'p', label: 'Period', render: (r) => r.period },
            { key: 'n', label: 'Recorded', render: (r) => <span className="tabular">{r.recorded} / {r.total}</span> },
            { key: 's', label: 'Status', render: (r) => (r.status === 'complete' ? <Chip tone="success">Complete · fresh</Chip> : <Chip tone="warning">Pending · notifications paused</Chip>) },
            { key: 'u', label: 'Updated', render: (r) => formatTime(r.updatedAt) },
            { key: 'a', label: '', align: 'end', render: (r) => (r.status === 'pending' && canComplete(r.classId) ? <Button size="sm" variant="secondary" icon={ClipboardCheck} onClick={() => { staff.completeRegister(actor, r.id); toast(`${r.label} register completed`); }}>Complete</Button> : null) },
          ]}
        />
      </Card>
      <PageFoot updated="6 Oct, 09:15" />
    </>
  );
}
