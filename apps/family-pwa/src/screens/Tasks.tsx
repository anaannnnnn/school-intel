import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Callout, Chip, formatDate, formatTime } from '@school-intel/ui';
import { family, useDb } from '@school-intel/api';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { NoChildren } from './NoChildren';

export function Tasks() {
  const { actor, child, isParent } = useFamily();
  useDb();
  if (!child) return <NoChildren />;
  const tasks = family.assignmentsFor(actor, child.id);
  return (
    <>
      <PageHeader eyebrow={isParent ? `${child.firstName} · Year ${child.classId}` : `Year ${child.classId}`} title="Assignments" back={isParent ? '/learning' : undefined} />
      {isParent && <ChildSwitcher />}
      {tasks[0]?.stale && <Callout tone="warning">Assignments are the last confirmed copy. The learning platform is not responding.</Callout>}
      <div className="stack">
        {tasks.map((t) => (
          <Link key={t.id} to={`/tasks/${t.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="grow stack-sm" style={{ gap: 4 }}>
              <span className="eyebrow">{t.subject}</span>
              <strong>{t.title}</strong>
              <span className="small muted">Due {formatDate(t.due, { weekday: 'short', day: 'numeric', month: 'short' })}, {formatTime(t.due)} · {t.minutes} min</span>
              <span>
                {t.submission ? (
                  <Chip tone="success">Accepted · v{t.submission.version}</Chip>
                ) : t.acceptsSubmission ? (
                  <Chip tone="warning">Submission required</Chip>
                ) : (
                  <Chip tone="neutral">Complete in class book</Chip>
                )}
              </span>
            </div>
            <ArrowRight size={18} className="flip-rtl" aria-hidden />
          </Link>
        ))}
      </div>
    </>
  );
}
