import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Users } from 'lucide-react';
import { Avatar, Card, Chip, EmptyState } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead } from '../ui';

export function Students({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const me = staff.me(actor);
  const all = staff.studentDirectory(actor);
  const t = q.trim().toLowerCase();
  const rows = all.filter((s) => !t || s.name.toLowerCase().includes(t) || s.classId.toLowerCase().includes(t) || s.guardians.some((g) => g.guardian.name.toLowerCase().includes(t)));

  return (
    <>
      <PageHead
        title="Students & families"
        sub={me.roles.some((r) => r !== 'teacher') ? 'All learners at Horizon Learning School · verified guardian relationships from the SIS' : `Your classes: ${me.classIds.join(', ')}`}
        spec="MVP · FR-F01 · roster and guardian verification"
      />
      <Card className="card-flush">
        <div className="table-toolbar">
          <span className="small muted">{rows.length} of {all.length} learners within your access</span>
          <div className="search" style={{ marginInlineStart: 0, flex: '0 1 300px' }}>
            <Search size={16} aria-hidden />
            <label className="sr-only" htmlFor="stu-search">Filter students</label>
            <input id="stu-search" className="input" placeholder="Name, class or guardian" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <DataTable
          caption="Students"
          rows={rows}
          onRow={(s) => navigate(`/students/${s.id}`)}
          empty={<EmptyState icon={Users} title="No learners match" />}
          columns={[
            { key: 'n', label: 'Learner', render: (s) => <span className="row"><Avatar initials={s.initials} /><span className="strong">{s.name}</span></span> },
            { key: 'c', label: 'Class', render: (s) => s.classId },
            { key: 'sis', label: 'SIS ID', render: (s) => <span className="small muted tabular">{s.sisId}</span> },
            {
              key: 'g',
              label: 'Guardians',
              render: (s) => (s.guardians.length ? s.guardians.map((g) => (
                <span key={g.guardianId} className="row small" style={{ gap: 6 }}>{g.guardian.name} {g.status === 'verified' ? <Chip tone="success">Verified</Chip> : <Chip tone="danger">Revoked</Chip>}</span>
              )) : <span className="small muted">Not available</span>),
            },
            { key: 'r', label: 'Open requests', render: (s) => (s.openRequests ? <Chip tone="warning">{s.openRequests}</Chip> : <span className="muted">—</span>) },
            { key: 'x', label: '', align: 'end', render: () => <ArrowRight size={16} className="muted" aria-hidden /> },
          ]}
        />
      </Card>
      <PageFoot updated="6 Oct, 09:15" />
    </>
  );
}
