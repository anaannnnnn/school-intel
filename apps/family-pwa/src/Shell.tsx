import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChartNoAxesColumn, ChevronLeft, House, Inbox, LayoutGrid, Library, MessageCircleQuestion, MessageSquareText, PenLine, UserRound, type LucideIcon } from 'lucide-react';
import { Avatar, cx } from '@school-intel/ui';
import { className, family, useDb } from '@school-intel/api';
import { useFamily } from './family-context';
import { greeting } from './screens/ParentToday';

const PARENT_TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/today', label: 'Today', icon: House },
  { to: '/progress', label: 'Progress', icon: ChartNoAxesColumn },
  { to: '/ask', label: 'Ask', icon: MessageSquareText },
  { to: '/requests', label: 'Requests', icon: Inbox },
  { to: '/more', label: 'More', icon: LayoutGrid },
];

const STUDENT_TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/today', label: 'Today', icon: House },
  { to: '/learn', label: 'Learn', icon: Library },
  { to: '/ask', label: 'Ask', icon: MessageCircleQuestion },
  { to: '/tests', label: 'Tests', icon: PenLine },
  { to: '/me', label: 'Me', icon: UserRound },
];

export function Shell() {
  const { actor, isParent, name, firstName } = useFamily();
  useDb();
  const unread = family.notificationsFor(actor).filter((n) => !n.read).length;
  const { pathname } = useLocation();
  const tabs = isParent ? PARENT_TABS : STUDENT_TABS;
  // Full-screen flows (test player) hide the tab bar so students are not pulled away mid-test.
  const focus = /^\/tests\/play\//.test(pathname);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="app" data-focus={focus || undefined}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <Link to={isParent ? '/more' : '/me'} className="who" aria-label="Your account">
          <Avatar initials={name.split(' ').map((p) => p[0]).join('')} />
          <span style={{ minWidth: 0 }}>
            <small>{greeting()}</small>
            <strong>{firstName}</strong>
          </span>
        </Link>
        <Link to="/notifications" className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <Bell size={20} aria-hidden />
          {unread > 0 && <span className="badge-dot" aria-hidden />}
        </Link>
      </header>
      <main id="main" className="content" key={pathname}>
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Primary" hidden={focus}>
        <div className="rail-brand" aria-hidden>
          <span className="rail-mark"><i /><i /><i /></span>
          <span className="rail-name"><strong>Horizon Learning</strong><small>School Intelligence</small></span>
        </div>
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
          <strong>{child.firstName}</strong> · {className(child.classId)}
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
            <small>{className(c.classId)}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
