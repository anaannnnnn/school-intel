import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpenCheck, Check, ClipboardList, Clock, FileText, Library, LifeBuoy, ListChecks, MapPin, MessageCircleQuestion, PenLine, Timer, type LucideIcon } from 'lucide-react';
import { Avatar, Button, Callout, Card, CardHeader, Chip, Progress, formatDate, formatTime, formatWeekday, useToast, errorText, type Tone } from '@school-intel/ui';
import { className, DEMO_DATE, family, learn, nowIso, useDb } from '@school-intel/api';
import { useFamily } from '../family-context';
import { PRow, Ring, SectionTitle, SUBJECT_ICON, daysLabel, scoreTone } from '../kit';
import { greeting } from './ParentToday';
import '../student-c1.css';

type Lesson = ReturnType<typeof learn.timetableFor>[number];

interface DueRow {
  key: string;
  icon: LucideIcon;
  tone?: Tone | 'success' | 'pink';
  title: string;
  sub: string;
  to: string;
  chip: { tone: Tone; label: string };
}

const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Next school day after the demo date (Monday to Friday). */
function nextSchoolDay(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  do d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0, 10);
}

function closesLabel(iso: string) {
  return iso.slice(0, 10) === DEMO_DATE ? `closes ${formatTime(iso)} today` : `closes ${formatDate(iso)}, ${formatTime(iso)}`;
}

