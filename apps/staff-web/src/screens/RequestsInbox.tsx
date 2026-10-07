import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, HelpCircle, Inbox, ClipboardX, Search } from 'lucide-react';
import { Avatar, Card, Chip, EmptyState, Segmented, formatDate, formatTime } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor, RequestType } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';
import { REQUEST } from '../statuses';

const TYPE: Record<RequestType, { label: string; icon: typeof Clock }> = {
  'early-collection': { label: 'Early collection', icon: Clock },
  question: { label: 'Question', icon: HelpCircle },
  'absence-explanation': { label: 'Absence explanation', icon: ClipboardX },
  general: { label: 'General', icon: Inbox },
};

type F = 'open' | 'decision' | 'closed' | 'all';

export function RequestsInbox({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const all = staff.officeRequests(actor);
  const [f, setF] = useState<F>('open');
  const [q, setQ] = useState('');
  const isOpen = (s: string) => ['awaiting-approval', 'in-progress'].includes(s);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all
      .filter((r) => (f === 'all' ? true : f === 'open' ? isOpen(r.status) : f === 'decision' ? r.status === 'awaiting-approval' : !isOpen(r.status)))
      .filter((r) => !t || [r.id, r.subject, r.student.name, r.guardian.name].some((x) => x.toLowerCase().includes(t)));
  }, [all, f, q]);

  return (
    <>
      <PageHead title="Family requests" sub="School office queue · structured requests and escalated questions" spec="MVP · P07 / FR-Q01–Q03" />
      <div className="stats">
        <Stat value={all.filter((r) => r.status === 'awaiting-approval').length} label="Awaiting decision" tone="warning" />
        <Stat value={all.filter((r) => r.status === 'in-progress').length} label="Awaiting acknowledgements" />
        <Stat value={all.filter((r) => r.type === 'question').length} label="Escalated questions" foot="Not answerable from approved documents" tone="neutral" />
        <Stat value={all.filter((r) => !isOpen(r.status)).length} label="Resolved" tone="neutral" />
      </div>

      <Card className="card-flush">
        <div className="table-toolbar">
          <Segmented label="Filter requests" value={f} onChange={setF} options={[{ value: 'open', label: 'Open' }, { value: 'decision', label: 'Needs decision' }, { value: 'closed', label: 'Resolved' }, { value: 'all', label: 'All' }]} />
          <div className="search" style={{ marginInlineStart: 0, flex: '0 1 280px' }}>
            <Search size={16} aria-hidden />
            <label className="sr-only" htmlFor="req-search">Search requests</label>
            <input id="req-search" className="input" placeholder="Search requests" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <DataTable
          caption="Family requests"
          rows={rows}
          onRow={(r) => navigate(`/requests/${r.id}`)}
          empty={<EmptyState icon={Inbox} title="No requests here">New family requests appear here as soon as they are submitted.</EmptyState>}
          columns={[
            { key: 'id', label: 'Request', render: (r) => <span className="strong">{r.id}</span> },
            { key: 'f', label: 'Family', render: (r) => <span className="row"><Avatar initials={r.student.initials} /><span>{r.student.name}<br /><span className="small muted">{r.guardian.name}</span></span></span> },
            { key: 't', label: 'Type', render: (r) => { const T = TYPE[r.type]; return <span className="row small"><T.icon size={14} aria-hidden /> {T.label}</span>; } },
            { key: 's', label: 'Subject', render: (r) => <span style={{ maxWidth: 280, display: 'inline-block' }}>{r.subject}</span> },
            { key: 'at', label: 'Submitted', render: (r) => <span className="small">{formatDate(r.submittedAt)}, {formatTime(r.submittedAt)}</span> },
            { key: 'st', label: 'Status', render: (r) => <Chip tone={REQUEST[r.status].tone}>{REQUEST[r.status].label}</Chip> },
            { key: 'n', label: '', align: 'end', render: () => <ArrowRight size={16} className="muted" aria-hidden /> },
          ]}
        />
      </Card>
      <PageFoot />
    </>
  );
}
