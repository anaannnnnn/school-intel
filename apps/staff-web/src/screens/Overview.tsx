import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  DatabaseZap,
  FileQuestion,
  HeartHandshake,
  Inbox,
  ListTodo,
  Lock,
  MessageCircleQuestion,
  PenLine,
  Sparkles,
  TrendingUp,
  CircleCheck,
} from 'lucide-react';
import { Card, CardHeader, Chip, EmptyState, formatDate, formatTime, type Tone } from '@school-intel/ui';
import { className, DEMO_DATE, getDb, staff, teach, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, ListRow, PageFoot, PageHead, Stat, SubjectDot } from '../ui';
import '../teaching-b.css';

interface Row {
  record: string;
  group: string;
  status: string;
  tone: Tone;
  next: string;
  to: string;
}

type Summary = NonNullable<ReturnType<typeof teach.teachingSummary>>;

/** Counts per day for the five days ending on the demo date (oldest first). */
function lastFiveDays(dates: string[]) {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(`${DEMO_DATE}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (4 - i));
    return d.toISOString().slice(0, 10);
  });
  return days.map((day) => dates.filter((x) => x.slice(0, 10) === day).length);
}

const daysUntil = (iso: string) => Math.round((new Date(`${iso.slice(0, 10)}T12:00:00Z`).getTime() - new Date(`${DEMO_DATE}T12:00:00Z`).getTime()) / 86_400_000);

export function Overview({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const o = staff.overviewFor(actor);
  const me = o.staff;
  const d = getDb();
  const name = (id: string) => d.students.find((s) => s.id === id)?.name ?? '';
  const isTeacher = me.roles.includes('teacher');
  const pendingDrafts = o.drafts.filter((x) => ['draft', 'edited', 'missing-evidence'].includes(x.state));
  const approved = o.drafts.filter((x) => ['approved', 'published'].includes(x.state)).length;
  const summary = teach.teachingSummary(actor);

  const rows: Row[] = [
    ...pendingDrafts.map((x) => ({
      record: name(x.studentId),
      group: `${className(x.classId)}`,
      status: x.state === 'missing-evidence' ? 'Missing evidence' : `${x.subject} draft v${x.versions.length}`,
      tone: (x.state === 'missing-evidence' ? 'warning' : 'info') as Tone,
      next: x.state === 'missing-evidence' ? 'Add teacher note' : 'Review draft',
      to: `/copilot/${x.id}`,
    })),
    ...o.cases.map((c) => ({
      record: `${c.id} · ${name(c.studentId).split(' ')[0]}`,
      group: `Class ${d.students.find((s) => s.id === c.studentId)?.classId}`,
      status: c.status === 'insufficient-data' ? 'Insufficient data' : 'Review due',
      tone: (c.status === 'insufficient-data' ? 'neutral' : 'warning') as Tone,
      next: 'Open case',
      to: `/support/${c.id}`,
    })),
    ...o.requests.map((r) => ({
      record: `${r.id} · ${name(r.studentId).split(' ')[0]}`,
      group: formatTime(r.submittedAt),
      status: r.subject,
      tone: (r.status === 'awaiting-approval' ? 'warning' : 'info') as Tone,
      next: r.status === 'awaiting-approval' ? 'Decide' : 'Record acknowledgements',
      to: `/requests/${r.id}`,
    })),
    ...o.concerns.map((c) => ({ record: c.id, group: formatTime(c.receivedAt), status: 'Restricted concern', tone: 'restricted' as Tone, next: c.status === 'received' ? 'Acknowledge' : 'Follow up', to: `/safeguarding/${c.id}` })),
    ...o.registers.map((r) => ({ record: `${className(r.classId)} register`, group: r.period, status: `${r.recorded} / ${r.total} recorded`, tone: 'warning' as Tone, next: 'Complete register', to: '/attendance' })),
    ...o.quarantine.map((q) => ({ record: `Source ${q.sourceId}`, group: `${q.rows} rows`, status: 'Quarantined', tone: 'danger' as Tone, next: 'Review mapping', to: '/integrations' })),
  ];

  const records = (
    <Card className="card-flush table-card">
      <CardHeader icon={ListTodo} title="Records and next actions" sub="Only records assigned to you" />
      <div style={{ height: 12 }} />
      <DataTable
        caption="Records and next actions"
        rows={rows}
        onRow={(r) => navigate(r.to)}
        empty={<EmptyState icon={ListTodo} title="Nothing needs your review">You have no assigned records awaiting action.</EmptyState>}
        columns={[
          { key: 'r', label: 'Record', render: (r) => <span className="strong">{r.record}</span> },
          { key: 'g', label: 'Group / time', render: (r) => r.group },
          { key: 's', label: 'Evidence / status', render: (r) => <Chip tone={r.tone}>{r.status}</Chip> },
          { key: 'n', label: 'Next step', render: (r) => <span className="row" style={{ color: 'var(--color-brand-ink)', fontWeight: 600 }}>{r.next} <ArrowRight size={14} aria-hidden /></span> },
        ]}
      />
    </Card>
  );

  if (summary) {
    return (
      <TeachingDay actor={actor} summary={summary} title={me.title} pendingDrafts={pendingDrafts.length} approved={approved} cases={o.cases.length} records={rows.length ? records : null} />
    );
  }

  return (
    <>
      <PageHead
        title={isTeacher ? 'Your teaching day' : `Good morning, ${me.name.split(' ')[0]}`}
        sub={`Tuesday, 6 October 2026 · Horizon Learning School · ${me.title}`}
        spec="MVP · P01 / P02"
      />

      <div className="stats">
        {me.roles.includes('pastoral') && <Stat icon={HeartHandshake} value={o.cases.length} label="Support follow-ups" to="/support" />}
        {me.roles.includes('office') && <Stat icon={Inbox} value={o.requests.filter((r) => r.status === 'awaiting-approval').length} label="Requests awaiting decision" to="/requests" tone="warning" />}
        {me.roles.includes('office') && <Stat icon={ClipboardList} value={o.requests.filter((r) => r.status === 'in-progress').length} label="Requests in progress" to="/requests" />}
        {me.roles.includes('safeguarding') && <Stat icon={Lock} value={o.concerns.length} label="Open restricted concerns" to="/safeguarding" tone="neutral" />}
        {me.roles.includes('attendance') && <Stat icon={CalendarCheck} value={o.registers.length} label="Registers pending" to="/attendance" tone={o.registers.length ? 'warning' : undefined} />}
        {me.roles.includes('it') && <Stat icon={DatabaseZap} value={o.quarantine.length} label="Mapping exceptions" to="/integrations" tone={o.quarantine.length ? 'danger' : undefined} />}
        {me.roles.includes('leadership') && <Stat icon={TrendingUp} value={staff.supportSummary().open} label="Open support cases (school)" foot="Aggregate only" to="/leadership" tone="neutral" />}
      </div>

      {records}

      <PageFoot updated={`6 Oct, ${formatTime(d.connectors[0].lastSuccess)}`} />
    </>
  );
}

function TeachingDay({ actor, summary: t, title, pendingDrafts, approved, cases, records }: { actor: Actor; summary: Summary; title: string; pendingDrafts: number; approved: number; cases: number; records: ReactNode }) {
  const d = getDb();
  const own = new Set(teach.mySubjects(actor).map((s) => s.id));
  const queue = teach.markingQueue(actor);
  const doubts = teach.doubtsInbox(actor).list;
  const weekSpark = [1, 2, 3, 4, 5].map((day) => d.periods.filter((p) => p.day === day && own.has(p.subjectId)).length);
  const markSpark = lastFiveDays(queue.map((x) => x.submittedAt));
  const doubtSpark = lastFiveDays(doubts.map((x) => x.createdAt));
  const regs = t.lessons.filter((l) => l.register);
  const toTake = regs.filter((l) => l.register!.status === 'open');
  const due = toTake.filter((l) => l.state !== 'later');
  const next = t.lessons.find((l) => l.state !== 'done');
  const mine = t.lessons.filter((l) => l.mine);

  const needs: Array<{ icon: typeof PenLine; tone?: Tone; title: string; sub: string; value: number; to: string }> = [];
  if (t.toMark) needs.push({ icon: PenLine, tone: 'warning', title: 'Answers to confirm', sub: 'AI-suggested marks waiting for your decision', value: t.toMark, to: '/marking' });
  if (t.escalated) needs.push({ icon: MessageCircleQuestion, tone: 'warning', title: 'Student questions waiting', sub: 'Still stuck after the study helper’s hints', value: t.escalated, to: '/doubts' });
  if (due.length) needs.push({ icon: CalendarCheck, tone: 'warning', title: 'Registers due', sub: due.map((l) => `${l.subject.short} ${l.period.start}`).join(' · '), value: due.length, to: `/lessons/${due[0].register!.id}` });
  if (t.draftQuestions) needs.push({ icon: FileQuestion, tone: 'info', title: 'AI question drafts', sub: 'Approve or reject before they enter the bank', value: t.draftQuestions, to: '/questions' });
  if (t.draftMaterials) needs.push({ icon: Sparkles, tone: 'info', title: 'AI material drafts', sub: 'Review before publishing to students', value: t.draftMaterials, to: '/materials' });
  if (pendingDrafts) needs.push({ icon: Sparkles, tone: 'info', title: 'Report comment drafts', sub: `Teacher Copilot · ${approved} already approved`, value: pendingDrafts, to: '/copilot' });
  if (t.openAssessments.length) needs.push({ icon: ClipboardCheck, title: 'Open assessments', sub: t.openAssessments.map((a) => `${a.title} (${a.submitted}/${a.classSize})`).join(' · '), value: t.openAssessments.length, to: t.openAssessments.length === 1 ? `/assessments/${t.openAssessments[0].id}` : '/assessments' });
  if (cases) needs.push({ icon: HeartHandshake, tone: 'neutral', title: 'Support follow-ups', sub: 'Cases assigned to you', value: cases, to: '/support' });

  return (
    <>
      <div className="page-head">
        <div>
          <span className="tb-date">Tuesday · 6 October 2026</span>
          <h1>Your teaching day</h1>
          <p>Horizon Learning School · {title}{next ? ` · next: ${next.subject.name} ${next.period.classId} at ${next.period.start}` : ''}</p>
        </div>
        <div className="page-actions">
          {t.toMark > 0 && <Link to="/marking" className="btn"><PenLine size={18} aria-hidden />Confirm marks</Link>}
          <Link to="/lessons" className="btn btn-secondary"><CalendarDays size={18} aria-hidden />Timetable</Link>
        </div>
      </div>

      <div className="stats">
        <Stat icon={CalendarDays} value={t.lessons.length} label="Lessons today" spark={weekSpark.some(Boolean) ? weekSpark : undefined} foot={mine.length !== t.lessons.length ? `${mine.length} yours · ${t.lessons.length - mine.length} as tutor` : 'Mon–Fri this week'} />
        <Stat icon={CalendarCheck} value={toTake.length} label="Registers to take" tone={due.length ? 'warning' : undefined} to={toTake[0] ? `/lessons/${toTake[0].register!.id}` : '/lessons'} delta={regs.length ? { value: `${regs.length - toTake.length}/${regs.length} done` } : undefined} foot={due.length ? `${due.length} due now` : undefined} />
        <Stat icon={PenLine} value={t.toMark} label="Answers to confirm" tone={t.toMark ? 'warning' : undefined} to="/marking" spark={markSpark.some(Boolean) ? markSpark : undefined} delta={markSpark[4] ? { value: `+${markSpark[4]} today` } : undefined} foot="AI suggests, you decide" />
        <Stat icon={MessageCircleQuestion} value={t.escalated} label="Student questions waiting" tone={t.escalated ? 'warning' : undefined} to="/doubts" spark={doubtSpark.some(Boolean) ? doubtSpark : undefined} delta={doubtSpark[4] ? { value: `+${doubtSpark[4]} today` } : undefined} foot="From the study helper" />
      </div>

      <div className="grid-main tb-dash">
        <div className="stack">
          <Card>
            <CardHeader icon={CalendarClock} title="Today’s lessons" sub="Tap a lesson to take or review its register" action={<Link to="/lessons" className="tb-link">All lessons <ArrowRight size={14} aria-hidden /></Link>} />
            {t.lessons.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No timetabled lessons today">Your lessons appear here when the timetable includes them.</EmptyState>
            ) : (
              <div className="lrows">
                {t.lessons.map((l) => {
                  const r = l.register;
                  const chip = !r ? <Chip tone="neutral">No register</Chip>
                    : r.status === 'submitted' ? <Chip tone="success">Register taken</Chip>
                    : l.state === 'later' ? <Chip tone="neutral">Later</Chip>
                    : <Chip tone="warning">{l.state === 'now' ? 'Take register now' : 'Register due'}</Chip>;
                  const inner = (
                    <>
                      <span className="tb-time-tile" data-state={l.state} aria-hidden>{l.period.start}</span>
                      <span className="lrow-body">
                        <span className="lrow-title"><span className="tb-subject"><SubjectDot hue={l.subject.hue} />{l.subject.name} · {l.period.classId}</span></span>
                        <span className="lrow-sub">{l.period.start}–{l.period.end} · {l.period.room}{l.mine ? '' : ' · tutor view'}{l.state === 'now' ? ' · in progress' : ''}</span>
                      </span>
                      <span className="tb-lrow-chip">{chip}</span>
                      {r && <ChevronRight size={16} className="chev flip-rtl" aria-hidden />}
                    </>
                  );
                  return r ? <Link key={l.period.id} to={`/lessons/${r.id}`} className="lrow">{inner}</Link> : <div key={l.period.id} className="lrow" style={{ cursor: 'default' }}>{inner}</div>;
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader icon={BookOpen} title="Upcoming exams" sub="Your subjects and the classes you tutor" />
            {t.upcoming.length === 0 ? (
              <p className="small muted">No exams scheduled.</p>
            ) : (
              <div className="lrows">
                {t.upcoming.map((e) => {
                  const subj = d.subjects.find((s) => s.id === e.subjectId);
                  const n = daysUntil(e.date);
                  return (
                    <ListRow
                      key={e.id}
                      icon={CalendarClock}
                      tone={n <= 3 ? 'warning' : 'neutral'}
                      title={e.title}
                      sub={`${subj?.name ?? ''} · ${e.classId} · ${formatDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(e.date)} · ${e.topicIds.length} topic${e.topicIds.length === 1 ? '' : 's'}`}
                      value={n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `in ${n} days`}
                    />
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <Card className="tb-needs">
          <CardHeader icon={ListTodo} tone={needs.length ? 'warning' : undefined} title="Needs you" sub={needs.length ? `${needs.length} item${needs.length === 1 ? '' : 's'} waiting` : 'You are all caught up'} />
          {needs.length === 0 ? (
            <EmptyState icon={CircleCheck} title="Nothing waiting">Marking, student questions and AI drafts will appear here.</EmptyState>
          ) : (
            <div className="lrows">
              {needs.map((n) => <ListRow key={n.title} icon={n.icon} tone={n.tone} title={n.title} sub={n.sub} value={n.value} to={n.to} />)}
            </div>
          )}
        </Card>
      </div>

      {records}

      <PageFoot updated={`6 Oct, ${formatTime(d.connectors[0].lastSuccess)}`} />
    </>
  );
}
