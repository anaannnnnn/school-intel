import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff } from 'lucide-react';
import { Card, EmptyState, formatDate, formatTime } from '@school-intel/ui';
import { family, useDb } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';

export function Notifications() {
  const { actor } = useFamily();
  useDb();
  const list = family.notificationsFor(actor);
  const unreadIds = list.filter((n) => !n.read).map((n) => n.id).join();
  useEffect(() => {
    if (unreadIds) {
      const t = setTimeout(() => family.markNotificationsRead(actor), 1200);
      return () => clearTimeout(t);
    }
  }, [unreadIds, actor]);
  return (
    <>
      <PageHeader back eyebrow="Updates" title="Notifications" />
      {list.length === 0 ? (
        <Card><EmptyState icon={BellOff} title="You’re all caught up" /></Card>
      ) : (
        <Card className="card-flush">
          <ul className="menu">
            {list.map((n) => (
              <li key={n.id}>
                <Link to={n.link ?? '/today'} style={{ alignItems: 'flex-start', paddingBlock: 14 }}>
                  <span className="card-icon" data-tone={n.read ? 'neutral' : undefined} aria-hidden><Bell size={16} /></span>
                  <span className="grow">
                    <span style={{ fontWeight: n.read ? 500 : 700 }}>{n.title}</span>
                    <small>{n.body}</small>
                    <small>{formatDate(n.at)}, {formatTime(n.at)}</small>
                  </span>
                  {!n.read && <span className="badge-dot" style={{ position: 'static', marginBlockStart: 6 }} aria-label="Unread" />}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
