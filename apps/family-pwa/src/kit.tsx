// Pebble kit pieces used across the family and student screens.

import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookText, Calculator, ChevronRight, FlaskConical, Languages, Sparkles, type LucideIcon } from 'lucide-react';
import type { Presence } from '@school-intel/contracts';
import { AI_DISCLOSURE } from '@school-intel/api';
import type { Tone } from '@school-intel/ui';

export const SUBJECT_ICON: Record<string, LucideIcon> = {
  'sub-math': Calculator,
  'sub-sci': FlaskConical,
  'sub-eng': BookText,
  'sub-ara': Languages,
};

export const hueStyle = (hue: number) => ({ ['--hue' as string]: hue }) as CSSProperties;

export function SubjectTile({ subjectId, hue, size = 46 }: { subjectId: string; hue: number; size?: number }) {
  const Icon = SUBJECT_ICON[subjectId] ?? BookText;
  return (
    <span className="prow-tile" data-hue style={{ ...hueStyle(hue), width: size, height: size }} aria-hidden>
      <Icon size={Math.round(size * 0.45)} />
    </span>
  );
}

/** Pebble list row: radius 18, 14 px padding, tile, title, subtitle, trailing value. */
export function PRow({ icon: Icon, tone, tile, title, sub, end, to, onClick, chevron = true }: { icon?: LucideIcon; tone?: Tone | 'success' | 'pink'; tile?: ReactNode; title: ReactNode; sub?: ReactNode; end?: ReactNode; to?: string; onClick?: () => void; chevron?: boolean }) {
  const inner = (
    <>
      {tile ?? (Icon && <span className="prow-tile" data-tone={tone} aria-hidden><Icon size={21} /></span>)}
      <span className="prow-body">
        <span className="prow-title">{title}</span>
        {sub && <span className="prow-sub">{sub}</span>}
      </span>
      {end && <span className="prow-end">{end}</span>}
      {(to || onClick) && chevron && <ChevronRight size={18} className="chev flip-rtl" aria-hidden />}
    </>
  );
  if (to) return <Link to={to} className="prow">{inner}</Link>;
  if (onClick) return <button type="button" className="prow" onClick={onClick}>{inner}</button>;
  return <div className="prow" style={{ cursor: 'default' }}>{inner}</div>;
}

export function Ring({ pct, size = 64, label, color }: { pct: number; size?: number; label?: ReactNode; color?: string }) {
  return (
    <span className="ring" style={{ ['--p' as string]: Math.max(0, Math.min(100, pct)), ['--size' as string]: `${size}px`, ...(color ? { ['--ring-color' as string]: color } : {}) }} role="img" aria-label={`${pct}%`}>
      <span>{label ?? `${pct}%`}</span>
    </span>
  );
}

export function HeroBars({ values, highlight }: { values: number[]; highlight?: number }) {
  const max = Math.max(...values, 1);
  return (
    <span className="hero-bars" aria-hidden>
      {values.map((v, i) => <i key={i} data-on={i === (highlight ?? values.length - 1)} style={{ height: `${Math.max(10, (v / max) * 100)}%` }} />)}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <h2 className="section-title">
      <span>{children}</span>
      {action}
    </h2>
  );
}

export function AiNote({ children = AI_DISCLOSURE }: { children?: ReactNode }) {
  return (
    <p className="ai-note">
      <Sparkles size={13} aria-hidden /> {children}
    </p>
  );
}

export const PRESENCE: Record<Presence, { label: string; tone: Tone }> = {
  present: { label: 'Present', tone: 'success' },
  late: { label: 'Late', tone: 'warning' },
  absent: { label: 'Absent', tone: 'danger' },
  excused: { label: 'Excused', tone: 'neutral' },
};

export function scoreTone(pct: number | undefined): Tone {
  if (pct === undefined) return 'neutral';
  return pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger';
}

export function daysLabel(days: number) {
  return days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`;
}
