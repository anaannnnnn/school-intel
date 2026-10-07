import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Inbox, Info, UserPlus } from 'lucide-react';
import { Avatar, Button, Callout, Card, CardHeader, Chip, Dialog, EmptyState, SelectField, TextArea, errorText, formatDate, formatTime, useToast } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';
import { CASE } from '../statuses';

export function SupportQueue({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const toast = useToast();
  const cases = staff.supportCases(actor);
  const open = cases.filter((c) => !['closed', 'dismissed'].includes(c.status));
  const priority = open.find((c) => c.status !== 'insufficient-data');
  const [refer, setRefer] = useState(false);
  const students = staff.studentDirectory(actor);
  const [sid, setSid] = useState(students[0]?.id ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  return (
    <>
      <PageHead
        title="Student support queue"
        sub="Evidence-led check-ins · assigned cases only"
        spec="MVP · FR-S01–S04"
        actions={
          <>
            <Button variant="secondary" icon={UserPlus} onClick={() => setRefer(true)}>Create a referral</Button>
            {priority && <Button onClick={() => navigate(`/support/${priority.id}`)}>Investigate {priority.id}</Button>}
          </>
        }
      />
      <div className="stats">
        <Stat value={open.length} label="Open cases" />
        <Stat value={open.filter((c) => c.reviewDue <= '2026-10-07T23:59').length} label="Due by tomorrow" tone="warning" />
        <Stat value={open.filter((c) => c.status === 'insufficient-data').length} label="Awaiting data" tone="neutral" />
      </div>

      {open.length === 0 ? (
        <Card>
          <EmptyState icon={Inbox} title="Nothing needs your review" action={<Button variant="secondary" icon={UserPlus} onClick={() => setRefer(true)}>Create a referral</Button>}>
            <p>You have no assigned cases awaiting action. Last data reconciliation: 6 Oct, 09:15.</p>
            <p style={{ marginBlockStart: 6 }}>This does not indicate that every learner is free of concern.</p>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid-main">
          {priority && (
            <Card>
              <CardHeader icon={HeartHandshake} tone="warning" title="Today’s priority" sub={`${priority.student.name} · Year ${priority.student.classId}`} action={<Chip tone={CASE[priority.status].tone}>{CASE[priority.status].label}</Chip>} />
              <ul className="list">
                {priority.signals.map((s) => <li key={s} className="list-item">{s}</li>)}
              </ul>
              <div style={{ marginBlockStart: 14 }}>
                <Callout tone="neutral" icon={Info}>Review with the learner; these signals do not establish a diagnosis.</Callout>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader icon={Info} tone="info" title="Queue coverage" />
            <dl className="kv">
              <dt>Duty owner</dt><dd>Ms Aisha Rahman</dd>
              <dt>Review deadline</dt><dd>7 Oct, 15:00</dd>
            </dl>
            <ul className="list" style={{ marginBlockStart: 12 }}>
              <li className="list-item small muted">New alerts merge with an existing open case.</li>
              <li className="list-item small muted">Incomplete records pause rule evaluation.</li>
            </ul>
            <Button variant="ghost" size="sm" onClick={() => { const r = staff.evaluateSupportRules(); toast(`Rules re-run · ${r.created} new, ${r.merged} merged`); }}>Re-run rules now</Button>
          </Card>
        </div>
      )}

      {cases.length > 0 && (
        <Card className="card-flush table-card">
          <div className="table-toolbar"><h2 className="card-title">Assigned cases</h2></div>
          <DataTable
            caption="Assigned support cases"
            rows={cases}
            onRow={(c) => navigate(`/support/${c.id}`)}
            columns={[
              { key: 'id', label: 'Case', render: (c) => <span className="row"><Avatar initials={c.student.initials} /><span><span className="strong">{c.id}</span> · {c.student.firstName}</span></span> },
              { key: 'g', label: 'Group', render: (c) => c.student.classId },
              { key: 'r', label: 'Rule', render: (c) => <span className="small">{c.rule}</span> },
              { key: 's', label: 'Status', render: (c) => <Chip tone={CASE[c.status].tone}>{CASE[c.status].label}</Chip> },
              { key: 'd', label: 'Review due', render: (c) => `${formatDate(c.reviewDue)}, ${formatTime(c.reviewDue)}` },
              { key: 'o', label: 'Owner', render: (c) => c.owner },
              { key: 'n', label: '', align: 'end', render: () => <ArrowRight size={16} className="muted" aria-hidden /> },
            ]}
          />
        </Card>
      )}
      <PageFoot updated="6 Oct, 09:15" />

      <Dialog
        open={refer}
        onClose={() => setRefer(false)}
        title="Create a staff referral"
        actions={
          <>
            <Button variant="secondary" onClick={() => setRefer(false)}>Cancel</Button>
            <Button
              onClick={() => {
                try {
                  const r = staff.referStudent(actor, sid, reason);
                  setRefer(false);
                  setReason('');
                  toast(r.merged ? `Merged into open case ${r.id}` : `Referral ${r.id} created and assigned`);
                } catch (e) {
                  setError(errorText(e));
                }
              }}
            >
              Send referral
            </Button>
          </>
        }
      >
        <SelectField label="Learner" value={sid} onChange={(e) => setSid(e.target.value)} options={students.map((s) => ({ value: s.id, label: `${s.name} · ${s.classId}` }))} />
        <TextArea label="What did you observe?" value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} hint="Describe observable changes only. Avoid labels or diagnoses." error={error} rows={4} />
        <Callout tone="neutral">If the learner already has an open case, your referral is added to it rather than creating a duplicate.</Callout>
      </Dialog>
    </>
  );
}
