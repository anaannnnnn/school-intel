import { useState } from 'react';
import { CalendarClock, ChartColumn, NotebookPen, Plus, TriangleAlert } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Chip, Dialog, SelectField, TextArea, TextField, errorText, formatDate, useToast } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor, HomeworkItem } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';

// Validated two-series palette (dataviz validator: CVD ΔE 16.4, contrast ≥ 3:1).
const PUBLISHED = '#008a76';
const PROPOSED = '#5b6fd6';
const DAYS: Record<string, string> = { '2026-10-05': 'Monday', '2026-10-06': 'Tuesday', '2026-10-07': 'Wednesday', '2026-10-08': 'Thursday', '2026-10-09': 'Friday' };

export function Homework({ actor }: { actor: Actor }) {
  useDb();
  const toast = useToast();
  const items = staff.homework(actor, 9);
  const load = staff.eveningLoad(items);
  const T = staff.HOMEWORK_THRESHOLD;
  const max = Math.max(T * 1.5, ...load.map((l) => l.minutes));
  const proposed = items.filter((h) => h.status === 'proposed');
  const science = items.find((h) => h.id === 'HW-11');
  const peak = load.reduce((a, b) => (b.minutes > a.minutes ? b : a));
  const canEdit = staff.me(actor).roles.includes('teacher');

  const [override, setOverride] = useState<HomeworkItem | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ subject: 'Mathematics', title: '', minutes: '30', due: '2026-10-09' });

  const isOver = (h: HomeworkItem) => (load.find((l) => l.day === h.evening)?.minutes ?? 0) > T;

  return (
    <>
      <PageHead
        title="Homework workload planner"
        sub="Year 9 · Week of 5–9 October · Teacher estimates, not ability scores"
        spec="PHASE 2 · FR-H01–H04"
        actions={canEdit ? <Button variant="secondary" icon={Plus} onClick={() => setAdding(true)}>Plan an assignment</Button> : undefined}
      />
      <div className="stats">
        <Stat value={`${peak.minutes} min`} label={`${DAYS[peak.day]} proposed load`} tone={peak.minutes > T ? 'warning' : undefined} />
        <Stat value={`${T} min`} label="School threshold" tone="neutral" />
        <Stat value={proposed.length} label="Assignments awaiting publication" />
      </div>

      <div className="grid-main">
        <Card>
          <CardHeader icon={ChartColumn} title="Estimated homework by evening" sub="Includes proposed work before it is published" />
          <div className="legend" style={{ marginBlockEnd: 20 }}>
            <span><i style={{ background: PUBLISHED }} />Published</span>
            <span><i style={{ background: PROPOSED }} />Proposed</span>
            <span><i style={{ background: 'transparent', borderInlineStart: '2px dashed #a76a00', borderRadius: 0, width: 2 }} />{T}-minute threshold</span>
          </div>
          <div className="chart" role="img" aria-label={load.map((l) => `${DAYS[l.day]} ${l.minutes} minutes`).join(', ')}>
            {load.map((l) => {
              const pub = l.items.filter((h) => h.status === 'published').reduce((s, h) => s + h.minutes, 0);
              const pro = l.minutes - pub;
              const over = l.minutes > T;
              return (
                <div key={l.day} className="bar-row">
                  <span>{DAYS[l.day]}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(l.minutes / max) * 100}%` }}>
                      {pub > 0 && <span style={{ width: `${(pub / l.minutes) * 100}%`, background: PUBLISHED }} title={`Published · ${pub} min: ${l.items.filter((h) => h.status === 'published').map((h) => `${h.subject} ${h.minutes}`).join(', ')}`} />}
                      {pro > 0 && <span style={{ width: `${(pro / l.minutes) * 100}%`, background: PROPOSED }} title={`Proposed · ${pro} min`} />}
                    </div>
                    <span className="threshold" style={{ insetInlineStart: `${(T / max) * 100}%` }} aria-hidden />
                  </div>
                  <span className="tabular" style={{ fontWeight: over ? 700 : 500, color: over ? '#8a5700' : undefined }}>
                    {over && <TriangleAlert size={12} aria-hidden style={{ display: 'inline', marginInlineEnd: 3 }} />}
                    {l.minutes} min
                  </span>
                </div>
              );
            })}
          </div>
          <p className="small muted" style={{ marginBlockStart: 16 }}>Estimates exclude approved individual adjustments. Warnings never block teaching decisions.</p>
        </Card>

        {science && science.status === 'proposed' ? (
          <Card>
            <CardHeader icon={NotebookPen} tone="warning" title="New science assignment" sub={science.title} />
            <dl className="kv">
              <dt>Estimated</dt><dd>{science.minutes} minutes</dd>
              <dt>Original due</dt><dd>{formatDate(science.due, { weekday: 'long', day: 'numeric', month: 'short' })}</dd>
              <dt>Suggested due</dt><dd>Monday, 12 Oct</dd>
            </dl>
            {isOver(science) && (
              <div style={{ marginBlockStart: 14 }}>
                <Callout tone="warning" title={`${DAYS[science.evening]} would reach ${load.find((l) => l.day === science.evening)!.minutes} minutes`}>Move the deadline or record an override reason for the year coordinator.</Callout>
              </div>
            )}
            {canEdit && (
              <div className="stack-sm" style={{ marginBlockStart: 16 }}>
                <Button variant="brand" icon={CalendarClock} onClick={() => { staff.moveHomework(actor, science.id, '2026-10-11', '2026-10-12'); toast('Published with deadline Monday 12 Oct · students notified once'); }}>Move science deadline</Button>
                <Button variant="secondary" onClick={() => setOverride(science)}>Keep Thursday with override</Button>
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <CardHeader icon={NotebookPen} title="Science assignment published" sub={science?.overrideReason ? `Override recorded: ${science.overrideReason}` : `Due ${science ? formatDate(science.due, { weekday: 'long', day: 'numeric', month: 'short' }) : ''}`} />
            <p className="small muted">Old reminders were replaced; affected students are notified once.</p>
          </Card>
        )}
      </div>

      <Card className="card-flush table-card">
        <div className="table-toolbar"><h2 className="card-title">Assignments this week</h2></div>
        <DataTable
          caption="Year 9 homework this week"
          rows={[...items].sort((a, b) => a.evening.localeCompare(b.evening))}
          columns={[
            { key: 's', label: 'Subject', render: (h) => <span className="strong">{h.subject}</span> },
            { key: 't', label: 'Task', render: (h) => h.title },
            { key: 'm', label: 'Estimate', render: (h) => `${h.minutes} min` },
            { key: 'd', label: 'Due', render: (h) => formatDate(h.due, { weekday: 'short', day: 'numeric', month: 'short' }) },
            { key: 'st', label: 'Status', render: (h) => (h.status === 'published' ? <Chip tone="success">Published</Chip> : <Chip tone="info">Proposed</Chip>) },
            {
              key: 'a',
              label: '',
              align: 'end',
              render: (h) =>
                h.status === 'proposed' && h.id !== 'HW-11' && canEdit ? (
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); if (isOver(h)) setOverride(h); else { staff.moveHomework(actor, h.id, h.evening, h.due); toast('Published'); } }}>Publish</Button>
                ) : null,
            },
          ]}
        />
      </Card>
      <PageFoot updated="6 Oct, 09:10" />

      <Dialog
        open={!!override}
        onClose={() => setOverride(null)}
        title="Publish above threshold"
        actions={
          <>
            <Button variant="secondary" onClick={() => setOverride(null)}>Cancel</Button>
            <Button onClick={() => {
              try {
                staff.overrideHomework(actor, override!.id, reason);
                setOverride(null);
                setReason('');
                toast('Published with override · year coordinator notified');
              } catch (e) {
                setError(errorText(e));
              }
            }}>Publish with override</Button>
          </>
        }
      >
        <p>The evening total will exceed the {T}-minute guideline. Your reason is shared with the year coordinator.</p>
        <TextArea label="Override reason" value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} error={error} rows={3} placeholder="For example: practical write-up must follow Wednesday’s lab" />
      </Dialog>

      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Plan an assignment"
        actions={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={() => {
              try {
                const due = form.due;
                const ev = new Date(`${due}T12:00:00+04:00`);
                ev.setUTCDate(ev.getUTCDate() - 1);
                staff.proposeHomework(actor, { yearGroup: 9, subject: form.subject, title: form.title || `${form.subject} practice`, minutes: Number(form.minutes), due, evening: ev.toISOString().slice(0, 10) });
                setAdding(false);
                toast('Added as proposed · check the chart before publishing');
              } catch (e) {
                toast(errorText(e), 'danger');
              }
            }}>Add to plan</Button>
          </>
        }
      >
        <SelectField label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} options={['Mathematics', 'English', 'Science', 'Arabic', 'French', 'History', 'Geography', 'Computing', 'Art']} />
        <TextField label="Task" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <TextField label="Estimated minutes" type="number" min={5} step={5} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} hint="Required. Estimates are not measures of ability." />
        <SelectField label="Due" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} options={[{ value: '2026-10-06', label: 'Tuesday 6 Oct' }, { value: '2026-10-07', label: 'Wednesday 7 Oct' }, { value: '2026-10-08', label: 'Thursday 8 Oct' }, { value: '2026-10-09', label: 'Friday 9 Oct' }, { value: '2026-10-10', label: 'Saturday 10 Oct' }]} />
      </Dialog>
    </>
  );
}
