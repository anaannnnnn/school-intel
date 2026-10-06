import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { Callout, Card, Chip, formatDate, formatTime } from '@school-intel/ui';
import { getDb, staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';

const STATUS = { received: { l: 'New · unacknowledged', t: 'danger' }, acknowledged: { l: 'Acknowledged', t: 'info' }, 'check-in-scheduled': { l: 'Check-in scheduled', t: 'success' }, closed: { l: 'Closed', t: 'neutral' } } as const;

export function Safeguarding({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const list = staff.concerns(actor);
  const d = getDb();
  return (
    <>
      <PageHead title="Safeguarding workspace" sub="Restricted to the designated safeguarding lead and authorised duty staff" spec="PHASE 2 · FR-C01–C04" />
      <Callout tone="neutral" icon={Lock}>Reports are stored in a separate restricted boundary. They never appear in general search, AI retrieval, student profiles or notification previews.</Callout>
      <div className="stats">
        <Stat value={list.filter((c) => c.status === 'received').length} label="Awaiting acknowledgement" tone="danger" />
        <Stat value={list.filter((c) => c.status !== 'closed').length} label="Open reports" />
        <Stat value={list.filter((c) => c.primaryDelivery === 'failed').length} label="Primary delivery failures" foot="Backup routing used" tone="warning" />
      </div>
      <Card className="card-flush table-card">
        <div className="table-toolbar"><h2 className="card-title">Reports</h2></div>
        <DataTable
          caption="Safeguarding reports"
          rows={list}
          onRow={(c) => navigate(`/safeguarding/${c.id}`)}
          columns={[
            { key: 'id', label: 'Reference', render: (c) => <span className="strong">{c.id}</span> },
            { key: 'r', label: 'Received', render: (c) => `${formatDate(c.receivedAt)}, ${formatTime(c.receivedAt)}` },
            { key: 'c', label: 'Category', render: (c) => c.category },
            { key: 'l', label: 'Duty lead', render: (c) => d.staff.find((s) => s.id === c.dutyLeadId)?.name },
            { key: 'st', label: 'Status', render: (c) => <Chip tone={STATUS[c.status].t}>{STATUS[c.status].l}</Chip> },
            { key: 'n', label: '', align: 'end', render: () => <ArrowRight size={16} className="muted" aria-hidden /> },
          ]}
        />
      </Card>
      <PageFoot />
    </>
  );
}
