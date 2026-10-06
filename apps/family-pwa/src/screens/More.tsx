import { Link } from 'react-router-dom';
import { Bell, Bus, ChevronRight, ClipboardList, LogOut, Phone, Settings, Trophy, Users } from 'lucide-react';
import { Avatar, Card } from '@school-intel/ui';
import { SCHOOL, setSession } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';

export function More() {
  const { name, isParent, children } = useFamily();
  const items = [
    ...(isParent ? [{ to: '/children', icon: Users, label: 'Your children', hint: children.map((c) => c.firstName).join(' and ') || 'No linked children' }] : []),
    { to: '/tasks', icon: ClipboardList, label: 'Assignments', hint: 'Due dates and submission receipts' },
    ...(isParent ? [{ to: '/activities', icon: Trophy, label: 'Clubs and activities', hint: 'Bookings, consent and waiting lists' }] : []),
    ...(isParent ? [{ to: '/bus', icon: Bus, label: 'Bus journey', hint: 'Assigned route status' }] : []),
    { to: '/notifications', icon: Bell, label: 'Notifications', hint: 'Recent updates' },
    { to: '/settings', icon: Settings, label: 'Settings', hint: 'Language, quiet hours and alerts' },
  ];
  return (
    <>
      <PageHeader eyebrow={SCHOOL.name} title="More" />
      <Card>
        <div className="row" style={{ gap: 12 }}>
          <Avatar initials={name.split(' ').map((p) => p[0]).join('')} size="lg" />
          <div className="grow">
            <strong style={{ fontSize: 'var(--text-lg)' }}>{name}</strong>
            <div className="small muted">{isParent ? 'Verified guardian' : 'Student'}</div>
          </div>
        </div>
      </Card>
      <Card className="card-flush">
        <ul className="menu">
          {items.map(({ to, icon: Icon, label, hint }) => (
            <li key={to}>
              <Link to={to}>
                <span className="card-icon" aria-hidden><Icon size={18} /></span>
                <span className="grow">{label}<small>{hint}</small></span>
                <ChevronRight size={18} className="muted flip-rtl" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="card-flush">
        <ul className="menu">
          <li>
            <a href="tel:+97140000000">
              <span className="card-icon" data-tone="neutral" aria-hidden><Phone size={18} /></span>
              <span className="grow">Call the school office<small>Sun–Thu, 07:00–15:30</small></span>
            </a>
          </li>
          <li>
            <button type="button" onClick={() => setSession('family', null)}>
              <span className="card-icon" data-tone="danger" aria-hidden><LogOut size={18} /></span>
              <span className="grow">Sign out</span>
            </button>
          </li>
        </ul>
      </Card>
    </>
  );
}
