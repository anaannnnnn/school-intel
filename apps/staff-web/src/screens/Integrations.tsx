import { useState } from 'react';
import { Database, FlaskConical, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Chip, Dialog, SelectField, Switch, formatTime, useToast, type Tone } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';

const ST: Record<string, { l: string; t: Tone }> = { healthy: { l: 'Healthy', t: 'success' }, degraded: { l: 'Degraded', t: 'warning' }, outage: { l: 'Outage', t: 'danger' }, 'not-enabled': { l: 'Not enabled for MVP', t: 'neutral' } };

export function Integrations({ actor }: { actor: Actor }) {
  useDb();
  const toast = useToast();
  const { connectors, quarantine, demo } = staff.connectors(actor);
  const canEdit = staff.me(actor).roles.includes('it');
  const [mapping, setMapping] = useState<string | null>(null);
  const [target, setTarget] = useState('stu-hamdan');
  const sis = connectors.find((c) => c.system === 'SIS')!;
  const lms = connectors.find((c) => c.system === 'LMS')!;
  const q = quarantine.filter((x) => x.status === 'quarantined');

  return (
    <>
      <PageHead title="Integrations and data health" sub="School IT · source authority, freshness and quarantined records" spec="MVP · DATA CONTRACT" />
      {lms.status === 'outage' && <Callout tone="danger" icon={TriangleAlert} title="LMS outage">Families and students see the last confirmed assignments marked as stale. Support rules that need LMS data are paused.</Callout>}
      <div className="stats">
        <Stat value={formatTime(sis.lastSuccess)} label="SIS last success" />
        <Stat value={formatTime(lms.lastSuccess)} label="LMS last success" tone={lms.status === 'outage' ? 'danger' : undefined} />
        <Stat value={q.length} label="Mapping exceptions" tone={q.length ? 'warning' : undefined} />
      </div>
      <div className="grid-2">
        <Card>
          <CardHeader icon={Database} title="Connected systems" />
          <ul className="list">
            {connectors.map((c) => (
              <li key={c.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                <span className="grow"><span className="list-title">{c.system} · {c.name}</span><br /><span className="list-meta">{c.scope} · {c.mode}</span></span>
                <span className="stack-sm" style={{ alignItems: 'flex-end' }}>
                  <Chip tone={ST[c.status].t}>{ST[c.status].l}</Chip>
                  {canEdit && c.status !== 'not-enabled' && <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => { staff.runImport(actor, c.system as 'SIS' | 'LMS'); toast(c.status === 'outage' ? `${c.system} import failed · vendor unavailable` : `${c.system} import complete · 0 duplicates`, c.status === 'outage' ? 'danger' : undefined); }}>Run import</Button>}
                </span>
              </li>
            ))}
          </ul>
          <p className="small muted" style={{ marginBlockStart: 10 }}>Writeback: disabled pending vendor approval. Import retries are idempotent.</p>
        </Card>
        <Card>
          <CardHeader icon={TriangleAlert} tone={q.length ? 'warning' : undefined} title="Quarantine queue" />
          {q.length === 0 ? <p>No quarantined rows. All imported records map to canonical students.</p> : q.map((x) => (
            <div key={x.id} className="stack-sm">
              <p>Student source ID <strong>{x.sourceId}</strong> has no approved canonical mapping.</p>
              <p className="small muted">{x.rows} rows are excluded from support rule evaluation. Correct mapping, preview affected records, then reprocess.</p>
              {canEdit && <div><Button size="sm" onClick={() => setMapping(x.id)}>Review mapping exception</Button></div>}
            </div>
          ))}
        </Card>
      </div>
      {canEdit && (
        <Card>
          <CardHeader icon={FlaskConical} tone="neutral" title="Failure simulation" sub="Test the failure behaviour from the PRD with synthetic data" />
          <Switch label="LMS outage" hint="Family feed marks LMS items stale instead of newly confirmed" checked={demo.lmsOutage} onChange={(v) => staff.setDemoFlag(actor, 'lmsOutage', v)} />
          <hr className="divider" />
          <Switch label="Stale bus telemetry" hint="Family bus view suppresses a confident arrival time" checked={demo.staleBus} onChange={(v) => staff.setDemoFlag(actor, 'staleBus', v)} />
          <hr className="divider" />
          <Switch label="Safeguarding primary notification failure" hint="New concerns route to the backup duty lead" checked={demo.failPrimaryDelivery} onChange={(v) => staff.setDemoFlag(actor, 'failPrimaryDelivery', v)} />
        </Card>
      )}
      <Card className="card-flush table-card">
        <div className="table-toolbar"><h2 className="card-title">Data contract status</h2></div>
        <DataTable caption="Data contract" rows={[
          { r: 'SIS attendance', t: formatTime(sis.lastSuccess), s: 'Complete except pending registers', n: <Chip tone="success">Fresh</Chip> },
          { r: 'LMS assignments', t: formatTime(lms.lastSuccess), s: `${lms.records} records`, n: <Chip tone={lms.status === 'outage' ? 'danger' : 'success'}>{lms.status === 'outage' ? 'Stale' : 'Healthy'}</Chip> },
          { r: 'Identity mapping', t: `${q.reduce((s, x) => s + x.rows, 0)} rows`, s: q.length ? 'Review required' : 'All mapped', n: q.length ? <Chip tone="warning">Quarantined</Chip> : <Chip tone="success">Clear</Chip> },
        ]} columns={[
          { key: 'r', label: 'Record', render: (x) => <span className="strong">{x.r}</span> },
          { key: 't', label: 'Group / time', render: (x) => x.t },
          { key: 's', label: 'Evidence / status', render: (x) => x.s },
          { key: 'n', label: 'State', render: (x) => x.n },
        ]} />
      </Card>
      <PageFoot updated={`6 Oct, ${formatTime(sis.lastSuccess)}`} />
      <Dialog
        open={!!mapping}
        onClose={() => setMapping(null)}
        title="Map SIS-2038"
        actions={<><Button variant="secondary" onClick={() => setMapping(null)}>Cancel</Button><Button onClick={() => { staff.resolveQuarantine(actor, mapping!, target); setMapping(null); toast('Mapped · 2 rows reprocessed'); }}>Map and reprocess</Button></>}
      >
        <p>The SIS sent 2 rows for source ID SIS-2038 (Year 7A, enrolled 1 Oct). Choose the canonical student record. Affected records are previewed before reprocessing.</p>
        <SelectField label="Canonical student" value={target} onChange={(e) => setTarget(e.target.value)} options={staff.studentDirectory(actor).filter((s) => s.classId === '7A').map((s) => ({ value: s.id, label: `${s.name} · ${s.sisId}` }))} />
        <Callout tone="neutral">Preview: 1 attendance mark (6 Oct, present) and 1 assignment record will attach to the chosen student.</Callout>
      </Dialog>
    </>
  );
}
