import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, ListTodo, Sparkles } from 'lucide-react';
import { Card, CardHeader, Chip, EmptyState, formatTime, type Tone } from '@school-intel/ui';
import { getDb, staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';

interface Row {
  record: string;
  group: string;
  status: string;
  tone: Tone;
  next: string;
  to: string;
}

export function Overview({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const o = staff.overviewFor(actor);
  const me = o.staff;
  const d = getDb();
  const name = (id: string) => d.students.find((s) => s.id === id)?.name ?? '';
  const isTeacher = me.roles.includes('teacher');
  const pendingDrafts = o.drafts.filter((x) => ['draft', 'edited', 'missing-evidence'].includes(x.state));
  const approved = o.drafts.filter((x) => ['approved', 'published'].includes(x.state)).length;

  const rows: Row[] = [
    ...pendingDrafts.map((x) => ({
      record: name(x.studentId),
      group: `Year ${x.classId}`,
      status: x.state === 'missing-evidence' ? 'Missing evidence' : `${x.subject} draft v${x.versions.length}`,
      tone: (x.state === 'missing-evidence' ? 'warning' : 'info') as Tone,
      next: x.state === 'missing-evidence' ? 'Add teacher note' : 'Review draft',
      to: `/copilot/${x.id}`,
    })),
    ...o.cases.map((c) => ({
      record: `${c.id} · ${name(c.studentId).split(' ')[0]}`,
      group: `Year ${d.students.find((s) => s.id === c.studentId)?.classId}`,
      status: c.status === 'insufficient-data' ? 'Insufficient data' : 'Review due',
      tone: (c.status === 'insufficient-data' ? 'neutral' : 'warning') as Tone,
      next: 'Open case',
      to: `/support/${c.id}`,
    })),
    ...o.requests.map((r) => ({
      record: `${r.id} · ${name(r.studentId).split(' ')[0]}`,
      group: formatTime(r.submittedAt),
      status: r.subject,
      tone: (r.status === 'awaiting-approval' ? 'warning' : 'info') as Tone,
      next: r.status === 'awaiting-approval' ? 'Decide' : 'Record acknowledgements',
      to: `/requests/${r.id}`,
    })),
    ...o.concerns.map((c) => ({ record: c.id, group: formatTime(c.receivedAt), status: 'Restricted concern', tone: 'restricted' as Tone, next: c.status === 'received' ? 'Acknowledge' : 'Follow up', to: `/safeguarding/${c.id}` })),
    ...o.registers.map((r) => ({ record: `Year ${r.classId} register`, group: r.period, status: `${r.recorded} / ${r.total} recorded`, tone: 'warning' as Tone, next: 'Complete register', to: '/attendance' })),
    ...o.quarantine.map((q) => ({ record: `Source ${q.sourceId}`, group: `${q.rows} rows`, status: 'Quarantined', tone: 'danger' as Tone, next: 'Review mapping', to: '/integrations' })),
  ];

  return (
    <>
      <PageHead
        title={isTeacher ? 'Your teaching day' : `Good morning, ${me.name.split(' ')[0]}`}
        sub={`Tuesday, 6 October 2026 · Horizon Learning School · ${me.title}`}
        spec="MVP · P01 / P02"
        actions={isTeacher && pendingDrafts.length > 0 ? <Link to="/copilot" className="btn">Review drafts</Link> : undefined}
      />

      <div className="stats">
        {isTeacher && <Stat value={4} label="Lessons today" foot="Next: Mathematics 7A at 10:20" />}
        {isTeacher && <Stat value={pendingDrafts.length} label="Drafts to review" to="/copilot" tone={pendingDrafts.length ? 'warning' : undefined} />}
        {(isTeacher || me.roles.includes('pastoral')) && <Stat value={o.cases.length} label="Support follow-ups" to="/support" />}
        {me.roles.includes('office') && <Stat value={o.requests.filter((r) => r.status === 'awaiting-approval').length} label="Requests awaiting decision" to="/requests" tone="warning" />}
        {me.roles.includes('office') && <Stat value={o.requests.filter((r) => r.status === 'in-progress').length} label="Requests in progress" to="/requests" />}
        {me.roles.includes('safeguarding') && <Stat value={o.concerns.length} label="Open restricted concerns" to="/safeguarding" tone="neutral" />}
        {(me.roles.includes('attendance') || isTeacher) && <Stat value={o.registers.length} label="Registers pending" to="/attendance" tone={o.registers.length ? 'warning' : undefined} />}
        {me.roles.includes('it') && <Stat value={o.quarantine.length} label="Mapping exceptions" to="/integrations" tone={o.quarantine.length ? 'danger' : undefined} />}
        {me.roles.includes('leadership') && <Stat value={staff.supportSummary().open} label="Open support cases (school)" foot="Aggregate only" to="/leadership" tone="neutral" />}
      </div>

      {isTeacher && (
        <div className="grid-2">
          <Card>
            <CardHeader icon={CalendarClock} title="Next lesson · Mathematics 7A" />
            <ul className="list">
              <li className="list-item"><span className="grow">10:20–11:10 · Room B204</span></li>
              <li className="list-item"><span className="grow">Equivalent fractions · 28 learners</span></li>
              <li className="list-item"><span className="grow">Worksheet and rubric ready</span><Chip tone="success">Ready</Chip></li>
            </ul>
          </Card>
          <Card>
            <CardHeader icon={Sparkles} title="Teacher Copilot" action={<Link to="/copilot" className="btn btn-ghost btn-sm">Open <ArrowRight size={14} aria-hidden /></Link>} />
            <p>Term 1 comments: <strong>{approved} approved</strong>, <strong>{pendingDrafts.length} awaiting review</strong>.</p>
            <p className="muted small" style={{ marginBlockStart: 8 }}>Drafts use published assessments and your notes. Nothing is shared until you approve.</p>
          </Card>
        </div>
      )}

      <Card className="card-flush table-card">
        <CardHeader icon={ListTodo} title="Records and next actions" sub="Only records assigned to you" />
        <div style={{ height: 12 }} />
        <DataTable
          caption="Records and next actions"
          rows={rows}
          onRow={(r) => navigate(r.to)}
          empty={<EmptyState icon={ListTodo} title="Nothing needs your review">You have no assigned records awaiting action.</EmptyState>}
          columns={[
            { key: 'r', label: 'Record', render: (r) => <span className="strong">{r.record}</span> },
            { key: 'g', label: 'Group / time', render: (r) => r.group },
            { key: 's', label: 'Evidence / status', render: (r) => <Chip tone={r.tone}>{r.status}</Chip> },
            { key: 'n', label: 'Next step', render: (r) => <span className="row" style={{ color: 'var(--color-brand-ink)', fontWeight: 600 }}>{r.next} <ArrowRight size={14} aria-hidden /></span> },
          ]}
        />
      </Card>

      <PageFoot updated={`6 Oct, ${formatTime(d.connectors[0].lastSuccess)}`} />
    </>
  );
}
