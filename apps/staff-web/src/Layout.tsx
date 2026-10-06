import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ChartColumn,
  ClipboardList,
  Database,
  FileClock,
  GraduationCap,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Tags,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, Switch, cx, formatDate, formatTime } from '@school-intel/ui';
import { family, resetDemo, SCHOOL, setSession, staff, useDb } from '@school-intel/api';
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
      { to: '/overview', area: 'overview', label: 'Overview', icon: LayoutDashboard },
      { to: '/copilot', area: 'copilot', label: 'Teacher Copilot', icon: Sparkles, count: (a) => staff.drafts(a).filter((d) => ['draft', 'edited', 'missing-evidence'].includes(d.state)).length },
      { to: '/requests', area: 'requests', label: 'Family requests', icon: Inbox, count: (a) => staff.officeRequests(a).filter((r) => r.status === 'awaiting-approval').length, alert: true },
      { to: '/students', area: 'students', label: 'Students & families', icon: Users },
    ],
  },
  {
    label: 'Care',
    items: [
      { to: '/support', area: 'support', label: 'Student support', icon: HeartHandshake, count: (a) => staff.supportCases(a).filter((c) => !['closed', 'dismissed'].includes(c.status)).length },
      { to: '/safeguarding', area: 'safeguarding', label: 'Safeguarding', icon: ShieldAlert, count: (a) => staff.concerns(a).filter((c) => c.status === 'received').length, alert: true },
      { to: '/behaviour', area: 'behaviour', label: 'Behaviour', icon: Tags },
      { to: '/attendance', area: 'attendance', label: 'Attendance', icon: CalendarCheck, count: (a) => staff.attendance(a).pending },
    ],
  },
  {
    label: 'Learning',
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

export function Layout({ actor }: { actor: Actor }) {
  const db = useDb();
  const me = staff.me(actor);
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [open, setOpen] = useState<'bell' | 'user' | null>(null);
  const ann = useAnnotations();
  const navigate = useNavigate();
  const notes = family.notificationsFor(actor);
  const unread = notes.filter((n) => !n.read).length;
  const section = pathname.split('/')[1];

  useEffect(() => {
    setDrawer(false);
    setOpen(null);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === 'Escape' && (setOpen(null), setDrawer(false));
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return (
    <div className="layout" data-drawer={drawer ? 'open' : undefined}>
      <a className="skip-link" href="#main">Skip to content</a>
      <aside className="sidebar" aria-label="Workspace navigation">
        <Link to="/overview" className="side-brand">
          <strong>DEVX</strong>
          <span>School Intelligence</span>
        </Link>
        <div className="side-school">{SCHOOL.shortName}</div>
        <nav>
          {GROUPS.map((g) => {
            const items = g.items.filter((i) => staff.canAccessArea(actor, i.area));
            if (!items.length) return null;
            return (
              <div className="side-group" key={g.label}>
                <div className="side-label">{g.label}</div>
                {items.map(({ to, label, icon: Icon, count, alert }) => {
                  const n = count ? count(actor) : 0;
                  return (
                    <NavLink key={to} to={to} className={({ isActive }) => cx('side-link', isActive && 'is-active')}>
                      <Icon size={17} aria-hidden />
                      {label}
                      {n > 0 && <span className="side-count" data-tone={alert ? 'alert' : undefined} aria-label={`${n} need attention`}>{n}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="side-foot">
          <Avatar initials={me.initials} />
          <div className="grow" style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{me.name}</div>
            <small style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.title}</small>
          </div>
        </div>
      </aside>
      <div className="drawer-scrim" onClick={() => setDrawer(false)} aria-hidden />

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" aria-label="Open navigation" onClick={() => setDrawer(true)}>
            <Menu size={20} aria-hidden />
          </button>
          <nav className="crumbs" aria-label="Breadcrumb">
            <span>{SCHOOL.name}</span>
            <span className="sep" aria-hidden>/</span>
            <Link to={`/${section}`}><strong>{LABELS[section] ?? 'Staff workspace'}</strong></Link>
          </nav>
          <StudentSearch actor={actor} onGo={(id) => navigate(`/students/${id}`)} />
          <div className="top-actions">
            <div style={{ position: 'relative' }}>
              <button type="button" className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open === 'bell'} onClick={() => { setOpen(open === 'bell' ? null : 'bell'); if (unread) family.markNotificationsRead(actor); }}>
                <Bell size={20} aria-hidden />
                {unread > 0 && <span className="badge-dot" aria-hidden />}
              </button>
              {open === 'bell' && (
                <div className="popover" role="dialog" aria-label="Notifications">
                  <div className="popover-head">Notifications</div>
                  {notes.length === 0 && <p className="small muted" style={{ padding: 10 }}>Nothing new.</p>}
                  {notes.slice(0, 8).map((n) => (
                    <Link key={n.id} to={n.link ?? '/overview'} className="popover-item">
                      <span className="card-icon" style={{ width: 30, height: 30 }} aria-hidden><Bell size={14} /></span>
                      <span>
                        <span style={{ fontWeight: 600 }}>{n.title}</span>
                        <small>{n.body}</small>
                        <small>{formatDate(n.at)}, {formatTime(n.at)}</small>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <button type="button" className="icon-btn" aria-label="Account menu" aria-expanded={open === 'user'} onClick={() => setOpen(open === 'user' ? null : 'user')}>
                <Avatar initials={me.initials} />
              </button>
              {open === 'user' && (
                <div className="popover" role="dialog" aria-label="Account" style={{ width: 300 }}>
                  <div className="popover-head">{me.name} · {me.roles.join(', ')}</div>
                  <div style={{ padding: '0 10px' }}>
                    <Switch label="Show PRD references" hint="Phase and requirement IDs on each page" checked={ann} onChange={setAnnotations} />
                  </div>
                  <button type="button" className="popover-item" onClick={() => setSession('staff', null)}>
                    <Users size={16} aria-hidden /> <span>Switch staff member<small>Sign in as another demo role</small></span>
                  </button>
                  <button type="button" className="popover-item" onClick={() => { resetDemo(); setOpen(null); }}>
                    <RotateCcw size={16} aria-hidden /> <span>Reset demo data<small>Restores the 6 October scenario</small></span>
                  </button>
                  <button type="button" className="popover-item" onClick={() => setSession('staff', null)}>
                    <LogOut size={16} aria-hidden /> <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        {open && <div style={{ position: 'fixed', inset: 0, zIndex: 15 }} onClick={() => setOpen(null)} aria-hidden />}
        <main id="main" className="page" key={pathname} data-db={db.version}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function StudentSearch({ actor, onGo }: { actor: Actor; onGo: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return staff.studentDirectory(actor).filter((s) => s.name.toLowerCase().includes(t) || s.classId.toLowerCase() === t || s.sisId.toLowerCase().includes(t)).slice(0, 6);
  }, [q, actor]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const go = (id: string) => {
    setQ('');
    ref.current?.blur();
    onGo(id);
  };

  return (
    <div className="search" role="search">
      <Search size={16} aria-hidden />
      <label htmlFor="global-search" className="sr-only">Search students</label>
      <input
        ref={ref}
        id="global-search"
        className="input"
        placeholder="Search students you can access…"
        value={q}
        autoComplete="off"
        onChange={(e) => { setQ(e.target.value); setActive(0); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, results.length - 1));
          if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
          if (e.key === 'Enter' && results[active]) go(results[active].id);
          if (e.key === 'Escape') setQ('');
        }}
      />
      {q && (
        <div className="search-results">
          {results.length === 0 && <p className="small muted" style={{ padding: 8 }}>No students match within your access.</p>}
          {results.map((s, i) => (
            <a key={s.id} href={`#/students/${s.id}`} data-active={i === active} onClick={(e) => { e.preventDefault(); go(s.id); }}>
              <Avatar initials={s.initials} />
              <span className="grow">{s.name}<span className="small muted"> · Year {s.classId}</span></span>
              <ClipboardList size={14} className="muted" aria-hidden />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
