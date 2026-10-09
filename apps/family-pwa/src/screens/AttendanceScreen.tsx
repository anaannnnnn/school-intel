import { Link } from 'react-router-dom';
import { CalendarCheck, Clock } from 'lucide-react';
import { Callout, Card, Chip, formatDate, formatTime } from '@school-intel/ui';
import { className, DEMO_DATE, learn, useDb } from '@school-intel/api';
import type { AttendanceDay, Presence } from '@school-intel/contracts';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { HeroBars, PRESENCE, SectionTitle, SubjectTile } from '../kit';
import { NoChildren } from './NoChildren';
import '../student-c2.css';

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};
const mondayOf = (date: string) => {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -((dow + 6) % 7));
};

type Cell = { date: string; s: Presence | 'none' | 'future' };

/** Weeks (Mon–Fri) from the first recorded day to the end of the current week. */
function weeks(days: AttendanceDay[]) {
  if (!days.length) return [];
  const map = new Map(days.map((d) => [d.date, d.status]));
  const first = mondayOf([...days].sort((a, b) => a.date.localeCompare(b.date))[0].date);
  const last = mondayOf(DEMO_DATE);
  const out: { monday: string; cells: Cell[] }[] = [];
  for (let m = first; m <= last; m = addDays(m, 7)) {
    out.push({
      monday: m,
      cells: [0, 1, 2, 3, 4].map((i) => {
        const date = addDays(m, i);
        return { date, s: date > DEMO_DATE ? 'future' : (map.get(date) ?? 'none') };
      }),
    });
  }
  return out;
}

export function AttendanceScreen() {
  const { actor, isParent, child } = useFamily();
  useDb();
  if (!child) return <NoChildren />;
  const a = learn.attendanceFor(actor, child.id);
  const grid = weeks(a.days);
  const weekRates = grid.map((w) => {
    const rec = w.cells.filter((c) => c.s !== 'none' && c.s !== 'future');
    return rec.length ? rec.filter((c) => c.s === 'present' || c.s === 'late').length / rec.length : 0;
  });
  const total = a.days.length;

  let lastMonth = '';

  return (
    <>
      <PageHeader back={isParent ? '/progress' : true} eyebrow={isParent ? `${child.firstName} · ${className(child.classId)}` : 'Your record'} title="Attendance" />
      {isParent && <ChildSwitcher />}

      <section className="hero-card" aria-label="Attendance this term">
        <span className="eyebrow">This term · {total} school days</span>
        <div className="hero-split">
          <div className="stack-sm" style={{ gap: 4 }}>
            <span className="hero-num">{a.rate}%</span>
            <p>attendance, including late arrivals</p>
          </div>
          {weekRates.length > 1 && <HeroBars values={weekRates.map((r) => Math.max(r, 0.05))} />}
        </div>
        <p className="hero-line">Present {a.present} · Late {a.late} · Absent {a.absent} · Excused {a.excused}</p>
      </section>

      <SectionTitle>Today’s lessons</SectionTitle>
      {a.lessonsToday.length ? (
        <div className="timeline-day">
          {a.lessonsToday
            .slice()
            .sort((x, y) => x.period.start.localeCompare(y.period.start))
            .map((l) => (
              <div key={l.period.id} className="lesson">
                <time>{l.period.start}<small>{l.period.end}</small></time>
                <span className="lesson-main">
                  <SubjectTile subjectId={l.subject.id} hue={l.subject.hue} size={36} />
                  <span className="lesson-text">
                    <strong>{l.subject.name}</strong>
                    <small>Room {l.period.room}</small>
                  </span>
                </span>
                {l.mark ? <Chip tone={PRESENCE[l.mark].tone}>{PRESENCE[l.mark].label}</Chip> : <Chip tone="neutral" dot={false}><Clock size={12} aria-hidden /> Not taken yet</Chip>}
              </div>
            ))}
        </div>
      ) : (
        <Card>
          <p className="muted small">No lesson registers for {isParent ? child.firstName : 'you'} yet today. The daily register is still recorded by the class teacher.</p>
        </Card>
      )}

      <SectionTitle>Term calendar</SectionTitle>
      <Card>
        <div className="stack">
          {grid.length ? (
            <div className="att-grid" role="list" aria-label="Attendance by day">
              {WD.map((d) => <span key={d} className="wd" aria-hidden>{d}</span>)}
              {grid.map((w) => {
                const month = formatDate(w.cells.find((c) => c.date.slice(8) <= '07' && c.date.slice(8) >= '01')?.date ?? w.monday, { month: 'long' });
                const label = month !== lastMonth ? month : '';
                lastMonth = month;
                return [
                  label && <span key={`m-${w.monday}`} className="att-month" aria-hidden>{label}</span>,
                  ...w.cells.map((c) => {
                    const desc = c.s === 'future' ? 'upcoming' : c.s === 'none' ? 'no school day recorded' : PRESENCE[c.s].label;
                    return (
                      <span
                        key={c.date}
                        role="listitem"
                        className="att-day"
                        data-s={c.s}
                        data-today={c.date === DEMO_DATE || undefined}
                        aria-label={`${formatDate(c.date, { weekday: 'short', day: 'numeric', month: 'short' })}: ${desc}`}
                        title={desc}
                      >
                        {Number(c.date.slice(8))}
                      </span>
                    );
                  }),
                ];
              })}
            </div>
          ) : (
            <p className="muted small">No attendance has been recorded yet this term.</p>
          )}
          <div className="legend" aria-hidden>
            <span><i style={{ background: 'var(--color-success-soft)' }} />Present</span>
            <span><i style={{ background: 'var(--color-warning)' }} />Late</span>
            <span><i style={{ background: 'var(--color-danger-soft)' }} />Absent</span>
            <span><i style={{ background: 'var(--color-neutral-soft)' }} />Excused</span>
          </div>
          <p className="fine">Updated from the school register · {formatTime(`${DEMO_DATE}T08:15:00+04:00`)} today</p>
        </div>
      </Card>

      {isParent ? (
        <Callout tone="info" icon={CalendarCheck} title="Reporting an absence">
          If {child.firstName} is unwell or will be away, tell the school before 08:00 through <Link to="/requests">Requests</Link>. The office marks the day as excused once it is confirmed.
        </Callout>
      ) : (
        <Callout tone="info" icon={CalendarCheck} title="Missed a day?">
          Ask your parent or guardian to let the school know through their app. Your teachers can share any work you missed.
        </Callout>
      )}
    </>
  );
}
