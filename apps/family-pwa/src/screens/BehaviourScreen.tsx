import { Award, Heart, MessageCircleWarning } from 'lucide-react';
import { Callout, Card, EmptyState, formatDate } from '@school-intel/ui';
import { className, learn, useDb } from '@school-intel/api';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { PRow, SectionTitle } from '../kit';
import { NoChildren } from './NoChildren';
import '../student-c2.css';

export function BehaviourScreen() {
  const { actor, isParent, child } = useFamily();
  useDb();
  if (!child) return <NoChildren />;
  const b = learn.behaviourFor(actor, child.id);
  const merits = b.points.filter((p) => p.kind === 'merit');
  const notes = b.points.filter((p) => p.kind === 'demerit');

  return (
    <>
      <PageHeader back={isParent ? '/progress' : true} eyebrow={isParent ? `${child.firstName} · ${className(child.classId)}` : 'Your record'} title="Merits & behaviour" />
      {isParent && <ChildSwitcher />}

      <section className="hero-card" aria-label="Merits this term">
        <span className="eyebrow">This term</span>
        <div className="hero-split">
          <div className="stack-sm" style={{ gap: 4 }}>
            <span className="hero-num">{b.merits}</span>
            <p>{b.merits === 1 ? 'merit point' : 'merit points'} from {merits.length} {merits.length === 1 ? 'award' : 'awards'}</p>
          </div>
          <span className="prow-tile" style={{ background: 'color-mix(in srgb, var(--color-on-brand) 18%, transparent)', color: 'var(--color-on-brand)', width: 56, height: 56 }} aria-hidden>
            <Award size={28} />
          </span>
        </div>
        <p className="hero-line">{b.demerits === 0 ? 'No behaviour notes' : `${b.demerits} behaviour ${b.demerits === 1 ? 'note' : 'notes'}`}</p>
      </section>

      {b.points.length === 0 ? (
        <Card>
          <EmptyState icon={Award} title="Nothing recorded yet">
            Merits from teachers will appear here.
          </EmptyState>
        </Card>
      ) : (
        <>
          <SectionTitle>Recent</SectionTitle>
          <div className="rows">
            {b.points.map((p) => (
              <PRow
                key={p.id}
                icon={p.kind === 'merit' ? Award : MessageCircleWarning}
                tone={p.kind === 'merit' ? 'success' : 'warning'}
                title={p.category}
                sub={
                  <>
                    {p.note}
                    <br />
                    {p.by} · {formatDate(p.at)}
                  </>
                }
                end={<span className="prow-value" style={{ color: p.kind === 'merit' ? 'var(--color-success-ink)' : 'var(--color-warning-ink)' }}>{p.kind === 'merit' ? '+' : '−'}{p.points}</span>}
              />
            ))}
          </div>
          {notes.length > 0 && isParent && <p className="small muted">You’re notified when a behaviour note is added. Contact the form tutor through Ask if you’d like to talk it through.</p>}
        </>
      )}

      <Callout tone="neutral" icon={Heart}>Merits celebrate effort. Your school never ranks students against each other.</Callout>
    </>
  );
}
