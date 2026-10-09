import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Avatar, Chip } from '@school-intel/ui';
import { className, family, SCHOOL, useDb } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { NoChildren } from './NoChildren';

export function Children() {
  const { actor, children, setChildId } = useFamily();
  const navigate = useNavigate();
  useDb();
  return (
    <>
      <PageHeader back="/more" eyebrow="Verified guardian" title="Your children" />
      {children.length === 0 && <NoChildren />}
      {children.map((c) => {
        const items = family.feed(actor, c.id).items;
        const hw = items.filter((i) => i.kind === 'homework');
        const act = items.filter((i) => i.kind === 'activity');
        return (
          <button
            key={c.id}
            type="button"
            className="card"
            onClick={() => {
              setChildId(c.id);
              navigate('/today');
            }}
          >
            <div className="row" style={{ gap: 12, marginBlockEnd: 12 }}>
              <Avatar initials={c.initials} size="lg" />
              <div className="grow">
                <strong style={{ fontSize: 'var(--text-lg)' }}>{c.name}</strong>
                <div className="small muted">{className(c.classId)} · {SCHOOL.shortName}</div>
              </div>
              <ArrowRight size={18} className="flip-rtl" aria-hidden />
            </div>
            <div className="stack-sm small">
              <span>Homework: {hw.length} {hw.length === 1 ? 'task' : 'tasks'} · {hw.reduce((s, i) => s + (i.minutes ?? 0), 0)} min</span>
              <span className="muted">Today: {act.length ? act.map((a) => a.title).join(', ') : 'No after-school activity'}</span>
            </div>
          </button>
        );
      })}
      <div className="row small muted" style={{ justifyContent: 'center' }}>
        <ShieldCheck size={14} aria-hidden /> Relationships are verified from school records. <Chip tone="success" dot={false}>SIS</Chip>
      </div>
    </>
  );
}
