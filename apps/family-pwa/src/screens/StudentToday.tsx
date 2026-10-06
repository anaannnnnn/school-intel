import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, LifeBuoy, ListChecks, MapPin, TrendingUp } from 'lucide-react';
import { Callout, Card, CardHeader, Chip, Freshness, Progress, formatTime, formatWeekday } from '@school-intel/ui';
import { DEMO_DATE, family, useDb } from '@school-intel/api';
import { useFamily } from '../family-context';
import { greeting } from './ParentToday';

export function StudentToday() {
  const { actor, firstName, child } = useFamily();
  useDb();
  if (!child) return null;
  const view = family.feed(actor, child.id);
  const homework = view.items.filter((i) => i.kind === 'homework');
  const minutes = homework.reduce((s, i) => s + (i.minutes ?? 0), 0);
  const tasks = family.assignmentsFor(actor, child.id);
  const submit = tasks.find((t) => t.acceptsSubmission && !t.submission);

  return (
    <>
      <div className="greeting">
        <p>{formatWeekday(`${DEMO_DATE}T09:00:00+04:00`)}</p>
        <h1>{greeting()}, {firstName}</h1>
      </div>
      <div className="context-pill"><span>Year {child.classId} · Your learning day</span></div>

      {view.lmsStale && <Callout tone="warning" title="Task list may be out of date">The learning platform last synced at {formatTime(view.lastSync.LMS)}.</Callout>}

      <Card>
        <CardHeader icon={Clock} title="Up next" sub="Lesson 3 of 6" />
        <div className="stack-sm">
          <strong style={{ fontSize: 'var(--text-lg)' }}>Mathematics · Equivalent fractions</strong>
          <div className="row small muted wrap" style={{ gap: 12 }}>
            <span className="row" style={{ gap: 4 }}><Clock size={14} aria-hidden /> 10:20–11:10</span>
            <span className="row" style={{ gap: 4 }}><MapPin size={14} aria-hidden /> Room B204</span>
            <span>Ms Nadia Farooq</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader icon={ListChecks} title={`Tonight · ${minutes} minutes`} sub="Plan your evening in this order" />
        <ol className="glance">
          {homework.map((h, i) => (
            <li key={h.id}>
              <span className="glance-icon" data-tone="success" aria-hidden><strong>{i + 1}</strong></span>
              <span className="glance-body">
                <span className="glance-title">{h.title}</span>
                <span className="glance-detail">{h.detail}</span>
              </span>
              <span className="small tabular" style={{ fontWeight: 600 }}>{h.minutes} min</span>
            </li>
          ))}
        </ol>
        {homework[0] && <div style={{ marginBlockStart: 12 }}><Freshness source="LMS" at={homework[0].source.updatedAt} stale={homework[0].stale} /></div>}
      </Card>

      {submit && (
        <Link to={`/tasks/${submit.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="card-icon" data-tone="warning" aria-hidden><BookOpen size={18} /></span>
          <span className="grow">
            <strong style={{ display: 'block' }}>{submit.title}</strong>
            <span className="small muted">Due 8 Oct, 18:00 · not yet submitted</span>
          </span>
          <ArrowRight size={18} className="flip-rtl" aria-hidden />
        </Link>
      )}

      <Card>
        <CardHeader icon={TrendingUp} title="You’re making progress" action={<Chip tone="success">2 of 3</Chip>} />
        <div className="stack-sm">
          <span className="small">Fractions practice sessions this week</span>
          <Progress value={66} label="Fractions practice progress" />
          <span className="small muted">Friday checkpoint · 9 Oct</span>
        </div>
      </Card>

      <Link to="/help" className="card help-hero" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="card-icon" aria-hidden><LifeBuoy size={18} /></span>
        <span className="grow">
          <strong style={{ display: 'block', color: '#fff' }}>Need to talk to someone?</strong>
          <span className="small">Confidential help from trained school staff</span>
        </span>
        <ArrowRight size={18} className="flip-rtl" aria-hidden />
      </Link>
    </>
  );
}
