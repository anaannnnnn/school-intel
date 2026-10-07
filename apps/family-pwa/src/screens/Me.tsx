import { Link } from 'react-router-dom';
import { Award, Bell, BookMarked, CalendarCheck, CalendarDays, ChevronRight, ClipboardList, GraduationCap, LifeBuoy, LogOut, Settings, type LucideIcon } from 'lucide-react';
import { Avatar, Card } from '@school-intel/ui';
import { SCHOOL, learn, setSession, useDb } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import '../student-c1.css';

interface Item {
  to: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
}

function MenuCard({ items, label }: { items: Item[]; label: string }) {
  return (
    <Card className="card-flush">
      <ul className="menu c1-menu" aria-label={label}>
        {items.map(({ to, icon: Icon, label: l, hint, tone }) => (
          <li key={to}>
            <Link to={to}>
              <span className="card-icon" data-tone={tone} aria-hidden><Icon size={18} /></span>
              <span className="grow">{l}<small>{hint}</small></span>
              <ChevronRight size={18} className="muted flip-rtl" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function Me() {
  const { actor, child, name } = useFamily();
  useDb();
  if (!child) return null;

  const attendance = learn.attendanceFor(actor, child.id);
  const behaviour = learn.behaviourFor(actor, child.id);
  const grades = learn.gradesFor(actor, child.id).filter((g) => g.average !== undefined);
  const average = grades.length ? Math.round(grades.reduce((n, g) => n + g.average!, 0) / grades.length) : undefined;
  const lessonsToday = learn.timetableFor(actor, child.id).length;

  const school: Item[] = [
    { to: '/timetable', icon: CalendarDays, label: 'Timetable', hint: lessonsToday ? `${lessonsToday} lessons today` : 'Your week of lessons' },
    { to: '/grades', icon: GraduationCap, label: 'Grades', hint: 'Quiz, test and written results', tone: 'success' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance', hint: `${attendance.rate}% this term`, tone: 'info' },
    { to: '/behaviour', icon: Award, label: 'Merits & behaviour', hint: `${behaviour.merits} merit point${behaviour.merits === 1 ? '' : 's'}`, tone: 'warning' },
    { to: '/learning', icon: BookMarked, label: 'Learning passport', hint: 'Strengths and next steps' },
    { to: '/tasks', icon: ClipboardList, label: 'Assignments', hint: 'Due dates and submission receipts' },
  ];
  const app: Item[] = [
    { to: '/help', icon: LifeBuoy, label: 'Help & support', hint: 'Talk to a trusted adult', tone: 'danger' },
    { to: '/notifications', icon: Bell, label: 'Notifications', hint: 'Recent updates' },
    { to: '/settings', icon: Settings, label: 'Settings', hint: 'Language, theme and alerts' },
  ];

  return (
    <>
      <PageHeader eyebrow={SCHOOL.name} title="Me" />

      <Card>
        <div className="c1-profile">
          <Avatar initials={child.initials} size="lg" />
          <div className="grow" style={{ minWidth: 0 }}>
            <strong>{name}</strong>
            <div className="small muted">Year {child.classId} · Student</div>
            <div className="small muted">{SCHOOL.name} · {child.sisId}</div>
          </div>
        </div>
      </Card>

      <div className="stat-row">
        <Link to="/attendance" className="mini-stat" aria-label={`Attendance ${attendance.rate}%. Open attendance`}>
          <span className="c1-stat-icon" data-tone="success" aria-hidden><CalendarCheck size={16} /></span>
          <strong>{Math.round(attendance.rate)}%</strong>
          <small>Attendance</small>
        </Link>
        <Link to="/behaviour" className="mini-stat" aria-label={`${behaviour.merits} merits. Open merits and behaviour`}>
          <span className="c1-stat-icon" data-tone="warning" aria-hidden><Award size={16} /></span>
          <strong>{behaviour.merits}</strong>
          <small>Merits</small>
        </Link>
        <Link to="/grades" className="mini-stat" aria-label={`Average grade ${average !== undefined ? `${average}%` : 'not available yet'}. Open grades`}>
          <span className="c1-stat-icon" aria-hidden><GraduationCap size={16} /></span>
          <strong>{average !== undefined ? `${average}%` : '–'}</strong>
          <small>Avg. grade</small>
        </Link>
      </div>

      <MenuCard items={school} label="School records" />
      <MenuCard items={app} label="Help and settings" />

      <Card className="card-flush">
        <ul className="menu">
          <li>
            <button type="button" onClick={() => setSession('family', null)}>
              <span className="card-icon" data-tone="danger" aria-hidden><LogOut size={18} /></span>
              <span className="grow">Sign out</span>
            </button>
          </li>
        </ul>
      </Card>

      <p className="small muted" style={{ textAlign: 'center' }}>School records remain the official source · Fictional demonstration data</p>
    </>
  );
}
