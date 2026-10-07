import { Link } from 'react-router-dom';
import { BookOpen, CalendarClock, FileText, Info, Target } from 'lucide-react';
import { Callout, Card, CardHeader, Chip, EmptyState, formatDate, type Tone } from '@school-intel/ui';
import { family, useDb } from '@school-intel/api';
import type { Mastery } from '@school-intel/contracts';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { NoChildren } from './NoChildren';

const MASTERY: Record<Mastery, { label: string; tone: Tone }> = {
  secure: { label: 'Secure', tone: 'success' },
  developing: { label: 'Developing', tone: 'info' },
  practice: { label: 'Practice focus', tone: 'warning' },
  insufficient: { label: 'Not enough evidence', tone: 'neutral' },
};

export function Learning() {
  const { actor, child, isParent } = useFamily();
  useDb();
  if (!child) return <NoChildren />;
  const p = family.passport(actor, child.id);
  const comments = family.publishedComments(actor, child.id);

  return (
    <>
      <PageHeader eyebrow={isParent ? 'Learning' : 'Your learning'} title={isParent ? `${child.firstName}’s learning passport` : 'Learning passport'} />
      {isParent && <ChildSwitcher />}

      {!p ? (
        <Card>
          <EmptyState icon={BookOpen} title="No approved summary yet">
            Learning summaries appear here once a teacher has reviewed and approved them.
          </EmptyState>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader icon={Target} title={p.subject} sub={`Teacher-approved · ${formatDate(p.approvedAt!)} · ${p.approvedBy}`} />
            <ul className="glance">
              {p.objectives.map((o) => (
                <li key={o.id}>
                  <span className="glance-body">
                    <span className="glance-title">{o.label}</span>
                    <span className="glance-detail">{o.sources} assessment {o.sources === 1 ? 'source' : 'sources'}</span>
                  </span>
                  <Chip tone={MASTERY[o.mastery].tone}>{MASTERY[o.mastery].label}</Chip>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader icon={CalendarClock} title="This week’s practice" sub={`Next checkpoint: ${formatDate(p.nextCheckpoint, { weekday: 'long', day: 'numeric', month: 'short' })}`} />
            <ul className="glance">
              {p.practice.map((x) => (
                <li key={x}><span className="glance-body"><span>{x}</span></span></li>
              ))}
            </ul>
          </Card>
          <Callout tone="neutral" icon={Info} title="Evidence and limits">
            {p.latest}. Mastery is only shown where there is enough evidence; one test does not establish mastery. Grades from different scales are not combined.
          </Callout>
        </>
      )}

      <h2 className="section-title">Report comments</h2>
      {comments.length === 0 ? (
        <Card><p className="muted small">No published comments yet. Teachers review every comment before it is shared.</p></Card>
      ) : (
        comments.map((c) => (
          <Card key={c.id}>
            <CardHeader icon={FileText} tone="info" title={`${c.subject} · ${c.period}`} sub={`${c.teacher} · published ${formatDate(c.publishedAt)}`} />
            <p style={{ lineHeight: 1.6 }}>{c.text}</p>
          </Card>
        ))
      )}

      {isParent && (
        <Link to="/tasks" className="btn btn-secondary btn-block">View {child.firstName}’s assignments</Link>
      )}
    </>
  );
}
