import { useSyncExternalStore, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldAlert, Sparkles, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { Card, EmptyState, PhaseTag, cx, type Tone } from '@school-intel/ui';

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

/** Ledger Card/Stat: label with icon tile, mono value, optional change badge and mini bars. */
export function Stat({ value, label, foot, tone, to, icon: Icon, spark, delta }: { value: ReactNode; label: string; foot?: ReactNode; tone?: Tone | 'success'; to?: string; icon?: LucideIcon; spark?: number[]; delta?: { value: string; down?: boolean } }) {
  const max = spark ? Math.max(...spark, 1) : 1;
  const body = (
    <>
      <span className="stat-top">
        <span className="stat-label">{label}</span>
        {Icon && <span className="card-icon" data-tone={tone === 'success' ? undefined : tone} aria-hidden><Icon size={16} /></span>}
      </span>
      <span className="stat-row">
        <span className="stat-value">{value}</span>
        {spark && (
          <span className="spark" aria-hidden>
            {spark.map((v, i) => <i key={i} style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />)}
          </span>
        )}
      </span>
      {(foot || delta) && (
        <span className="stat-foot">
          {delta && <span className="delta" data-tone={delta.down ? 'down' : undefined}>{delta.down ? <TrendingDown size={11} /> : <TrendingUp size={11} />}{delta.value}</span>}
          {foot}
        </span>
      )}
    </>
  );
  return to ? (
    <Link to={to} className="stat" data-tone={tone}>{body}</Link>
  ) : (
    <div className="stat" data-tone={tone}>{body}</div>
  );
}

export function PageFoot({ updated }: { updated?: string }) {
  return <p className="page-foot">Source records remain authoritative{updated ? ` · Updated ${updated}` : ''}</p>;
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
                <td key={c.key} data-label={c.label} style={{ textAlign: c.align === 'end' ? 'end' : undefined }}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Ledger kit pieces ----------

export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: Array<{ value: T; label: ReactNode; count?: number }>; label: string }) {
  return (
    <div className="utabs" role="tablist" aria-label={label}>
      {items.map((it) => (
        <button key={it.value} type="button" role="tab" aria-selected={it.value === value} onClick={() => onChange(it.value)}>
          {it.label}
          {it.count !== undefined && <span className="count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function ListRow({ icon: Icon, tone, title, sub, value, to, onClick, children }: { icon?: LucideIcon; tone?: Tone; title: ReactNode; sub?: ReactNode; value?: ReactNode; to?: string; onClick?: () => void; children?: ReactNode }) {
  const inner = (
    <>
      {Icon && <span className="lrow-tile" data-tone={tone} aria-hidden><Icon size={20} /></span>}
      <span className="lrow-body">
        <span className="lrow-title">{title}</span>
        {sub && <span className="lrow-sub">{sub}</span>}
      </span>
      {children}
      {value !== undefined && <span className="lrow-value">{value}</span>}
      {(to || onClick) && <ChevronRight size={16} className="chev flip-rtl" aria-hidden />}
    </>
  );
  if (to) return <Link to={to} className="lrow">{inner}</Link>;
  if (onClick) return <button type="button" className="lrow" onClick={onClick}>{inner}</button>;
  return <div className="lrow" style={{ cursor: 'default' }}>{inner}</div>;
}

export function AiTag({ children = 'AI draft' }: { children?: ReactNode }) {
  return <span className="ai-tag"><Sparkles size={11} aria-hidden />{children}</span>;
}

export function band(pct: number | undefined) {
  return pct === undefined ? 'none' : pct >= 75 ? 'high' : pct >= 50 ? 'mid' : 'low';
}

export function Heat({ pct, label }: { pct: number | undefined; label?: string }) {
  return <span className="heat" data-band={band(pct)} aria-label={label}>{pct === undefined ? '—' : `${pct}%`}</span>;
}

export function SubjectDot({ hue, className }: { hue: number; className?: string }) {
  return <span className={cx('subject-dot', className)} style={{ ['--hue' as string]: hue }} aria-hidden />;
}
