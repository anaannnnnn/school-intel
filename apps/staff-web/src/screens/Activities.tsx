import { ListChecks, Trophy } from 'lucide-react';
import { Button, Card, CardHeader, Chip, Progress, useToast } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';

export function Activities({ actor }: { actor: Actor }) {
  useDb();
  const toast = useToast();
  const list = staff.activities(actor);
  const canManage = staff.me(actor).roles.includes('office');
  const cap = list.reduce((s, a) => s + a.capacity, 0);
  const booked = list.reduce((s, a) => s + a.booked.length, 0);
  const bb = list.find((a) => a.id === 'ACT-BB')!;
  return (
    <>
      <PageHead title="Sports and activities" sub="Autumn clubs · eligibility, capacity and consent" spec="PHASE 3 · FR-X01–X04" />
      <div className="stats">
        <Stat value={list.length} label="Active clubs" />
        <Stat value={`${Math.round((booked / cap) * 100)}%`} label="Capacity filled" />
        <Stat value={list.reduce((s, a) => s + a.waiting.length, 0)} label="Waiting-list requests" tone="warning" />
      </div>
      <div className="grid-2">
        <Card>
          <CardHeader icon={Trophy} title={`${bb.name} · ${bb.yearGroups}`} sub={`${bb.schedule} · ${bb.location} · Coach ${bb.coach}`} />
          <Progress value={(bb.booked.length / bb.capacity) * 100} label="Basketball capacity" />
          <p className="small" style={{ marginBlockStart: 8 }}>{bb.booked.length} of {bb.capacity} places booked. Guardian consent and transport coordination required.</p>
        </Card>
        <Card>
          <CardHeader icon={ListChecks} title="Booking workflow" />
          <p>Verify year-group eligibility → reserve capacity → receive guardian consent → confirm place.</p>
          <p className="small muted" style={{ marginBlockStart: 8 }}>A waiting-list offer expires after 48 hours. Cancelled sessions update coaches, families and the transport workflow. Coaches see only necessary participant details.</p>
        </Card>
      </div>
      <Card className="card-flush table-card">
        <div className="table-toolbar"><h2 className="card-title">Clubs</h2></div>
        <DataTable caption="Clubs" rows={list} columns={[
          { key: 'n', label: 'Club', render: (a) => <span className="strong">{a.name}</span> },
          { key: 'y', label: 'Years', render: (a) => a.yearGroups },
          { key: 'b', label: 'Booked', render: (a) => <span className="tabular">{a.booked.length} / {a.capacity}</span> },
          { key: 's', label: 'Status', render: (a) => (a.booked.length >= a.capacity ? <Chip tone="neutral">Full{a.waiting.length ? ` · ${a.waiting.length} waiting` : ''}</Chip> : <Chip tone="success">{a.capacity - a.booked.length} places</Chip>) },
          { key: 'c', label: 'Consent', render: (a) => (a.consentRequired ? 'Required' : 'Not required') },
          { key: 'x', label: '', align: 'end', render: (a) => (canManage && a.waiting.length ? <Button size="sm" variant="secondary" onClick={() => { staff.offerWaitingPlace(actor, a.id); toast('Waiting-list place offered and accepted'); }}>Offer next place</Button> : null) },
        ]} />
      </Card>
      <PageFoot />
    </>
  );
}
