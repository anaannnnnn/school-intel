import { useState } from 'react';
import { CalendarDays, MapPin, Trophy, User } from 'lucide-react';
import { Button, Callout, Card, Checkbox, Chip, Dialog, Progress, errorText, useToast } from '@school-intel/ui';
import { family, useDb } from '@school-intel/api';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { NoChildren } from './NoChildren';

export function Activities() {
  const { actor, child, name } = useFamily();
  useDb();
  const toast = useToast();
  const [booking, setBooking] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  if (!child) return <NoChildren />;
  const list = family.activitiesFor(actor, child.id);
  const active = list.find((a) => a.id === booking);

  const confirm = () => {
    try {
      const r = family.bookActivity(actor, booking!, child.id, consent);
      setBooking(null);
      setConsent(false);
      toast(r.result === 'booked' ? 'Place confirmed by the school' : `Joined the waiting list · position ${r.position}`);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <>
      <PageHeader back="/more" eyebrow="Autumn clubs" title="Clubs and activities" />
      <ChildSwitcher />
      {list.length === 0 && <Card><p className="muted">No clubs are open to {child.firstName}’s year group this term.</p></Card>}
      {list.map((a) => (
        <Card key={a.id}>
          <div className="row-between" style={{ marginBlockEnd: 8 }}>
            <div className="row"><span className="card-icon" aria-hidden><Trophy size={18} /></span><div><strong style={{ fontSize: 'var(--text-lg)' }}>{a.name}</strong><div className="small muted">{a.yearGroups}</div></div></div>
            {a.status === 'booked' ? <Chip tone="success">Booked</Chip> : a.status === 'waiting' ? <Chip tone="warning">Waiting · #{a.waitingPosition}</Chip> : a.placesLeft === 0 ? <Chip tone="neutral">Full</Chip> : <Chip tone="info">{a.placesLeft} {a.placesLeft === 1 ? 'place' : 'places'} left</Chip>}
          </div>
          <div className="stack-sm small">
            <span className="row"><CalendarDays size={14} aria-hidden /> {a.schedule}</span>
            <span className="row"><MapPin size={14} aria-hidden /> {a.location}</span>
            <span className="row"><User size={14} aria-hidden /> Coach {a.coach}</span>
          </div>
          <div className="stack-sm" style={{ marginBlock: 14 }}>
            <Progress value={(a.booked.length / a.capacity) * 100} label={`${a.name} capacity`} />
            <span className="small muted tabular">{a.booked.length} of {a.capacity} places booked{a.waiting.length ? ` · ${a.waiting.length} waiting` : ''}</span>
          </div>
          {a.status === 'none' && (
            <Button block variant={a.placesLeft ? 'brand' : 'secondary'} onClick={() => { setBooking(a.id); setError(''); }}>
              {a.placesLeft ? 'Book a place' : 'Join waiting list'}
            </Button>
          )}
          {a.status !== 'none' && (
            <Button block variant="ghost" onClick={() => { family.cancelBooking(actor, a.id, child.id); toast('Booking cancelled'); }}>Cancel {a.status === 'booked' ? 'booking' : 'waiting-list place'}</Button>
          )}
        </Card>
      ))}

      <Dialog
        open={!!active}
        onClose={() => setBooking(null)}
        title={active ? `${active.name} · ${active.yearGroups}` : ''}
        actions={
          <>
            <Button variant="secondary" onClick={() => setBooking(null)}>Cancel</Button>
            <Button variant="brand" disabled={!!active?.consentRequired && !consent} onClick={confirm}>Confirm consent and book</Button>
          </>
        }
      >
        {active && (
          <>
            <dl className="kv">
              <dt>Student</dt><dd>{child.name} · eligible</dd>
              <dt>When</dt><dd>{active.schedule}</dd>
              <dt>Where</dt><dd>{active.location}</dd>
              <dt>Collection</dt><dd>{name} at 16:15</dd>
            </dl>
            {active.consentRequired && <Checkbox checked={consent} onChange={setConsent} label={`I approve ${child.firstName}’s participation.`} />}
            <Callout tone="neutral">The final place is reserved only after the school confirms it. If the club fills first, {child.firstName} joins the waiting list. A transport change needs staff acknowledgement.</Callout>
            {error && <p className="field-error" role="alert">{error}</p>}
          </>
        )}
      </Dialog>
    </>
  );
}
