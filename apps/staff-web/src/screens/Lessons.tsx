import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, CalendarDays, ClipboardCheck, Clock, Percent, UserX } from 'lucide-react';
import { Avatar, Callout, Card, CardHeader, Chip, EmptyState, formatTime, formatWeekday, type Tone } from '@school-intel/ui';
import { DEMO_DATE, getDb, learn, staff, teach, useDb } from '@school-intel/api';
import type { Actor, Presence } from '@school-intel/contracts';
import { PageFoot, PageHead, Stat, SubjectDot } from '../ui';
import '../teaching-a.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const TODAY = 2; // Tuesday 6 October 2026
const mins = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

const STATE: Record<'now' | 'done' | 'later', { label: string; tone: Tone }> = {
  now: { label: 'In progress', tone: 'info' },
  done: { label: 'Finished', tone: 'neutral' },
  later: { label: 'Later today', tone: 'neutral' },
};

const MARK: Record<Presence, { label: string; tone: Tone }> = {
  present: { label: 'Present', tone: 'success' },
  late: { label: 'Late', tone: 'warning' },
  absent: { label: 'Absent', tone: 'danger' },
  excused: { label: 'Excused', tone: 'info' },
};

export function Lessons({ actor }: { actor: Actor }) {
  useDb();
  const d = getDb();
  const me = staff.me(actor);
  const lessons = teach.teachingDay(actor);
  const visible = teach.subjectsVisible(actor);
  const own = new Set(teach.mySubjects(actor).map((s) => s.id));
  const isOfficer = me.roles.includes('attendance') && !me.roles.includes('teacher');
  const initials = (id?: string) => d.staff.find((s) => s.id === id)?.initials ?? '';

  const withReg = lessons.filter((l) => l.register);
  const submitted = withReg.filter((l) => l.register!.status === 'submitted');
  const next = lessons.find((l) => l.state === 'now') ?? lessons.find((l) => l.state === 'later');

  // Students marked late or absent in today's submitted registers for these lessons.
  const flagged = new Map<string, { mark: Presence; subject: string; start: string }[]>();
  for (const l of submitted) {
    for (const [sid, m] of Object.entries(l.register!.marks)) {
      if (m === 'late' || m === 'absent') flagged.set(sid, [...(flagged.get(sid) ?? []), { mark: m, subject: l.subject.short, start: l.period.start }]);
    }
  }
  const lateCount = [...flagged.values()].filter((x) => x.some((y) => y.mark === 'late')).length;
  const absentCount = [...flagged.values()].filter((x) => x.some((y) => y.mark === 'absent')).length;

  // Year 7A attendance (sessions attended, including late).
  const classIds = [...new Set(lessons.map((l) => l.period.classId))];
  const classId = classIds[0] ?? '7A';
  const roster = d.students.filter((s) => s.classId === classId);
  const rates = roster.map((s) => learn.attendanceSummary(d, s.id).rate);
  const classRate = rates.length ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10 : undefined;
  const histDates = [...new Set(roster.flatMap((s) => (d.attendanceHistory[s.id] ?? []).map((x) => x.date)))].sort().slice(-8);
  const spark = histDates.map((date) => {
    const marks = roster.map((s) => d.attendanceHistory[s.id]?.find((x) => x.date === date)?.status).filter(Boolean);
    return marks.length ? Math.round((marks.filter((m) => m === 'present' || m === 'late').length / marks.length) * 100) : 0;
  });

  // Weekly grid: periods for visible subjects (the attendance officer sees the whole class timetable).
  const visibleIds = new Set(visible.map((s) => s.id));
  const weekPeriods = d.periods.filter((p) => (isOfficer ? p.classId === classId : visibleIds.has(p.subjectId)));
  const slots = [...new Map(weekPeriods.map((p) => [`${p.start}-${p.end}`, { start: p.start, end: p.end }])).values()].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <>
      <PageHead
        title="Lessons & registers"
        sub={`${formatWeekday(DEMO_DATE)} 2026 · ${isOfficer ? 'Attendance officer view · all Year 7A lessons' : `${me.name} · ${me.title}`}`}
        spec="Teaching · lessons and lesson registers"
      />

      <div className="stats">
        <Stat icon={CalendarDays} value={lessons.length} label="Lessons today" foot={next ? `Next: ${next.subject.short} at ${next.period.start}` : 'No more lessons today'} />
        <Stat
          icon={ClipboardCheck}
          value={`${submitted.length}/${withReg.length}`}
          label="Registers submitted"
          tone={submitted.length < withReg.filter((l) => l.state !== 'later').length ? 'warning' : undefined}
          foot={`${withReg.filter((l) => l.register!.status === 'open' && l.state !== 'later').length} overdue · ${withReg.filter((l) => l.state === 'later').length} later today`}
        />
        <Stat icon={UserX} value={`${lateCount} / ${absentCount}`} label="Late / absent today" tone={absentCount ? 'danger' : lateCount ? 'warning' : undefined} foot="Students, from submitted registers" />
        <Stat icon={Percent} value={classRate === undefined ? '—' : `${classRate}%`} label={`Year ${classId} attendance`} tone={classRate !== undefined && classRate < 95 ? 'warning' : 'success'} spark={spark} foot="Term to date · school target 95%" />
      </div>

      <div className="grid-main">
        <Card>
          <CardHeader icon={Clock} title="Today’s lessons" sub={`${lessons.length} lessons · registers close at the end of each lesson`} />
          {lessons.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No lessons today">Your timetable has no lessons on {formatWeekday(DEMO_DATE)}.</EmptyState>
          ) : (
            <div className="ta-lessons">
              {lessons.map((l) => {
                const reg = l.register;
                const st = STATE[l.state];
                const overdue = reg?.status === 'open' && l.state === 'done';
                return (
                  <div key={l.period.id} className="ta-lesson" data-state={l.state}>
                    <div className="ta-lesson-time">
                      <span>{l.period.start}</span>
                      <small>{l.period.end}</small>
                    </div>
                    <div className="ta-lesson-body">
                      <span className="ta-lesson-title">
                        <SubjectDot hue={l.subject.hue} />
                        {l.subject.name}
                        {!l.mine && !isOfficer && <span className="chip chip-neutral" data-dot="false">Tutor view</span>}
                      </span>
                      <span className="ta-meta">
                        <span>Year {l.period.classId}</span>
                        <span>Room {l.period.room}</span>
                        {!l.mine && <span>{d.staff.find((s) => s.id === l.subject.teacherId)?.name}</span>}
                      </span>
                      <span className="ta-lesson-chips">
                        <Chip tone={st.tone}>{l.state === 'now' ? 'Now' : st.label}</Chip>
                        {reg ? (
                          reg.status === 'submitted' ? (
                            <Chip tone="success">Register submitted{reg.takenAt ? ` · ${formatTime(reg.takenAt)} ${initials(reg.takenBy)}` : ''}</Chip>
                          ) : (
                            <Chip tone={overdue || l.state === 'now' ? 'warning' : 'neutral'}>{overdue ? 'Register overdue' : l.state === 'now' ? 'Register open' : 'Register not taken'}</Chip>
                          )
                        ) : (
                          <Chip tone="neutral">No register</Chip>
                        )}
                      </span>
                    </div>
                    <div className="ta-lesson-action">
                      {reg ? (
                        <Link to={`/lessons/${reg.id}`} className={reg.status === 'submitted' ? 'btn btn-secondary btn-sm' : 'btn btn-sm'}>
                          {reg.status === 'submitted' ? 'View register' : 'Take register'}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="stack">
          <Card>
            <CardHeader icon={UserX} tone={absentCount ? 'danger' : 'warning'} title="Late and absent today" sub="From registers already submitted" />
            {flagged.size === 0 ? (
              <p className="muted small">No late or absent marks so far today.</p>
            ) : (
              <ul className="list">
                {[...flagged.entries()].map(([sid, marks]) => {
                  const s = d.students.find((x) => x.id === sid);
                  return (
                    <li key={sid} className="list-item">
                      <Avatar initials={s?.initials ?? '?'} />
                      <span className="grow">
                        <span className="list-title">{s?.name ?? sid}</span>
                        <br />
                        <span className="list-meta">{marks.map((m) => `${m.subject} ${m.start}`).join(' · ')}</span>
                      </span>
                      <Chip tone={MARK[marks.some((m) => m.mark === 'absent') ? 'absent' : 'late'].tone}>{marks.some((m) => m.mark === 'absent') ? 'Absent' : 'Late'}</Chip>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Callout tone="info" icon={BellRing} title="Families are told straight away">
            When you submit a register, families of students marked absent receive a notification immediately. Late and excused marks are recorded without a message.
          </Callout>
        </div>
      </div>

      <Card>
        <CardHeader
          icon={CalendarDays}
          title={`Weekly timetable · Year ${classId}`}
          sub={isOfficer ? 'All subjects' : visible.length === own.size ? 'Your lessons' : 'Your lessons, plus your tutor group’s other subjects (shaded)'}
        />
        {slots.length === 0 ? (
          <p className="muted small">No timetabled lessons for your subjects.</p>
        ) : (
          <div className="ta-week-wrap">
            <div className="ta-week" role="table" aria-label={`Weekly timetable for Year ${classId}`}>
              <div role="row" style={{ display: 'contents' }}>
                <span className="ta-week-head" role="columnheader">Time</span>
                {DAYS.map((day, i) => (
                  <span key={day} className="ta-week-head" role="columnheader" data-today={i + 1 === TODAY}>
                    {day}{i + 1 === TODAY ? ' · today' : ''}
                  </span>
                ))}
              </div>
              {slots.map((slot, si) => (
                <Fragment key={slot.start}>
                  {si > 0 && mins(slot.start) - mins(slots[si - 1].end) >= 20 && (
                    <div className="ta-week-break" role="row">
                      <span role="cell">Lunch · {slots[si - 1].end}–{slot.start}</span>
                    </div>
                  )}
                <div role="row" style={{ display: 'contents' }}>
                  <span className="ta-week-time" role="rowheader">
                    {slot.start}
                    <small>{slot.end}</small>
                  </span>
                  {DAYS.map((_, di) => {
                    const p = weekPeriods.find((x) => x.day === di + 1 && x.start === slot.start);
                    const subj = p && d.subjects.find((s) => s.id === p.subjectId);
                    if (!p || !subj) {
                      return (
                        <span key={di} className="ta-week-cell" data-empty="true" role="cell">
                          <small>Free</small>
                        </span>
                      );
                    }
                    return (
                      <span key={di} className="ta-week-cell" role="cell" data-mine={isOfficer || own.has(subj.id)} data-today={di + 1 === TODAY} style={{ ['--hue' as string]: subj.hue }}>
                        <strong>{subj.short}</strong>
                        <small>{p.room}</small>
                      </span>
                    );
                  })}
                </div>
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </Card>

      <PageFoot />
    </>
  );
}