export function StudentToday() {
  const { actor, firstName, child } = useFamily();
  useDb();
  const toast = useToast();
  const [showAll, setShowAll] = useState(false);
  if (!child) return null;

  const view = family.feed(actor, child.id);
  const day = learn.studentDay(actor, child.id);
  const isStudent = actor.kind === 'student';
  const tomorrow = nextSchoolDay(DEMO_DATE);
  const firstTomorrow = day.lessons.length ? learn.timetableFor(actor, child.id, tomorrow)[0] : undefined;

  // ---- Due for you: tests first, then written work and homework by due date, then quizzes.
  const due: DueRow[] = [];
  for (const t of day.tests.todo.filter((x) => x.kind === 'test')) {
    const inProgress = t.attempt?.status === 'in-progress';
    due.push({
      key: t.id,
      icon: Timer,
      tone: 'warning',
      title: t.title,
      sub: [t.subject.short, t.durationMin ? `${t.durationMin} min` : undefined, t.closesAt ? closesLabel(t.closesAt) : undefined].filter(Boolean).join(' · '),
      to: inProgress ? `/tests/play/${t.attempt!.id}` : '/tests',
      chip: inProgress ? { tone: 'info', label: 'In progress' } : { tone: 'warning', label: 'Test' },
    });
  }
  const dated: (DueRow & { due: string })[] = [
    ...day.written.map((w) => ({
      key: w.id,
      due: w.due,
      icon: PenLine,
      tone: 'pink' as const,
      title: w.title,
      sub: `${w.subject.short} · due ${formatDate(w.due, { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(w.due)}`,
      to: `/written/${w.id}`,
      chip: { tone: 'info' as Tone, label: 'Writing' },
    })),
    ...family
      .assignmentsFor(actor, child.id)
      .filter((a) => !a.submission || a.submission.state === 'rejected')
      .map((a) => ({
        key: a.id,
        due: a.due,
        icon: ClipboardList,
        tone: undefined,
        title: a.title,
        sub: `${a.subject} · due ${formatDate(a.due, { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(a.due)} · ${a.minutes} min`,
        to: `/tasks/${a.id}`,
        chip: a.acceptsSubmission ? { tone: 'warning' as Tone, label: 'Upload' } : { tone: 'neutral' as Tone, label: 'Homework' },
      })),
  ].sort((a, b) => a.due.localeCompare(b.due));
  due.push(...dated);
  for (const q of day.tests.todo.filter((x) => x.kind === 'quiz')) {
    const inProgress = q.attempt?.status === 'in-progress';
    due.push({
      key: q.id,
      icon: ListChecks,
      tone: 'success',
      title: q.title,
      sub: `${q.subject.short} · ${q.questionCount} questions · no time limit`,
      to: inProgress ? `/tests/play/${q.attempt!.id}` : '/tests',
      chip: inProgress ? { tone: 'info', label: 'In progress' } : { tone: 'success', label: 'Quiz' },
    });
  }
  const visibleDue = showAll ? due : due.slice(0, 4);

  const exam = day.nextExam;
  const plan = day.todayTasks;
  const planDone = plan.filter((t) => t.done).length;
  const planMinutes = plan.reduce((n, t) => n + t.minutes, 0);

  const toggle = (id: string) => {
    try {
      learn.togglePlanTask(actor, id);
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  return (
    <>
      <div className="greeting">
        <p>{formatWeekday(`${DEMO_DATE}T09:00:00+04:00`)}</p>
        <h1>{greeting()}, {firstName}</h1>
      </div>

      <div className="row wrap" style={{ gap: 8 }}>
        <span className="context-pill"><Avatar initials={child.initials} /><span>{className(child.classId)}</span></span>
        <Link to="/behaviour" className="context-pill c1-merits" aria-label={`${day.merits} merit points. See merits and behaviour`}>
          <span className="c1-merit-icon" aria-hidden><Award size={15} /></span>
          <span><strong>{day.merits}</strong> merit{day.merits === 1 ? '' : 's'}</span>
        </Link>
      </div>

      {view.lmsStale && (
        <Callout tone="warning" title="Task list may be out of date">
          The learning platform last synced at {formatTime(view.lastSync.LMS)}. Check with your teacher if something looks wrong.
        </Callout>
      )}

      <HeroLesson lessons={day.lessons} current={day.current} next={day.next} firstTomorrow={firstTomorrow} tomorrow={tomorrow} name={firstName} />

      <SectionTitle action={due.length > 0 ? <Link to="/tests">All tests</Link> : undefined}>Due for you</SectionTitle>
      {due.length === 0 ? (
        <Card>
          <p className="muted">Nothing due right now. Nice work.</p>
        </Card>
      ) : (
        <div className="rows">
          {visibleDue.map((r) => (
            <PRow key={r.key} icon={r.icon} tone={r.tone} title={r.title} sub={r.sub} to={r.to} end={<Chip tone={r.chip.tone} dot={false}>{r.chip.label}</Chip>} chevron={false} />
          ))}
          {due.length > 4 && (
            <Button variant="ghost" className="btn-tonal" size="sm" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} style={{ alignSelf: 'center' }}>
              {showAll ? 'Show fewer' : `Show ${due.length - 4} more`}
            </Button>
          )}
        </div>
      )}

      {exam && (
        <>
          <SectionTitle action={<Link to="/tests?tab=plan">Exam plan</Link>}>Next exam</SectionTitle>
          <Link to="/tests?tab=plan" className="card c1-link-reset" aria-label={`${exam.title}, ${exam.subject.name}, ${daysLabel(exam.days).toLowerCase()}. Readiness ${exam.readiness ?? 'not known yet'}${exam.readiness !== undefined ? '%' : ''}. Open exam plan`}>
            <div className="c1-exam">
              <div className="c1-exam-body">
                <strong>{exam.title}</strong>
                <span className="small muted">{exam.subject.name} · {formatDate(exam.date, { weekday: 'short', day: 'numeric', month: 'short' })}, {formatTime(exam.date)}</span>
                <span className="row wrap" style={{ gap: 6, marginBlockStart: 4 }}>
                  <Chip tone={exam.days <= 3 ? 'warning' : 'info'} dot={false}>{daysLabel(exam.days)}</Chip>
                  {exam.planTotal > 0 && <Chip tone="neutral" dot={false}>Plan {exam.planDone}/{exam.planTotal}</Chip>}
                </span>
              </div>
              <span className="c1-exam-ring">
                <Ring pct={exam.readiness ?? 0} size={62} label={exam.readiness !== undefined ? `${exam.readiness}%` : '–'} color={exam.readiness !== undefined ? toneColor(scoreTone(exam.readiness)) : undefined} />
                <small>Ready</small>
              </span>
            </div>
          </Link>
        </>
      )}

      {plan.length > 0 && (
        <Card>
          <CardHeader icon={BookOpenCheck} tone="success" title="Today’s study plan" sub={`${planMinutes} minutes · weakest topics first`} action={<Chip tone={planDone === plan.length ? 'success' : 'neutral'} dot={false}>{planDone}/{plan.length}</Chip>} />
          <Progress value={(planDone / plan.length) * 100} label="Study plan progress today" />
          <ul className="c1-plan" aria-label="Study plan tasks">
            {plan.map((t) => (
              <li key={t.id}>
                <button type="button" role="checkbox" aria-checked={t.done} disabled={!isStudent} onClick={() => toggle(t.id)}>
                  <span className="c1-check" aria-hidden>{t.done && <Check size={15} strokeWidth={3} />}</span>
                  <span className="c1-plan-label">
                    <strong>{t.label}</strong>
                    <small>{t.minutes} min · {t.kind === 'read' ? 'Reading' : t.kind === 'practise' ? 'Practice' : 'Past paper'}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <SectionTitle>Shortcuts</SectionTitle>
      <div className="quick-grid">
        <Link to="/ask" className="quick">
          <span className="card-icon" aria-hidden><MessageCircleQuestion size={18} /></span>
          <span><strong>Ask the study helper</strong><small>{day.aiAllowed ? 'Hints from your class notes' : 'Available from Year 7'}</small></span>
        </Link>
        <Link to="/tests" className="quick">
          <span className="card-icon" data-tone="warning" aria-hidden><FileText size={18} /></span>
          <span><strong>Past papers</strong><small>Timed practice, marked instantly</small></span>
        </Link>
        <Link to="/learn" className="quick">
          <span className="card-icon" data-tone="success" aria-hidden><Library size={18} /></span>
          <span><strong>Class notes</strong><small>Materials from your teachers</small></span>
        </Link>
        <Link to="/help" className="quick">
          <span className="card-icon" data-tone="danger" aria-hidden><LifeBuoy size={18} /></span>
          <span><strong>Need help?</strong><small>Talk to a trusted adult, in confidence</small></span>
        </Link>
      </div>

      <p className="small muted" style={{ textAlign: 'center' }}>School records remain the official source</p>
    </>
  );
}

function toneColor(t: Tone) {
  return t === 'success' ? 'var(--color-success)' : t === 'warning' ? 'var(--color-warning-solid)' : t === 'danger' ? 'var(--color-danger)' : undefined;
}

function HeroLesson({ lessons, current, next, firstTomorrow, tomorrow, name }: { lessons: Lesson[]; current?: Lesson; next?: Lesson; firstTomorrow?: Lesson; tomorrow: string; name: string }) {
  const nowMin = minutesOf(nowIso().slice(11, 16));
  const done = lessons.filter((l) => l.state === 'done').length;
  const focus = current ?? next;

  if (!lessons.length) {
    return (
      <section className="hero-card" aria-label="Today’s lessons">
        <span className="eyebrow">Today</span>
        <h2>No lessons on your timetable</h2>
        <p>Your class timetable has not been shared with this app yet.</p>
      </section>
    );
  }

  const bar = (
    <>
      <div className="c1-daybar" role="img" aria-label={`${done} of ${lessons.length} lessons done`}>
        {lessons.map((l) => {
          const fill = l.state === 'now' ? Math.round(((nowMin - minutesOf(l.start)) / Math.max(1, minutesOf(l.end) - minutesOf(l.start))) * 100) : undefined;
          return <i key={l.id} data-state={l.state} style={fill !== undefined ? ({ ['--fill' as string]: `${fill}%` }) : undefined} title={`${l.start} ${l.subject.short}`} />;
        })}
      </div>
      <div className="c1-daybar-legend" aria-hidden>
        <span>{lessons[0].start}</span>
        <span>{done} of {lessons.length} done</span>
        <span>{lessons[lessons.length - 1].end}</span>
      </div>
    </>
  );

  if (!focus) {
    return (
      <section className="hero-card" aria-label="Today’s lessons">
        <div className="c1-hero-top">
          <span className="eyebrow">School day done</span>
          <Chip tone="neutral" dot={false}>{lessons.length} lessons</Chip>
        </div>
        <h2 style={{ position: 'relative', zIndex: 1 }}>That’s a wrap, {name}</h2>
        {firstTomorrow && (
          <p style={{ position: 'relative', zIndex: 1 }}>
            First lesson {formatDate(tomorrow, { weekday: 'long' })}: <strong style={{ color: 'var(--color-on-brand)' }}>{firstTomorrow.subject.name}</strong> at {firstTomorrow.start}, {firstTomorrow.room}.
          </p>
        )}
        {bar}
        <div className="c1-hero-foot">
          <Link to="/timetable" className="btn btn-sm">See timetable</Link>
        </div>
      </section>
    );
  }

  const Icon = SUBJECT_ICON[focus.subject.id] ?? Library;
  const index = lessons.indexOf(focus) + 1;
  const startsIn = focus.state === 'later' ? minutesOf(focus.start) - nowMin : 0;
  return (
    <section className="hero-card" aria-label={current ? 'Lesson now' : 'Next lesson'}>
      <div className="c1-hero-top">
        <span className="eyebrow">{current ? 'Now' : 'Up next'} · Lesson {index} of {lessons.length}</span>
        {current ? <Chip tone="neutral" dot={false}>Ends {current.end}</Chip> : startsIn > 0 && startsIn <= 90 ? <Chip tone="neutral" dot={false}>In {startsIn} min</Chip> : null}
      </div>
      <div className="c1-hero-subject">
        <span className="c1-hero-icon" aria-hidden><Icon size={26} /></span>
        <div style={{ minWidth: 0 }}>
          <h2>{focus.subject.name}</h2>
          <p className="small">{focus.teacher}</p>
        </div>
      </div>
      <div className="c1-hero-meta">
        <span><Clock size={15} aria-hidden /> {focus.start}–{focus.end}</span>
        <span><MapPin size={15} aria-hidden /> {focus.room}</span>
        {current && next && <span>Then {next.subject.short} at {next.start}</span>}
      </div>
      {bar}
      <div className="c1-hero-foot">
        <Link to="/timetable" className="btn btn-sm">See timetable</Link>
      </div>
    </section>
  );
}
