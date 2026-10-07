import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Inbox, MessageSquareText } from 'lucide-react';
import { Card, Chip, EmptyState, formatDate, formatTime } from '@school-intel/ui';
import { family, getDb, useDb } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { REQUEST_STATUS } from '../statuses';

export function Requests() {
  const { actor } = useFamily();
  useDb();
  const list = family.myRequests(actor);
  const student = (id: string) => getDb().students.find((s) => s.id === id)?.firstName ?? '';

  return (
    <>
      <PageHeader eyebrow="School office" title="Requests" />
      <div className="quick-grid">
        <Link to="/requests/new/early-collection" className="quick">
          <span className="card-icon" aria-hidden><Clock size={18} /></span>
          <span><strong>Early collection</strong><small>Needs staff approval</small></span>
        </Link>
        <Link to="/ask" className="quick">
          <span className="card-icon" aria-hidden><MessageSquareText size={18} /></span>
          <span><strong>Ask a question</strong><small>Approved answers first</small></span>
        </Link>
      </div>

      <h2 className="section-title">Your requests</h2>
      {list.length === 0 ? (
        <Card>
          <EmptyState icon={Inbox} title="No requests yet">Requests you send to the school appear here with their approval status.</EmptyState>
        </Card>
      ) : (
        <div className="stack">
          {list.map((r) => (
            <Link key={r.id} to={`/requests/${r.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="grow stack-sm" style={{ gap: 4 }}>
                <div className="row-between">
                  <span className="eyebrow">{r.id} · {student(r.studentId)}</span>
                  <Chip tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</Chip>
                </div>
                <strong>{r.subject}</strong>
                <span className="small muted">Submitted {formatDate(r.submittedAt)}, {formatTime(r.submittedAt)}</span>
              </div>
              <ArrowRight size={18} className="flip-rtl" aria-hidden />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
