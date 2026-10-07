import { Award, BookOpen, CalendarCheck, CalendarClock, CalendarDays, GraduationCap } from 'lucide-react';
import { Card, Chip, EmptyState, formatDate, type Tone } from '@school-intel/ui';
import { learn, useDb } from '@school-intel/api';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { PRow, SectionTitle, SubjectTile, daysLabel, scoreTone } from '../kit';
import { NoChildren } from './NoChildren';
import '../student-c2.css';

function readiness(pct: number | undefined): { label: string; tone: Tone } {
  if (pct === undefined) return { label: 'Not started', tone: 'neutral' };
  if (pct >= 80) return { label: 'Well prepared', tone: 'success' };
  if (pct >= 60) return { label: 'On track', tone: 'info' };
  return { label: 'Getting ready', tone: 'warning' };
}

export function Progress() {
  const { actor, isParent, child } = useFamily();
  useDb();
  if (!child) return <NoChildren />;

  const grades = learn.gradesFor(actor, child.id);
  const att = learn.attendanceFor(actor, child.id);
  const beh = learn.behaviourFor(actor, child.id);
  const plan = learn.examPlan(actor, child.id);
  const averages = grades.map((g) => g.average).filter((x): x is number => x !== undefined);
  const average = averages.length ? Math.round(averages.reduce((n, x) => n + x, 0) / averages.length) : undefined;
  const recent = grades
    .flatMap((g) => g.results.map((r) => ({ ...r, subject: g.subject })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  const who = isParent ? child.firstName : 'You';

  const headline =
    average === undefined
      ? att.rate >= 95
        ? 'Great attendance so far'
        : 'A steady start to term'
      : average >= 75
        ? 'Doing really well this term'
        : average >= 55
          ? 'Making steady progress'
          : 'Building confidence this term';

  return (
    <>
      <PageHeader eyebrow={isParent ? 'Progress' : 'Your progress'} title={isParent ? `${child.firstName}’s progress` : 'My progress'} />
      {isParent && <ChildSwitcher />}

      <section className="hero-card" aria-label="Summary">
        <span className="eyebrow">{child.firstName} · Year {child.classId} · Term 1</span>
        <h2>{headline}</h2>
        <div className="hero-stats">
          <div><strong>{average !== undefined ? `${average}%` : '–'}</strong><small>Average score</small></div>
          <div><strong>{Math.round(att.rate)}%</strong><small>Attendance</small></div>
          <div><strong>{beh.merits}</strong><small>Merits</small></div>
        </div>
        {average === undefined && <p className="small">Scores appear once teachers release marked work.</p>}
      </section>

      <SectionTitle>Upcoming exams</SectionTitle>
      {plan.exams.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarClock} title="No exams scheduled">
            Exam dates appear here as soon as {isParent ? `${child.firstName}’s` : 'your'} teachers publish them.
          </EmptyState>
        </Card>
      ) : (
        <div className="rows">
          {plan.exams.slice(0, 3).map((e) => {
            const r = readiness(e.readiness);
            return (
              <PRow
                key={e.id}
                to={isParent ? undefined : '/tests?tab=plan'}
                tile={<SubjectTile subjectId={e.subject.id} hue={e.subject.hue} />}
                title={e.title}
                sub={`${formatDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${daysLabel(e.days)}${e.planTotal ? ` · ${e.planDone}/${e.planTotal} revision tasks` : ''}`}
                end={<Chip tone={r.tone}>{r.label}</Chip>}
              />
            );
          })}
        </div>
      )}
      {plan.exams.length > 0 && (
        <p className="small muted">Readiness is based on practice quiz results for each exam topic. {isParent ? `${child.firstName} has` : 'You have'} a revision plan with the weakest topics first.</p>
      )}

      <SectionTitle>Recent results</SectionTitle>
      {recent.length === 0 ? (
        <Card>
          <p className="muted small">No released results yet. {who === 'You' ? 'Your' : `${who}’s`} marks appear here once teachers release them.</p>
        </Card>
      ) : (
        <div className="rows">
          {recent.map((r) => (
            <PRow
              key={r.id}
              to={r.kind !== 'written' ? `/tests/result/${r.id}` : undefined}
              tile={<SubjectTile subjectId={r.subject.id} hue={r.subject.hue} />}
              title={r.title}
              sub={`${r.subject.name} · ${formatDate(r.date)} · ${r.got}/${r.max} marks`}
              end={<Chip tone={scoreTone(r.pct)}>{r.pct}%</Chip>}
            />
          ))}
        </div>
      )}

      <SectionTitle>Records</SectionTitle>
      <div className="rows">
        <PRow
          to="/attendance"
          icon={CalendarCheck}
          tone="success"
          title="Attendance"
          sub={`${att.absent + att.excused} ${att.absent + att.excused === 1 ? 'day' : 'days'} missed · ${att.late} late`}
          end={<span className="prow-value">{att.rate}%</span>}
        />
        <PRow to="/behaviour" icon={Award} tone="pink" title="Merits & behaviour" sub={beh.points.length ? `${beh.merits} merit points${beh.demerits ? ` · ${beh.demerits} notes` : ''}` : 'Nothing recorded yet'} />
        <PRow to="/grades" icon={GraduationCap} title="Subject grades" sub={averages.length ? `${averages.length} ${averages.length === 1 ? 'subject' : 'subjects'} with released results` : 'No released results yet'} />
        <PRow to="/learning" icon={BookOpen} tone="info" title="Learning passport" sub="Teacher-approved strengths and next steps" />
        <PRow to="/timetable" icon={CalendarDays} tone="warning" title="Timetable" sub="Lessons, rooms and teachers" />
      </div>
    </>
  );
}
