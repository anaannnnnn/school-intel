import { useState } from 'react';
import { MapPin, Plus, ShieldCheck } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Chip, Dialog, Segmented, SelectField, TextArea, errorText, formatDate, formatTime, useToast } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';

const LOCATIONS = ['Corridor B', 'Sports hall', 'Canteen', 'Library', 'Playground', 'Classroom', 'Online', 'School bus'];

export function Behaviour({ actor }: { actor: Actor }) {
  useDb();
  const toast = useToast();
  const list = staff.incidents(actor);
  const me = staff.me(actor);
  const canVerify = me.roles.includes('pastoral');
  const canRecord = me.roles.some((r) => r === 'teacher' || r === 'pastoral');
  const concerns = list.filter((i) => i.kind === 'concern');
  const corridor = concerns.filter((i) => i.location === 'Corridor B' && i.verified);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'concern' | 'positive'>('concern');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [description, setDescription] = useState('');
  const [verified, setVerified] = useState<'verified' | 'unverified'>('unverified');
  const [error, setError] = useState('');

  return (
    <>
      <PageHead
        title="Behaviour patterns"
        sub="Pastoral review · 21 Sep–6 Oct · Patterns require human interpretation"
        spec="PHASE 2 · FR-B01–B04"
        actions={canRecord ? <Button icon={Plus} onClick={() => setOpen(true)}>Record an observation</Button> : undefined}
      />
      <div className="stats">
        <Stat value={concerns.filter((i) => i.verified).length} label="Verified incidents" />
        <Stat value={corridor.length} label="Lunch transition · Corridor B" tone="warning" />
        <Stat value={list.filter((i) => i.kind === 'positive').length} label="Positive observations" />
      </div>
      <div className="grid-2">
        <Card>
          <CardHeader icon={MapPin} tone="warning" title="Location pattern" />
          <p>{corridor.length} verified incidents occurred during lunch transition near Corridor B.</p>
          <p className="muted small" style={{ marginBlockStart: 8 }}>Review supervision and transition timing before attributing causes. Small-group breakdowns are suppressed.</p>
        </Card>
        <Card>
          <CardHeader icon={ShieldCheck} title="Context and correction" />
          <ul className="list small">
            <li className="list-item">Incidents retain original sources and amendment history.</li>
            <li className="list-item">Unverified reports are labelled separately.</li>
            <li className="list-item">Positive observations remain visible.</li>
            <li className="list-item">Students are never ranked by behaviour.</li>
          </ul>
        </Card>
      </div>
      <Card className="card-flush table-card">
        <div className="table-toolbar"><h2 className="card-title">Recorded observations</h2></div>
        <DataTable
          caption="Behaviour observations"
          rows={list}
          columns={[
            { key: 'id', label: 'Record', render: (i) => <span className="strong">{i.id}</span> },
            { key: 't', label: 'Time', render: (i) => `${formatDate(i.at)} · ${formatTime(i.at)}` },
            { key: 'l', label: 'Location', render: (i) => i.location },
            { key: 'd', label: 'Description', render: (i) => <span className="small">{i.description}</span> },
            { key: 'k', label: 'Status', render: (i) => (i.kind === 'positive' ? <Chip tone="success">Positive observation</Chip> : i.verified ? <Chip tone="info">Verified</Chip> : <Chip tone="warning">Needs review</Chip>) },
            { key: 'v', label: 'Version', render: (i) => <span className="small muted">v{i.version} · {i.recordedBy}</span> },
            { key: 'a', label: '', align: 'end', render: (i) => (canVerify && !i.verified ? <Button size="sm" variant="secondary" onClick={() => { staff.verifyIncident(actor, i.id); toast(`${i.id} verified · amendment recorded`); }}>Verify</Button> : null) },
          ]}
        />
      </Card>
      <PageFoot updated="6 Oct, 13:00" />

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Record an observation"
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              try {
                const id = staff.recordIncident(actor, { kind, location, description, verified: verified === 'verified' });
                setOpen(false);
                setDescription('');
                toast(`${id} recorded`);
              } catch (e) {
                setError(errorText(e));
              }
            }}>Save record</Button>
          </>
        }
      >
        <Segmented label="Type" value={kind} onChange={setKind} options={[{ value: 'concern', label: 'Concern' }, { value: 'positive', label: 'Positive' }]} />
        <SelectField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} options={LOCATIONS} />
        <TextArea label="What happened" value={description} onChange={(e) => { setDescription(e.target.value); setError(''); }} hint="Describe what was seen and heard. Avoid judgements about character." error={error} rows={4} />
        <Segmented label="Source" value={verified} onChange={setVerified} options={[{ value: 'unverified', label: 'Reported to me' }, { value: 'verified', label: 'I witnessed it' }]} />
        <Callout tone="neutral">Participants are recorded in the SIS behaviour module; this app stores the pattern-level record only.</Callout>
      </Dialog>
    </>
  );
}
