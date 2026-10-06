import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bus, CalendarCheck, CircleCheck, ClipboardList, FileText, MessageSquareText, Timer, Trophy, TriangleAlert, Users } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Checkbox, Chip, Dialog, Freshness, formatDate, formatTime, formatWeekday, useToast } from '@school-intel/ui';
import { DEMO_DATE, family, useDb } from '@school-intel/api';
import type { FeedItem } from '@school-intel/contracts';
import { ChildSwitcher } from '../Shell';
import { useFamily } from '../family-context';
import { NoChildren } from './NoChildren';

const SUBJECT_COLORS = ['#067a69', '#3f8f7f', '#8cc2b2', '#c6e1d6'];

export function greeting() {
  const h = new Date(Date.now() + 4 * 3600_000).getUTCHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const ICON: Record<string, typeof CalendarCheck> = { attendance: CalendarCheck, activity: Trophy, report: FileText, circular: FileText };

export function ParentToday() {
  const { actor, firstName, child, children } = useFamily();
  useDb();
  const toast = useToast();
  const [consentOpen, setConsentOpen] = useState(false);
  const [agree, setAgree] = useState(false);

  if (!child) return <NoChildren />;

  const view = family.feed(actor, child.id);
  const glance = view.items.filter((i) => ['attendance', 'activity', 'report'].includes(i.kind));
  const homework = view.items.filter((i) => i.kind === 'homework');
  const actions = view.items.filter((i) => i.kind === 'action');
  const minutes = homework.reduce((s, i) => s + (i.minutes ?? 0), 0);
  const pendingAction = actions.find((a) => a.status === 'action-needed');

  return (
    <>
      <div className="greeting">
        <p>{formatWeekday(`${DEMO_DATE}T09:00:00+04:00`)}</p>
        <h1>{greeting()}, {firstName}</h1>
      </div>

      <ChildSwitcher />

      {view.lmsStale && (
        <Callout tone="warning" title="Some school systems are not responding">
          Homework below is the last confirmed copy from {formatTime(view.lastSync.LMS)}. It may have changed.
        </Callout>
      )}

      <Card>
        <CardHeader icon={CircleCheck} title="Today at a glance" sub={`${child.firstName} · Year ${child.classId}`} />
        <ul className="glance">
          {glance.map((i) => (
            <GlanceRow key={i.id} item={i} />
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          icon={Timer}
          title="Tonight’s plan"
          sub="Teacher estimates for homework due tomorrow"
          action={<span className="plan-total tabular">{minutes}<small className="small muted" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}> min</small></span>}
        />
        {homework.length > 0 ? (
          <>
            <div className="plan-bar" aria-hidden>
              {homework.map((h, idx) => (
                <span key={h.id} style={{ flex: h.minutes ?? 1, background: SUBJECT_COLORS[idx % SUBJECT_COLORS.length] }} />
              ))}
            </div>
            <ul className="glance">
              {homework.map((h, idx) => (
                <li key={h.id}>
                  <span className="glance-icon" style={{ background: SUBJECT_COLORS[idx % SUBJECT_COLORS.length], width: 10, height: 10, borderRadius: 3, marginBlockStart: 7 }} aria-hidden />
                  <span className="glance-body">
                    <span className="glance-title">{h.title}</span>
                    <span className="glance-detail">{h.detail}</span>
                  </span>
                  <span className="tabular small" style={{ fontWeight: 600 }}>{h.minutes} min</span>
                </li>
              ))}
            </ul>
            <div style={{ marginBlockStart: 12 }}>
              <Freshness source="LMS" at={homework[0].source.updatedAt} stale={homework[0].stale} />
            </div>
          </>
        ) : (
          <p className="muted">No homework is due tomorrow.</p>
        )}
      </Card>

      {actions.length > 0 && (
        <Card>
          <CardHeader icon={pendingAction ? TriangleAlert : CircleCheck} tone={pendingAction ? 'warning' : undefined} title={pendingAction ? 'Action needed' : 'All actions complete'} />
          {actions.map((a) => {
            const consent = family.consentFor(actor, child.id, a.source.recordId);
            return (
              <div key={a.id} className="stack-sm">
                <div className="row-between">
                  <strong>{a.title}</strong>
                  {a.status === 'done' ? <Chip tone="success">Consent given</Chip> : <Chip tone="warning">Due {formatDate(a.due!)}</Chip>}
                </div>
                <p className="muted small">{a.detail}</p>
                {a.status !== 'done' ? (
                  <Button variant="brand" block onClick={() => setConsentOpen(true)} style={{ marginBlockStart: 8 }}>Review and give consent</Button>
                ) : (
                  consent?.at && <p className="small muted">Recorded {formatDate(consent.at)} at {formatTime(consent.at)}. Payment is made separately through the payment portal.</p>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {children.length > 1 && (
        <Card>
          <CardHeader icon={Users} title="One family, clear schedules" sub="After-school plans for each child" />
          <ul className="glance">
            {children.map((c) => {
              const after = family.feed(actor, c.id).items.filter((i) => i.kind === 'activity');
              return (
                <li key={c.id}>
                  <span className="glance-icon" data-tone="info" aria-hidden><Users size={16} /></span>
                  <span className="glance-body">
                    <span className="glance-title">{c.firstName}</span>
                    <span className="glance-detail">{after.length ? after.map((x) => `${x.title} · ${x.detail}`).join(' · ') : 'No after-school activity'}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="small muted" style={{ marginBlockStart: 12 }}>Sara’s basketball ends at 16:15; Adam’s pickup is at 14:30. Review collection plans for each child.</p>
        </Card>
      )}

      <div className="quick-grid">
        <Link to="/ask" className="quick">
          <span className="card-icon" aria-hidden><MessageSquareText size={18} /></span>
          <span><strong>Ask the school</strong><small>Answers from approved circulars</small></span>
        </Link>
        <Link to="/requests/new/early-collection" className="quick">
          <span className="card-icon" aria-hidden><ClipboardList size={18} /></span>
          <span><strong>Early collection</strong><small>Request staff approval</small></span>
        </Link>
        <Link to="/activities" className="quick">
          <span className="card-icon" aria-hidden><Trophy size={18} /></span>
          <span><strong>Clubs</strong><small>Bookings and consent</small></span>
        </Link>
        <Link to="/bus" className="quick">
          <span className="card-icon" aria-hidden><Bus size={18} /></span>
          <span><strong>Bus journey</strong><small>Route B12</small></span>
        </Link>
      </div>

      <p className="small muted" style={{ textAlign: 'center' }}>School records remain the official source · Fictional demonstration data</p>

      <Dialog
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        title="Museum visit consent"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConsentOpen(false)}>Not now</Button>
            <Button
              variant="brand"
              disabled={!agree}
              onClick={() => {
                family.giveConsent(actor, child.id, pendingAction!.source.recordId);
                setConsentOpen(false);
                toast('Consent recorded');
              }}
            >
              Give consent
            </Button>
          </>
        }
      >
        <dl className="kv">
          <dt>Student</dt><dd>{child.name}</dd>
          <dt>Trip</dt><dd>Year 7 museum visit</dd>
          <dt>Date</dt><dd>15 October 2026</dd>
          <dt>Cost</dt><dd>AED 150 · payment portal</dd>
          <dt>Respond by</dt><dd>10 October</dd>
        </dl>
        <Callout tone="neutral">Source: Year 7 Museum visit letter, issued 1 Oct. Payment is handled by the school’s payment portal, not in this app.</Callout>
        <Checkbox checked={agree} onChange={setAgree} label={`I give consent for ${child.firstName} to take part in this visit.`} />
      </Dialog>
    </>
  );
}

function GlanceRow({ item }: { item: FeedItem & { stale: boolean } }) {
  const Icon = ICON[item.kind] ?? CalendarCheck;
  const tone = item.kind === 'attendance' ? 'success' : item.kind === 'report' ? 'info' : undefined;
  return (
    <li>
      <span className="glance-icon" data-tone={tone} aria-hidden><Icon size={16} /></span>
      <span className="glance-body">
        <span className="glance-title">{item.title}</span>
        <span className="glance-detail">{item.detail}</span>
        <Freshness source={item.source.system === 'Platform' ? 'School' : item.source.system} at={item.source.updatedAt} stale={item.stale} />
      </span>
    </li>
  );
}
