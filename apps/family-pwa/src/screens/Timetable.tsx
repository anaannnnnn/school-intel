import { Fragment, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Card, Chip, EmptyState, Segmented, formatDate } from '@school-intel/ui';
import { DEMO_DATE, getDb, learn, useDb } from '@school-intel/api';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { PRESENCE, hueStyle } from '../kit';
import { NoChildren } from './NoChildren';
import '../student-c2.css';

const DAYS = [
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
];

const TODAY = (() => {
  const d = new Date(`${DEMO_DATE}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
})();

const dateOf = (day: number) => {
  const d = new Date(`${DEMO_DATE}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (day - TODAY));
  return d.toISOString().slice(0, 10);
};

const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

type Lesson = {
  id: string;
  start: string;
  end: string;
  room: string;
  subject: { id: string; name: string; hue: number };
  teacher: string;
  state?: 'now' | 'done' | 'later';
  presence?: keyof typeof PRESENCE;
};

export function Timetable() {
  const { actor, isParent, child } = useFamily();
  useDb();
  const [day, setDay] = useState(String(TODAY <= 5 ? TODAY : 1));
  if (!child) return <NoChildren />;

  const d = Number(day);
  const isToday = d === TODAY;
  const db = getDb();
  const teacherOf = (teacherId: string) => db.staff.find((s) => s.id === teacherId)?.name ?? '';
  const lessons: Lesson[] = isToday
    ? learn.timetableFor(actor, child.id)
    : (learn.weekTimetable(actor, child.id).find((w) => w.day === d)?.periods ?? [])
        .slice()
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((p) => ({ ...p, teacher: teacherOf(p.subject.teacherId) }));
  const hasAny = learn.weekTimetable(actor, child.id).some((w) => w.periods.length);

  return (
    <>
      <PageHeader back={isParent ? '/progress' : true} eyebrow={isParent ? `${child.firstName} · Year ${child.classId}` : `Year ${child.classId}`} title="Timetable" />
      {isParent && <ChildSwitcher />}

      {!hasAny ? (
        <Card>
          <EmptyState icon={CalendarDays} title="Timetable not available yet">
            {isParent ? `${child.firstName}’s` : 'Your'} class timetable will appear here once the school publishes it.
          </EmptyState>
        </Card>
      ) : (
        <>
          <Segmented label="Day of the week" value={day} onChange={setDay} options={DAYS} />
          <p className="eyebrow">
            {isToday ? 'Today · ' : ''}
            {formatDate(dateOf(d), { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {lessons.length === 0 ? (
            <Card><p className="muted small">No lessons on this day.</p></Card>
          ) : (
            <div className="timeline-day">
              {lessons.map((l, i) => {
                const gap = i > 0 ? mins(l.start) - mins(lessons[i - 1].end) : 0;
                return (
                  <Fragment key={l.id}>
                    {gap >= 20 && <div className="lesson-break">Break · {lessons[i - 1].end}–{l.start}</div>}
                    <div className="lesson" data-state={l.state} style={hueStyle(l.subject.hue)} aria-current={l.state === 'now' ? 'time' : undefined}>
                      <time>{l.start}<small>{l.end}</small></time>
                      <span className="lesson-main">
                        <span className="lesson-bar" aria-hidden />
                        <span className="lesson-text">
                          <strong>{l.subject.name}</strong>
                          <small>{l.room} · {l.teacher}</small>
                        </span>
                      </span>
                      {l.state === 'now' ? (
                        <Chip tone="info">Now</Chip>
                      ) : l.presence ? (
                        <Chip tone={PRESENCE[l.presence].tone}>{PRESENCE[l.presence].label}</Chip>
                      ) : l.state === 'done' ? (
                        <Chip tone="neutral" dot={false}>Done</Chip>
                      ) : (
                        <span />
                      )}
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
          {isToday && <p className="small muted">Attendance marks appear after each teacher takes the lesson register.</p>}
        </>
      )}
    </>
  );
}
