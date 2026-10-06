import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, ChevronLeft, ClipboardList, House, Inbox, LayoutGrid, LifeBuoy, MessageSquareText, type LucideIcon } from 'lucide-react';
import { Avatar, cx } from '@school-intel/ui';
import { family, SCHOOL, useDb } from '@school-intel/api';
import { useFamily } from './family-context';

const PARENT_TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/today', label: 'Today', icon: House },
  { to: '/learning', label: 'Learning', icon: BookOpen },
  { to: '/ask', label: 'Ask', icon: MessageSquareText },
  { to: '/requests', label: 'Requests', icon: Inbox },
  { to: '/more', label: 'More', icon: LayoutGrid },
];

const STUDENT_TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/today', label: 'Today', icon: House },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/learning', label: 'Learning', icon: BookOpen },
  { to: '/help', label: 'Help', icon: LifeBuoy },
];

export function Shell() {
  const { actor, isParent, name } = useFamily();
  useDb();
  const unread = family.notificationsFor(actor).filter((n) => !n.read).length;
  const { pathname } = useLocation();
  const tabs = isParent ? PARENT_TABS : STUDENT_TABS;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <Link to="/today" className="wordmark" aria-label="School Intelligence home">
          <span className="wordmark-mark" aria-hidden>DEVX</span>
          <span className="wordmark-text">
            <span>School Intelligence</span>
            <small>{SCHOOL.name}</small>
          </span>
        </Link>
        <div className="row">
          <Link to="/notifications" className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
            <Bell size={20} aria-hidden />
            {unread > 0 && <span className="badge-dot" aria-hidden />}
          </Link>
          <Link to={isParent ? '/more' : '/settings'} className="icon-btn" aria-label="Account and settings">
            <Avatar initials={name.split(' ').map((p) => p[0]).join('')} />
          </Link>
        </div>
      </header>
      <main id="main" className="content" key={pathname}>
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Primary">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cx('tab', isActive && 'is-active')}>
            <span className="tab-icon" aria-hidden>
              <Icon size={20} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, back, action }: { eyebrow?: ReactNode; title: ReactNode; back?: string | true; action?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="page-header">
      {back && (
        <button type="button" className="back" onClick={() => (back === true ? navigate(-1) : navigate(back))}>
          <ChevronLeft size={18} aria-hidden className="flip-rtl" /> Back
        </button>
      )}
      <div className="row-between" style={{ alignItems: 'flex-end' }}>
        <div className="stack-sm" style={{ gap: 2 }}>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="page-title">{title}</h1>
        </div>
        {action}
      </div>
    </div>
  );
}

export function ChildSwitcher() {
  const { children, child, setChildId, isParent } = useFamily();
  if (!isParent || children.length < 2) {
    return child ? (
      <div className="context-pill">
        <Avatar initials={child.initials} />
        <span>
          <strong>{child.firstName}</strong> · Year {child.classId}
        </span>
      </div>
    ) : null;
  }
  return (
    <div className="child-switcher" role="tablist" aria-label="Choose a child">
      {children.map((c) => (
        <button key={c.id} type="button" role="tab" aria-selected={c.id === child?.id} onClick={() => setChildId(c.id)}>
          <Avatar initials={c.initials} />
          <span>
            <strong>{c.firstName}</strong>
            <small>Year {c.classId}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
