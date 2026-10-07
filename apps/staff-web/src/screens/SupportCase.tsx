import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClipboardCheck, History, Info, Plus, Search } from 'lucide-react';
import { Avatar, Button, Callout, Card, CardHeader, Checkbox, Chip, Dialog, TextArea, TextField, errorText, formatDate, formatTime, useToast } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { PageFoot, PageHead, Restricted, Stat } from '../ui';
import { CASE } from '../statuses';

type Action = 'check-in' | 'support-plan' | 'dismiss' | 'close';
const ACTIONS: Record<Action, { title: string; label: string; prompt: string; required: boolean }> = {
  'check-in': { title: 'Record check-in outcome', label: 'Outcome', prompt: 'What did you learn and agree?', required: true },
  'support-plan': { title: 'Agree support plan', label: 'Plan summary (optional)', prompt: 'Summarise the agreed plan.', required: false },
  dismiss: { title: 'Dismiss alert', label: 'Reason', prompt: 'Why does this alert need no action? The same unchanged alert will stay suppressed.', required: true },
  close: { title: 'Close case', label: 'Closure reason', prompt: 'Summarise the outcome and any follow-up.', required: true },
};

export function SupportCaseScreen({ actor }: { actor: Actor }) {
  const { id = '' } = useParams();
  useDb();
  const toast = useToast();
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState('');

  let c;
  try {
    c = staff.supportCase(actor, id);
  } catch (e) {
    return <Restricted message={errorText(e)} />;
  }
  const closed = ['closed', 'dismissed'].includes(c.status);
  const done = c.plan.filter((p) => p.done).length;

  const run = () => {
    try {
      staff.caseAction(actor, c.id, action!, note);
      toast(`${ACTIONS[action!].title} · recorded`);
      setAction(null);
      setNote('');
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <>
      <PageHead
        title={`${c.id} · Support case`}
        sub={<span className="row wrap"><Avatar initials={c.student.initials} /> <Link to={`/students/${c.studentId}`}>{c.student.name}</Link> · Year {c.student.classId} · Assigned to {c.owner} · <Chip tone="restricted">Staff restricted</Chip></span>}
        spec="MVP · FR-S01 / FR-S03"
        actions={
          !closed && (
            <>
              {c.status === 'open' && <Button variant="secondary" onClick={() => { staff.caseAction(actor, c.id, 'acknowledge'); toast('Case acknowledged'); }}>Acknowledge</Button>}
              <Button variant="secondary" onClick={() => setAction('dismiss')}>Dismiss</Button>
              <Button onClick={() => setAction('check-in')}>Record check-in outcome</Button>
            </>
          )
        }
      />
      <div className="stats">
        <Stat value={<Chip tone={CASE[c.status].tone}>{CASE[c.status].label}</Chip>} label="Status" tone="neutral" />
        <Stat value={formatDate(c.openedAt)} label="Opened" tone="neutral" />
        <Stat value={formatDate(c.reviewDue)} label={`Review due ${formatTime(c.reviewDue)}`} tone="warning" />
        <Stat value={`${done}/${c.plan.length || 0}`} label="Plan actions complete" />
      </div>

      <div className="grid-main">
        <div className="stack">
          <Card>
            <CardHeader icon={Search} title="Why this check-in was suggested" sub={c.rule} />
            <ul className="list">
              {c.signals.map((s) => <li key={s} className="list-item">{s}</li>)}
            </ul>
            {c.missingData.length > 0 && <div style={{ marginBlockStart: 12 }}><Callout tone="warning" title="Insufficient data">{c.missingData.join(' ')}</Callout></div>}
            <div style={{ marginBlockStart: 12 }}><Callout tone="neutral" icon={Info}>No clinical inference has been made. Signals describe observable changes only.</Callout></div>
          </Card>

          <Card>
            <CardHeader icon={ClipboardCheck} title="Action plan" sub={`Owner: ${c.owner}`} action={!closed && c.status !== 'support-plan' ? <Button size="sm" variant="ghost" onClick={() => setAction('support-plan')}>Mark plan agreed</Button> : undefined} />
            {c.plan.length === 0 && <p className="muted small">No actions yet. Add the first step below.</p>}
            {c.plan.map((p, i) => (
              <Checkbox key={i} checked={p.done} disabled={closed} onChange={() => staff.togglePlanItem(actor, c.id, i)} label={<span style={{ textDecoration: p.done ? 'line-through' : undefined, color: p.done ? 'var(--color-muted)' : undefined }}>{p.text}</span>} />
            ))}
            {!closed && (
              <form className="row" style={{ marginBlockStart: 12, alignItems: 'flex-end' }} onSubmit={(e) => { e.preventDefault(); staff.addPlanItem(actor, c.id, newItem); setNewItem(''); }}>
                <div className="grow"><TextField label="Add an action" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="For example: speak with form tutor by Thursday" /></div>
                <Button type="submit" variant="secondary" icon={Plus} disabled={!newItem.trim()}>Add</Button>
              </form>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader icon={History} title="Case history" sub="Audited · restricted to assigned staff" />
          <ol className="timeline">
            {[...c.events].reverse().map((e, i) => (
              <li key={i} data-state="done">
                <strong>{e.label}</strong>
                <div className="small muted">{formatDate(e.at)}, {formatTime(e.at)} · {e.by}</div>
                {e.note && <div className="small" style={{ marginBlockStart: 4 }}>{e.note}</div>}
              </li>
            ))}
            {!closed && <li data-state="pending"><span className="muted">Next review {formatDate(c.reviewDue)}</span></li>}
          </ol>
          {!closed && (
            <div className="row" style={{ marginBlockStart: 16 }}>
              <Button size="sm" variant="ghost" onClick={() => setAction('close')}>Close case</Button>
            </div>
          )}
        </Card>
      </div>
      <PageFoot updated="6 Oct, 09:15" />

      <Dialog
        open={!!action}
        onClose={() => setAction(null)}
        title={action ? ACTIONS[action].title : ''}
        actions={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button>
            <Button variant={action === 'dismiss' ? 'danger' : 'primary'} onClick={run}>Save</Button>
          </>
        }
      >
        {action && (
          <TextArea label={ACTIONS[action].label} hint={ACTIONS[action].prompt} value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} error={error} rows={4} />
        )}
      </Dialog>
    </>
  );
}
