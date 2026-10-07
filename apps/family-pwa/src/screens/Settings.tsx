import { useState } from 'react';
import { BellRing, Languages, LogOut, Moon, Palette as PaletteIcon, RotateCcw } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Segmented, SelectField, Switch, usePalette, useToast } from '@school-intel/ui';
import { family, resetDemo, setSession } from '@school-intel/api';
import type { FamilyPreferences } from '@school-intel/contracts';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { FAMILY_PALETTES } from '../palettes';

const TIMES = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const MORNING = ['06:00', '06:30', '07:00', '07:30'];

export function Settings() {
  const { actor, name, isParent } = useFamily();
  const toast = useToast();
  const [p, setP] = useState<FamilyPreferences>(() => family.preferences(actor));
  const set = <K extends keyof FamilyPreferences>(k: K, v: FamilyPreferences[K]) => setP((x) => ({ ...x, [k]: v }));
  const [palette, setPalette] = usePalette('family', FAMILY_PALETTES);

  return (
    <>
      <PageHeader back={isParent ? '/more' : true} eyebrow={`${name} · ${isParent ? 'Verified guardian' : 'Student'}`} title="Settings" />
      <Card>
        <CardHeader icon={Languages} title="Language" />
        <Segmented label="Language" value={p.language} onChange={(v) => set('language', v)} options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]} />
        {p.language === 'ar' && <p className="small muted" style={{ marginBlockStart: 10 }}>Right-to-left layout preview. School content is shown in Arabic once the school publishes translations.</p>}
      </Card>
      <Card>
        <CardHeader icon={PaletteIcon} title="Colour theme" sub="Applies on this device straight away" />
        <div className="palette-grid" role="radiogroup" aria-label="Colour theme">
          {FAMILY_PALETTES.map((pal) => (
            <button key={pal.id} type="button" role="radio" aria-checked={palette === pal.id} className="palette-option" onClick={() => setPalette(pal.id)}>
              <span className="palette-chip" aria-hidden>
                {pal.swatch.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <span>{pal.name}<small style={{ display: 'block' }}>{pal.kit}</small></span>
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader icon={Moon} title="Quiet hours" sub="Routine notifications wait until quiet hours end" />
        <div className="stack">
          <SelectField label="Quiet hours start" value={p.quietStart} onChange={(e) => set('quietStart', e.target.value)} options={TIMES.map((t) => ({ value: t, label: `${t} GST` }))} />
          <SelectField label="Quiet hours end" value={p.quietEnd} onChange={(e) => set('quietEnd', e.target.value)} options={MORNING.map((t) => ({ value: t, label: `${t} GST` }))} />
          <SelectField label="Daily digest" value={p.digest} onChange={(e) => set('digest', e.target.value)} options={TIMES.map((t) => ({ value: t, label: `${t} GST` }))} />
        </div>
      </Card>
      <Card>
        <CardHeader icon={BellRing} title="Notification categories" />
        <Switch label="Homework reminders" checked={p.homework} onChange={(v) => set('homework', v)} />
        <hr className="divider" />
        <Switch label="School circulars" checked={p.circulars} onChange={(v) => set('circulars', v)} />
        <hr className="divider" />
        <Switch label="Activity updates" checked={p.activities} onChange={(v) => set('activities', v)} />
        <div style={{ marginBlockStart: 12 }}>
          <Callout tone="neutral">Emergency school notices follow school policy and are always delivered.</Callout>
        </div>
      </Card>
      <Button block onClick={() => { family.savePreferences(actor, p); toast('Preferences saved'); }}>Save preferences</Button>

      <Card>
        <CardHeader icon={RotateCcw} tone="neutral" title="Demonstration" sub="This app uses fictional data stored in this browser." />
        <div className="stack-sm">
          <Button variant="secondary" icon={RotateCcw} onClick={() => { resetDemo(); toast('Demo data reset'); }}>Reset demo data</Button>
          <Button variant="ghost" icon={LogOut} onClick={() => setSession('family', null)}>Sign out</Button>
        </div>
      </Card>
    </>
  );
}
