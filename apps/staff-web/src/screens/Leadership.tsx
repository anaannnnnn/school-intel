import { ClipboardList, Ruler } from 'lucide-react';
import { Card, CardHeader, Chip, formatTime } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';

export function Leadership({ actor }: { actor: Actor }) {
  useDb();
  const m = staff.leadershipMetrics(actor);
  const actions = [
    m.pendingRegisters ? { what: `${m.pendingRegisters} registers incomplete`, owner: 'Attendance officer' } : null,
    m.quarantined ? { what: `${m.quarantined} SIS import needs mapping review`, owner: 'School IT' } : null,
    m.support.open ? { what: `${m.support.open} support cases open`, owner: 'Pastoral team' } : null,
    m.requests.open ? { what: `${m.requests.open} family requests open`, owner: 'School office' } : null,
  ].filter(Boolean) as { what: string; owner: string }[];
  const metrics = [
    { name: 'Confirmed attendance', value: `${m.attendance.value.toFixed(1)}%`, def: 'Confirmed present ÷ pupils on complete registers', denom: `${m.attendance.denominator} pupils`, owner: m.attendance.owner, fresh: `SIS ${formatTime(m.attendance.freshness)}` },
    { name: 'Support cases with an owner', value: `${m.support.owned}/${m.support.open}`, def: 'Open cases with an assigned owner', denom: `${m.support.open} open cases`, owner: m.support.owner, fresh: 'Live' },
    { name: 'Report comments published', value: `${m.drafts.published}/${m.drafts.total}`, def: 'Teacher-approved comments published this term', denom: `${m.drafts.total} drafts`, owner: m.drafts.owner, fresh: 'Live' },
    { name: 'Open family requests', value: `${m.requests.open}`, def: 'Requests awaiting decision or acknowledgement', denom: `${m.requests.total} this week`, owner: m.requests.owner, fresh: 'Live' },
  ];
  return (
    <>
      <PageHead title="School leadership overview" sub="Horizon Learning School · synthetic operational metrics · current week" spec="MVP + PHASED METRICS · P12" />
      <div className="stats">
        <Stat value={`${m.attendance.value.toFixed(1)}%`} label="Confirmed attendance" foot={`${m.attendance.numerator} of ${m.attendance.denominator} pupils`} />
        <Stat value={`${m.support.open ? Math.round((m.support.owned / m.support.open) * 100) : 100}%`} label="Support cases with an owner" />
        <Stat value="24%" label="Pilot drafting time reduction" foot="Sample: 20 teachers · illustrative only" tone="neutral" />
      </div>
      <div className="grid-2">
        <Card>
          <CardHeader icon={ClipboardList} title="Actions needing ownership" />
          <ul className="list">
            {actions.map((a) => <li key={a.what} className="list-item"><span className="grow">{a.what}</span><Chip tone="info" dot={false}>{a.owner}</Chip></li>)}
          </ul>
          <p className="small muted" style={{ marginBlockStart: 10 }}>Operational actions link to assigned workflows. Leadership sees aggregates, never confidential case notes.</p>
        </Card>
        <Card>
          <CardHeader icon={Ruler} title="Measurement definitions" />
          <ul className="list small">
            <li className="list-item">Attendance = confirmed present ÷ complete-register pupils.</li>
            <li className="list-item">Drafting reduction = median matched-task time vs pilot baseline.</li>
            <li className="list-item">Review SLA = eligible cases reviewed within the school’s working-day policy.</li>
          </ul>
        </Card>
      </div>
      <Card className="card-flush table-card">
        <div className="table-toolbar"><h2 className="card-title">Metric register</h2></div>
        <DataTable caption="Metric register" rows={metrics} columns={[
          { key: 'n', label: 'Metric', render: (r) => <span className="strong">{r.name}</span> },
          { key: 'v', label: 'Value', render: (r) => <span className="tabular">{r.value}</span> },
          { key: 'd', label: 'Definition', render: (r) => <span className="small">{r.def}</span> },
          { key: 'dn', label: 'Denominator', render: (r) => r.denom },
          { key: 'o', label: 'Owner', render: (r) => r.owner },
          { key: 'f', label: 'Freshness', render: (r) => <span className="small muted">{r.fresh}</span> },
        ]} />
      </Card>
      <PageFoot updated="6 Oct, 09:15" />
    </>
  );
}
