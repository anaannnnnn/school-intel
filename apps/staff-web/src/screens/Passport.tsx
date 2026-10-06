import { CalendarClock, Eye, EyeOff, Target } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Chip, formatDate, type Tone, useToast } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor, Mastery } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';

const M: Record<Mastery, { l: string; t: Tone; n: string }> = {
  secure: { l: 'Secure', t: 'success', n: 'View evidence' },
  developing: { l: 'Developing', t: 'info', n: 'Continue practice' },
  practice: { l: 'Practice focus', t: 'warning', n: 'Open plan' },
  insufficient: { l: 'Insufficient evidence', t: 'neutral', n: 'No mastery claim' },
};

export function Passport({ actor }: { actor: Actor }) {
  useDb();
  const toast = useToast();
  const [p] = staff.passports(actor);
  if (!p) return <PageHead title="Learning passport" sub="No learners in your classes have a passport yet." />;
  return (
    <>
      <PageHead
        title="Assessment and learning passport"
        sub={`${p.student.name} · Year ${p.student.classId} · ${p.subject} · Teacher-reviewed evidence`}
        spec="PHASE 2 · FR-L01–L04"
        actions={p.approvedBy
          ? <Button variant="secondary" icon={EyeOff} onClick={() => { staff.setPassportApproval(actor, p.studentId, false); toast('Hidden from family view'); }}>Withdraw from family view</Button>
          : <Button variant="brand" icon={Eye} onClick={() => { staff.setPassportApproval(actor, p.studentId, true); toast('Approved · visible to family'); }}>Approve and share</Button>}
      />
      <div className="stats">
        <Stat value={p.objectives.reduce((s, o) => Math.max(s, o.sources), 0)} label="Assessment sources" />
        <Stat value="7/10" label="Latest fractions quiz" />
        <Stat value={formatDate(p.nextCheckpoint)} label="Next checkpoint" tone="neutral" />
      </div>
      <div className="grid-2">
        <Card>
          <CardHeader icon={Target} title="Learning objectives" />
          <ul className="list">
            {p.objectives.map((o) => <li key={o.id} className="list-item"><span className="grow">{o.label}<br /><span className="list-meta">{o.sources} assessments</span></span><Chip tone={M[o.mastery].t}>{M[o.mastery].l}</Chip></li>)}
          </ul>
        </Card>
        <Card>
          <CardHeader icon={CalendarClock} title="Approved practice plan" sub={p.approvedBy ? `Approved by ${p.approvedBy} on ${formatDate(p.approvedAt!)}` : 'Not shared with the family'} action={p.approvedBy ? <Chip tone="success">Shared</Chip> : <Chip tone="neutral">Private</Chip>} />
          <ul className="list">{p.practice.map((x) => <li key={x} className="list-item">{x}</li>)}</ul>
          <div style={{ marginBlockStart: 12 }}><Callout tone="neutral">Grades from different scales are not merged. One test item does not establish mastery.</Callout></div>
        </Card>
      </div>
      <Card className="card-flush table-card">
        <div className="table-toolbar"><h2 className="card-title">Evidence by objective</h2></div>
        <DataTable caption="Objectives" rows={p.objectives} columns={[
          { key: 'o', label: 'Objective', render: (o) => <span className="strong">{o.label}</span> },
          { key: 's', label: 'Sources', render: (o) => `${o.sources} ${o.sources === 1 ? 'source' : 'sources'}` },
          { key: 'm', label: 'Evidence / status', render: (o) => <Chip tone={M[o.mastery].t}>{M[o.mastery].l}</Chip> },
          { key: 'n', label: 'Next step', render: (o) => M[o.mastery].n },
        ]} />
      </Card>
      <PageFoot updated="6 Oct, 09:15" />
    </>
  );
}
