import { useSyncExternalStore, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Card, EmptyState, PhaseTag, type Tone } from '@school-intel/ui';

// ---------- PRD reference annotations (off by default) ----------

const KEY = 'school-intel:staff:annotations';
const subs = new Set<() => void>();
const readAnn = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
export function setAnnotations(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  subs.forEach((s) => s());
}
export function useAnnotations() {
  return useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), readAnn, readAnn);
}

// ---------- Page scaffolding ----------

export function PageHead({ title, sub, spec, actions }: { title: ReactNode; sub?: ReactNode; spec?: string; actions?: ReactNode }) {
  const ann = useAnnotations();
  return (
    <div className="page-head">
      <div>
        {ann && spec && <PhaseTag>{spec}</PhaseTag>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Stat({ value, label, foot, tone, to }: { value: ReactNode; label: string; foot?: ReactNode; tone?: Tone; to?: string }) {
  const body = (
    <>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {foot && <span className="stat-foot">{foot}</span>}
    </>
  );
  return to ? (
    <Link to={to} className="stat" data-tone={tone}>{body}</Link>
  ) : (
    <div className="stat" data-tone={tone}>{body}</div>
  );
}

export function PageFoot({ updated }: { updated?: string }) {
  return <p className="page-foot">Source records remain authoritative · Demo content is fictional{updated ? ` · Updated ${updated}` : ''}</p>;
}

export function Restricted({ message }: { message?: string }) {
  return (
    <Card>
        <EmptyState icon={ShieldAlert} title="This record is restricted" action={<Link to="/overview" className="btn btn-secondary">Return to workspace</Link>}>
          <p>{message ?? 'Your current role cannot view this area.'}</p>
          <p style={{ marginBlockStart: 8 }}>No student name, allegation or attachment is shown. Contact your school administrator if your assignment has changed. This attempt has been recorded in the audit log.</p>
        </EmptyState>
    </Card>
  );
}

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  width?: string;
  align?: 'end';
}

export function DataTable<T>({ rows, columns, onRow, empty, caption }: { rows: T[]; columns: Column<T>[]; onRow?: (row: T) => void; empty?: ReactNode; caption: string }) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align === 'end' ? 'end' : undefined }} scope="col">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              data-clickable={!!onRow}
              onClick={onRow ? () => onRow(r) : undefined}
              onKeyDown={onRow ? (e) => e.key === 'Enter' && onRow(r) : undefined}
              tabIndex={onRow ? 0 : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align === 'end' ? 'end' : undefined }}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
