import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import {
  Award,
  Bell,
  BookOpen,
  BookOpenCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  FileQuestion,
  Library,
  MessagesSquare,
  PenLine,
  Table2,
  CalendarCheck,
  ChartColumn,
  Database,
  FileClock,
  GraduationCap,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tags,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, BottomSheet, Switch, cx, formatDate, formatTime, useGlider, useMotion, usePalette, useRouteDirection } from '@school-intel/ui';
import { STAFF_PALETTES } from './palettes';
import { chat, className, DEMO_DATE, family, resetData, setSession, staff, teach, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { setAnnotations, useAnnotations } from './ui';

interface NavItem {
  to: string;
  area: string;
  label: string;
  icon: LucideIcon;
  count?: (a: Actor) => number;
  alert?: boolean;
}

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/admin', area: 'admin', label: 'Administration', icon: ShieldCheck },
      { to: '/overview', area: 'overview', label: 'Overview', icon: LayoutDashboard },
      { to: '/chat', area: 'chat', label: 'Messages', icon: MessagesSquare, count: (a) => chat.unreadTotal(a), alert: true },
      { to: '/copilot', area: 'copilot', label: 'Teacher Copilot', icon: Sparkles, count: (a) => staff.drafts(a).filter((d) => ['draft', 'edited', 'missing-evidence'].includes(d.state)).length },
      { to: '/requests', area: 'requests', label: 'Family requests', icon: Inbox, count: (a) => staff.officeRequests(a).filter((r) => r.status === 'awaiting-approval').length, alert: true },
      { to: '/students', area: 'students', label: 'Students & families', icon: Users },
    ],
  },
  {
    label: 'Teaching',
    items: [
      { to: '/lessons', area: 'lessons', label: 'Lessons & registers', icon: CalendarClock, count: (a) => teach.teachingDay(a).filter((l) => l.mine && l.register?.status === 'open' && l.state !== 'later').length, alert: true },
      { to: '/materials', area: 'materials', label: 'Study materials', icon: Library },
      { to: '/questions', area: 'questions', label: 'Question bank', icon: FileQuestion, count: (a) => teach.questionBank(a).filter((q) => q.status === 'draft' && q.subject.teacherId === a.id).length },
      { to: '/assessments', area: 'assessments', label: 'Quizzes & tests', icon: BookOpenCheck },
      { to: '/marking', area: 'marking', label: 'Marking', icon: PenLine, count: (a) => teach.markingQueue(a).filter((m) => m.status === 'to-confirm').length },
      { to: '/doubts', area: 'doubts', label: 'Student questions', icon: MessagesSquare, count: (a) => teach.doubtsInbox(a).list.filter((d) => d.status === 'escalated').length, alert: true },
      { to: '/gradebook', area: 'gradebook', label: 'Gradebook', icon: Table2 },
    ],
  },
  {
    label: 'Care & records',
    items: [
      { to: '/support', area: 'support', label: 'Student support', icon: HeartHandshake, count: (a) => staff.supportCases(a).filter((c) => !['closed', 'dismissed'].includes(c.status)).length },
      { to: '/safeguarding', area: 'safeguarding', label: 'Safeguarding', icon: ShieldAlert, count: (a) => staff.concerns(a).filter((c) => c.status === 'received').length, alert: true },
      { to: '/discipline', area: 'discipline', label: 'Merits & discipline', icon: Award },
      { to: '/behaviour', area: 'behaviour', label: 'Incidents', icon: Tags },
      { to: '/attendance', area: 'attendance', label: 'Attendance', icon: CalendarCheck, count: (a) => staff.attendance(a).pending },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/homework', area: 'homework', label: 'Homework', icon: NotebookPen },
      { to: '/passport', area: 'passport', label: 'Learning passport', icon: GraduationCap },
      { to: '/exams', area: 'exams', label: 'Exams & resources', icon: BookOpen },
      { to: '/activities', area: 'activities', label: 'Activities', icon: Trophy },
    ],
  },
  {
    label: 'School',
    items: [
      { to: '/leadership', area: 'leadership', label: 'Leadership', icon: ChartColumn },
      { to: '/integrations', area: 'integrations', label: 'Integrations', icon: Database },
      { to: '/audit', area: 'audit', label: 'Audit log', icon: FileClock },
    ],
  },
];

const LABELS: Record<string, string> = Object.fromEntries(GROUPS.flatMap((g) => g.items.map((i) => [i.to.slice(1), i.label])));

