import { Bus as BusIcon, CircleCheck, MapPinned, PhoneCall, TriangleAlert } from 'lucide-react';
import { Callout, Card, CardHeader, Chip, formatTime } from '@school-intel/ui';
import { family, useDb } from '@school-intel/api';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { NoChildren } from './NoChildren';

export function Bus() {
  const { actor, child } = useFamily();
  useDb();
  if (!child) return <NoChildren />;
  const r = family.busFor(actor, child.id);
  return (
    <>
      <PageHeader back="/more" eyebrow="Transport" title="Bus journey" />
      <ChildSwitcher />
      {!r ? (
        <Card><p className="muted">{child.firstName} is not assigned to a school bus route.</p></Card>
      ) : (
        <>
          <Card>
            <CardHeader icon={BusIcon} title={r.label} sub={r.service} action={r.stale ? <Chip tone="warning">Out of date</Chip> : <Chip tone="success">Live</Chip>} />
            {r.stale ? (
              <div className="stack-sm">
                <strong style={{ fontSize: 'var(--text-xl)' }}>Arrival estimate unavailable</strong>
                <p className="small muted">Last location update {formatTime(r.lastLocationAt)} · 8 minutes ago. A reliable arrival time can’t be shown.</p>
              </div>
            ) : (
              <div className="stack-sm">
                <span className="small muted">Expected arrival</span>
                <strong className="tabular" style={{ fontFamily: 'var(--font-heading)', fontSize: 30, lineHeight: 1.1 }}>{r.etaFrom}–{r.etaTo}</strong>
                <p className="small muted">Location updated {formatTime(r.lastLocationAt)}. The estimate changes with traffic.</p>
              </div>
            )}
          </Card>
          <Card>
            <CardHeader icon={r.boardedAt ? CircleCheck : MapPinned} title={`${child.firstName}’s boarding status`} />
            {r.boardedAt ? (
              <p><strong>Boarded</strong> · authorised scan at {formatTime(r.boardedAt)}</p>
            ) : (
              <p>No boarding scan yet.</p>
            )}
            <p className="small muted" style={{ marginBlockStart: 6 }}>Bus position alone does not confirm boarding.</p>
          </Card>
          <Callout tone="warning" icon={TriangleAlert} title="Route update">Basketball collection change is not confirmed for this date. Contact the transport desk for assistance.</Callout>
          <a href="tel:+97140000001" className="btn btn-secondary btn-block"><PhoneCall size={16} aria-hidden /> Contact transport desk</a>
        </>
      )}
    </>
  );
}
