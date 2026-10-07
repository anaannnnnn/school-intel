import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, Chip, Segmented, formatDate, formatTime } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead } from '../ui';

export function AuditLog({ actor }: { actor: Actor }) {
  useDb();
  const [f, setF] = useState<'all' | 'denied'>('all');
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const rows = staff.auditLog(actor).filter((e) => (f === 'all' || e.outcome === 'denied') && (!t || [e.actor, e.action, e.target].some((x) => x.toLowerCase().includes(t))));
  return (
    <>
      <PageHead title="Audit log" sub="Every approval, access decision and workflow change · append-only" spec="MVP · audit events" />
      <Card className="card-flush">
        <div className="table-toolbar">
          <Segmented label="Filter" value={f} onChange={setF} options={[{ value: 'all', label: 'All events' }, { value: 'denied', label: 'Access denied' }]} />
          <div className="search" style={{ marginInlineStart: 0, flex: '0 1 300px' }}>
            <Search size={16} aria-hidden />
            <label className="sr-only" htmlFor="audit-search">Search audit log</label>
            <input id="audit-search" className="input" placeholder="Actor, action or record" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <DataTable caption="Audit events" rows={rows} columns={[
          { key: 'id', label: 'Event', render: (e) => <span className="small muted tabular">{e.id}</span> },
          { key: 't', label: 'Time', render: (e) => <span className="tabular">{formatDate(e.at)}, {formatTime(e.at)}</span> },
          { key: 'a', label: 'Actor', render: (e) => <span className="strong">{e.actor}</span> },
          { key: 'ac', label: 'Action', render: (e) => e.action },
          { key: 'r', label: 'Record', render: (e) => <span className="small">{e.target}</span> },
          { key: 'o', label: 'Outcome', render: (e) => (e.outcome === 'denied' ? <Chip tone="danger">Denied</Chip> : <Chip tone="success">Allowed</Chip>) },
        ]} />
      </Card>
      <PageFoot />
    </>
  );
}