/** The four areas shown in the bottom bar. People see the first four they are allowed to open. */
const TAB_PRIORITY = ['admin', 'overview', 'chat', 'lessons', 'marking', 'requests', 'support', 'attendance', 'students', 'leadership', 'integrations', 'audit'];
const ALL_ITEMS = GROUPS.flatMap((g) => g.items);
const TAB_LABEL: Record<string, string> = { admin: 'Admin', chat: 'Chat', overview: 'Home', lessons: 'Lessons', marking: 'Marking', requests: 'Requests', support: 'Support', attendance: 'Attendance', students: 'Students', leadership: 'Leaders', integrations: 'Systems', audit: 'Audit' };

type Sheet = 'more' | 'account' | 'notes' | 'search' | null;

export function Layout({ actor }: { actor: Actor }) {
  const db = useDb();
  const me = staff.me(actor);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<Sheet>(null);
  const ann = useAnnotations();
  const notes = family.notificationsFor(actor);
  const unread = notes.filter((n) => !n.read).length;
  const [, section = '', sub] = pathname.split('/');
  const [palette, setPalette] = usePalette('staff', STAFF_PALETTES);
  const deep = !!sub;

  const tabs = useMemo(
    () => TAB_PRIORITY.filter((a) => staff.canAccessArea(actor, a)).slice(0, 4).map((a) => ALL_ITEMS.find((i) => i.to === `/${a}`)!).filter(Boolean),
    [actor],
  );
  const inTabs = tabs.some((t) => t.to === `/${section}`);

  const dir = useRouteDirection(pathname, useNavigationType());
  const nav = useRef<HTMLElement>(null);
  useGlider(nav, '.hz-tab.is-active .hz-tab-icon', `${section}|${tabs.length}`);
  useMotion(pathname);

  useEffect(() => {
    setSheet(null);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const close = () => setSheet(null);
  const badge = (it: NavItem) => (it.count ? it.count(actor) : 0);
  const moreBadge = ALL_ITEMS.filter((i) => !tabs.includes(i) && staff.canAccessArea(actor, i.area)).reduce((n, i) => n + badge(i), 0);

  return (
    <div className="hz-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="hz-top">
        {deep ? (
          <button type="button" className="hz-round" aria-label="Back" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} aria-hidden />
          </button>
        ) : (
          <button type="button" className="hz-avatar" aria-label="Your account" onClick={() => setSheet('account')}>
            <Avatar initials={me.initials} />
          </button>
        )}
        <div className="hz-title">
          <small>{deep ? formatDate(`${DEMO_DATE}T12:00:00+04:00`, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Horizon Learning'}</small>
          <strong>{deep ? (LABELS[section] ?? 'Home') : me.name.split(' ')[0]}</strong>
        </div>
        <button type="button" className="hz-round" aria-label="Search students" onClick={() => setSheet('search')}>
          <Search size={20} aria-hidden />
        </button>
        <button type="button" className="hz-round" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => { setSheet('notes'); if (unread) family.markNotificationsRead(actor); }}>
          <Bell size={20} aria-hidden />
          {unread > 0 && <span className="hz-dot" aria-hidden />}
        </button>
      </header>

      <div className="hz-view">
        <main id="main" className="page" key={pathname} data-dir={dir} data-db={db.version}>
          <Outlet />
        </main>
      </div>

      <nav ref={nav} className="hz-tabs" aria-label="Primary">
        <span className="glider" aria-hidden />
        {tabs.map((t) => {
          const n = badge(t);
          return (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => cx('hz-tab', isActive && 'is-active')}>
              <span className="hz-tab-icon" aria-hidden>
                <t.icon size={21} />
                {n > 0 && <span className="hz-count" data-tone={t.alert ? 'alert' : undefined}>{n > 9 ? '9+' : n}</span>}
              </span>
              <span>{TAB_LABEL[t.to.slice(1)] ?? t.label}</span>
            </NavLink>
          );
        })}
        <button type="button" className={cx('hz-tab', !inTabs && section && 'is-active')} onClick={() => setSheet('more')} aria-haspopup="dialog">
          <span className="hz-tab-icon" aria-hidden>
            <LayoutGrid size={21} />
            {moreBadge > 0 && <span className="hz-count" data-tone="alert">{moreBadge > 9 ? '9+' : moreBadge}</span>}
          </span>
          <span>More</span>
        </button>
      </nav>

      <BottomSheet open={sheet === 'more'} onClose={close} title="All areas" tall>
        {GROUPS.map((g) => {
          const items = g.items.filter((i) => staff.canAccessArea(actor, i.area));
          if (!items.length) return null;
          return (
            <section className="hz-group" key={g.label} aria-label={g.label}>
              <h3>{g.label}</h3>
              <div className="hz-grid">
                {items.map((it, i) => {
                  const n = badge(it);
                  return (
                    <Link key={it.to} to={it.to} className="hz-tile" style={{ ['--i' as string]: i }} onClick={close}>
                      <span className="hz-tile-icon" aria-hidden>
                        <it.icon size={22} />
                        {n > 0 && <span className="hz-count" data-tone={it.alert ? 'alert' : undefined}>{n > 9 ? '9+' : n}</span>}
                      </span>
                      <span>{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </BottomSheet>

      <BottomSheet open={sheet === 'account'} onClose={close} title="Your account">
        <div className="hz-me">
          <Avatar initials={me.initials} />
          <div>
            <strong>{me.name}</strong>
            <small>{me.title}</small>
          </div>
        </div>
        <h3 className="hz-sub">Colour theme · {STAFF_PALETTES.find((p) => p.id === palette)?.name}</h3>
        <div className="palette-swatches" role="radiogroup" aria-label="Colour theme">
          {STAFF_PALETTES.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={palette === p.id} aria-label={`${p.name} (${p.kit})`} title={`${p.name} · ${p.kit}`} className="palette-swatch" style={{ ['--sw-a' as string]: p.swatch[0], ['--sw-b' as string]: p.swatch[1] }} onClick={() => setPalette(p.id)} />
          ))}
        </div>
        <Switch label="Show PRD references" hint="Phase and requirement IDs on each page" checked={ann} onChange={setAnnotations} />
        <div className="hz-actions">
          <button type="button" className="hz-action" onClick={() => { resetData(); close(); }}>
            <RotateCcw size={20} aria-hidden /> <span>Reload school data<small>Discards changes saved in this browser</small></span>
          </button>
          <button type="button" className="hz-action" onClick={() => setSession('staff', null)}>
            <Users size={20} aria-hidden /> <span>Switch account<small>Sign in as someone else</small></span>
          </button>
          <button type="button" className="hz-action hz-danger" onClick={() => setSession('staff', null)}>
            <LogOut size={20} aria-hidden /> <span>Sign out</span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'notes'} onClose={close} title="Notifications">
        {notes.length === 0 && <p className="muted">Nothing new.</p>}
        <ul className="hz-notes" role="list">
          {notes.slice(0, 12).map((n) => (
            <li key={n.id}>
              <Link to={n.link ?? '/overview'} onClick={close}>
                <span className="hz-tile-icon" aria-hidden><Bell size={18} /></span>
                <span>
                  <strong>{n.title}</strong>
                  <small>{n.body}</small>
                  <small>{formatDate(n.at)}, {formatTime(n.at)}</small>
                </span>
                <ChevronRight size={18} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </BottomSheet>

      <BottomSheet open={sheet === 'search'} onClose={close} title="Find a student" tall>
        <StudentSearch actor={actor} onGo={(id) => { close(); navigate(`/students/${id}`); }} />
      </BottomSheet>
    </div>
  );
}

function StudentSearch({ actor, onGo }: { actor: Actor; onGo: (id: string) => void }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return staff.studentDirectory(actor).filter((s) => s.name.toLowerCase().includes(t) || s.classId.toLowerCase() === t || s.sisId.toLowerCase().includes(t) || className(s.classId).toLowerCase().includes(t)).slice(0, 20);
  }, [q, actor]);

  return (
    <div className="hz-search" role="search">
      <label className="hz-field">
        <Search size={18} aria-hidden />
        <span className="sr-only">Search students</span>
        <input data-autofocus type="search" enterKeyHint="search" placeholder="Name, class or student number" value={q} autoComplete="off" onChange={(e) => setQ(e.target.value)} />
      </label>
      {!q && <p className="muted small">Search is limited to students you are allowed to see.</p>}
      {q && results.length === 0 && <p className="muted">No students match within your access.</p>}
      <ul role="list" className="hz-results">
        {results.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => onGo(s.id)}>
              <Avatar initials={s.initials} />
              <span>
                <strong>{s.name}</strong>
                <small>{className(s.classId)} · {s.sisId}</small>
              </span>
              <ChevronRight size={18} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
