import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import './tokens.css';
import './components.css';
import { useExit } from './motion';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { CircleAlert, CircleCheck, Clock, Info, RefreshCw, TriangleAlert, type LucideIcon } from 'lucide-react';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'restricted';

const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ');
export { cx };
export { Confetti, haptic, reducedMotion, useExit, useGlider, useMotion, useRouteDirection, type RouteDirection } from './motion';

// ---------- Buttons ----------

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  block?: boolean;
  icon?: LucideIcon;
  busy?: boolean;
}

export function Button({ variant = 'primary', size = 'md', block, icon: Icon, busy, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx('btn', variant !== 'primary' && `btn-${variant}`, size === 'sm' && 'btn-sm', block && 'btn-block', className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy ? <span className="spinner" aria-hidden /> : Icon ? <Icon size={size === 'sm' ? 16 : 18} aria-hidden /> : null}
      {children}
    </button>
  );
}

// ---------- Card ----------

export function Card({ children, className, as: As = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'article' | 'div' } & Record<string, unknown>) {
  return (
    <As className={cx('card', className)} {...rest}>
      {children}
    </As>
  );
}

export function CardHeader({ icon: Icon, tone, title, sub, action, id }: { icon?: LucideIcon; tone?: Tone; title: ReactNode; sub?: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="card-header">
      {Icon && (
        <span className="card-icon" data-tone={tone} aria-hidden>
          <Icon size={18} />
        </span>
      )}
      <div className="grow">
        <h2 className="card-title" id={id}>
          {title}
        </h2>
        {sub && <p className="card-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------- Chips, tags, freshness ----------

export function Chip({ tone = 'neutral', children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`chip chip-${tone}`} data-dot={dot}>
      {children}
    </span>
  );
}

export function PhaseTag({ children }: { children: ReactNode }) {
  return <span className="phase">{children}</span>;
}

export function Freshness({ source, at, stale }: { source: string; at: string; stale?: boolean }) {
  return (
    <span className="freshness" data-stale={stale || undefined} title={stale ? 'Source unavailable: showing the last confirmed copy' : `Last synced from ${source}`}>
      {stale ? <TriangleAlert size={12} aria-hidden /> : <RefreshCw size={12} aria-hidden />}
      {source} · {stale ? `stale since ${formatTime(at)}` : formatTime(at)}
    </span>
  );
}

// ---------- Callout ----------

const CALLOUT_ICON: Record<string, LucideIcon> = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert, neutral: Clock };

export function Callout({ tone = 'info', title, children, icon }: { tone?: Exclude<Tone, 'restricted'>; title?: ReactNode; children?: ReactNode; icon?: LucideIcon }) {
  const Icon = icon ?? CALLOUT_ICON[tone];
  return (
    <div className="callout" data-tone={tone} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon size={16} aria-hidden />
      <div className="stack-sm" style={{ gap: 2 }}>
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

// ---------- Forms ----------

let fieldSeq = 0;
function useFieldId(id?: string) {
  const ref = useRef(id ?? `f-${++fieldSeq}`);
  return ref.current;
}

interface FieldShell {
  label: string;
  hint?: ReactNode;
  error?: string;
}

export function TextField({ label, hint, error, id, ...rest }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const fid = useFieldId(id);
  return (
    <div className="field">
      <label className="field-label" htmlFor={fid}>{label}</label>
      <input id={fid} className="input" aria-invalid={!!error || undefined} aria-describedby={hint || error ? `${fid}-d` : undefined} {...rest} />
      {(error || hint) && <span id={`${fid}-d`} className={error ? 'field-error' : 'field-hint'}>{error ?? hint}</span>}
    </div>
  );
}

export function SelectField({ label, hint, error, id, options, ...rest }: FieldShell & SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { value: string; label: string })[] }) {
  const fid = useFieldId(id);
  return (
    <div className="field">
      <label className="field-label" htmlFor={fid}>{label}</label>
      <select id={fid} className="select" aria-invalid={!!error || undefined} aria-describedby={hint || error ? `${fid}-d` : undefined} {...rest}>
        {options.map((o) => (typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      {(error || hint) && <span id={`${fid}-d`} className={error ? 'field-error' : 'field-hint'}>{error ?? hint}</span>}
    </div>
  );
}

export function TextArea({ label, hint, error, id, ...rest }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fid = useFieldId(id);
  return (
    <div className="field">
      <label className="field-label" htmlFor={fid}>{label}</label>
      <textarea id={fid} className="textarea" aria-invalid={!!error || undefined} aria-describedby={hint || error ? `${fid}-d` : undefined} {...rest} />
      {(error || hint) && <span id={`${fid}-d`} className={error ? 'field-error' : 'field-hint'}>{error ?? hint}</span>}
    </div>
  );
}

export function Checkbox({ label, checked, onChange, disabled }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Switch({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <span className="stack-sm" style={{ gap: 0 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        {hint && <span className="field-hint">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Misc ----------

export function Avatar({ initials, size, tone }: { initials: string; size?: 'lg'; tone?: string }) {
  return (
    <span className={cx('avatar', size === 'lg' && 'avatar-lg')} style={tone ? { background: tone } : undefined} aria-hidden>
      {initials}
    </span>
  );
}

export function Progress({ value, tone, label }: { value: number; tone?: 'warning'; label: string }) {
  return (
    <div className="progress" data-tone={tone} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="card-icon" aria-hidden>
        <Icon size={22} />
      </span>
      <h2 className="card-title">{title}</h2>
      {children && <div className="muted small" style={{ maxWidth: 360 }}>{children}</div>}
      {action}
    </div>
  );
}

export function Steps({ steps }: { steps: { label: ReactNode; done: boolean; meta?: ReactNode }[] }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li key={i} data-done={s.done}>
          <span className="step-dot" aria-hidden>
            <CircleCheck size={14} strokeWidth={3} />
          </span>
          <div>
            <div style={{ fontWeight: s.done ? 600 : 500 }}>
              {s.label} <span className="sr-only">{s.done ? '(complete)' : '(pending)'}</span>
            </div>
            {s.meta && <div className="small muted">{s.meta}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---------- Dialog ----------

export function Dialog({ open, onClose, title, children, actions, labelledBy }: { open: boolean; onClose: () => void; title: string; children: ReactNode; actions?: ReactNode; labelledBy?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useFieldId(labelledBy);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      {open && (
        <div className="dialog-body">
          <h2 id={titleId} style={{ fontSize: 'var(--text-xl)' }}>{title}</h2>
          {children}
          {actions && <div className="dialog-actions">{actions}</div>}
        </div>
      )}
    </dialog>
  );
}

// ---------- Toasts ----------

type ToastItem = { id: number; text: string; tone?: 'danger' };
const ToastCtx = createContext<(text: string, tone?: 'danger') => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone?: 'danger') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast" data-tone={t.tone}>
            {t.tone === 'danger' ? <CircleAlert size={16} aria-hidden /> : <CircleCheck size={16} aria-hidden />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

// ---------- Formatting (Dubai time, en-GB conventions) ----------

const TZ = 'Asia/Dubai';

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date(iso));
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00+04:00`) : new Date(iso);
  return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: TZ }).format(d);
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

export function formatWeekday(iso: string) {
  return formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatBytes(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

/** Error message for display, keeping access-denied wording neutral. */
export function errorText(e: unknown) {
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.';
}

// ---------- Colour themes (kit palettes) ----------

export interface Palette {
  id: string;
  name: string;
  kit: string;
  swatch: [string, string, string];
  themeColor: string;
}

const paletteSubs = new Set<() => void>();
const paletteKey = (app: string) => `school-intel:palette:${app}`;

function readPalette(app: string, fallback: string) {
  try {
    return localStorage.getItem(paletteKey(app)) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Applies a palette to the document (data-palette on <html>) and the browser theme colour. */
export function applyPalette(app: string, palettes: Palette[], id?: string) {
  const fallback = palettes[0].id;
  const chosen = palettes.find((p) => p.id === (id ?? readPalette(app, fallback))) ?? palettes[0];
  if (chosen.id === fallback) delete document.documentElement.dataset.palette;
  else document.documentElement.dataset.palette = chosen.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', chosen.themeColor);
  return chosen.id;
}

export function usePalette(app: string, palettes: Palette[]): [string, (id: string) => void] {
  const fallback = palettes[0].id;
  const get = () => readPalette(app, fallback);
  const value = useSyncExternalStore((cb) => (paletteSubs.add(cb), () => paletteSubs.delete(cb)), get, get);
  const set = (id: string) => {
    try {
      localStorage.setItem(paletteKey(app), id);
    } catch {
      /* the choice lasts for this visit only */
    }
    applyPalette(app, palettes, id);
    paletteSubs.forEach((s) => s());
  };
  return [value, set];
}

// ---------- Sign in with a login ID ----------

export interface LoginAccount {
  loginId: string;
  label: string;
  group: string;
}

/**
 * Login ID and passcode form, with a browsable list of the demo accounts grouped
 * by class. `onSubmit` should throw an Error to show a message.
 */
export function LoginIdPanel({ accounts, passcode, onSubmit, busy }: { accounts: LoginAccount[]; passcode: string; onSubmit: (loginId: string, passcode: string) => void; busy?: boolean }) {
  const [loginId, setLoginId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const groups = new Map<string, LoginAccount[]>();
  for (const a of accounts) groups.set(a.group, [...(groups.get(a.group) ?? []), a]);
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          onSubmit(loginId, code);
        } catch (err) {
          setError(errorText(err));
        }
      }}
    >
      <TextField label="Login ID" autoComplete="username" autoCapitalize="none" spellCheck={false} value={loginId} onChange={(e) => { setLoginId(e.target.value); setError(''); }} hint="For example stu.cbse9.01" />
      <TextField label="Passcode" type="password" autoComplete="current-password" value={code} onChange={(e) => { setCode(e.target.value); setError(''); }} error={error} hint={`Demo passcode for every account: ${passcode}`} />
      <Button type="submit" block busy={busy} disabled={!loginId.trim() || !code}>Sign in</Button>
      <details className="login-directory">
        <summary>Browse demo accounts ({accounts.length})</summary>
        {[...groups.entries()].map(([group, list]) => (
          <section key={group} aria-label={group}>
            <h3 className="small muted">{group}</h3>
            <ul>
              {list.map((a) => (
                <li key={a.loginId}>
                  <button type="button" onClick={() => { setLoginId(a.loginId); setCode(passcode); setError(''); }}>
                    <code>{a.loginId}</code>
                    <span>{a.label.split(' · ')[0]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </details>
    </form>
  );
}

// ---------- Bottom sheet ----------

/**
 * A panel that slides up from the bottom of the screen: the mobile way to show menus, pickers and
 * short forms. Closes with the scrim, Escape, the close button or a downward swipe on the handle.
 */
export function BottomSheet({ open, onClose, title, children, tall }: { open: boolean; onClose: () => void; title: string; children: ReactNode; tall?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  const { mounted, closing } = useExit(open);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = ref.current?.querySelector<HTMLElement>('[data-autofocus], input, button, a[href]');
    window.setTimeout(() => first?.focus({ preventScroll: true }), 60);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = overflow;
      prev?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!mounted) return null;
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    ref.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const end = () => {
    if (!drag.current || !ref.current) return;
    const dy = drag.current.dy;
    drag.current = null;
    ref.current.style.transition = 'transform 0.2s var(--ease-out)';
    if (dy > 90) onClose();
    else ref.current.style.transform = '';
  };
  return (
    <div className="sheet-scrim" data-closing={closing || undefined} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="sheet" data-tall={tall || undefined} role="dialog" aria-modal="true" aria-label={title}>
        <div
          className="sheet-grab"
          onPointerDown={(e) => { drag.current = { y: e.clientY, dy: 0 }; ref.current && (ref.current.style.transition = 'none'); e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          aria-hidden
        >
          <span />
        </div>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
