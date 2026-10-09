// Hand-drawn style illustrations for the three roles. Pure SVG, no external assets.
import type { Role } from './roles';

const INK = 'var(--gt-ink)';

export function RoleArt({ role, size = 160 }: { role: Role; size?: number }) {
  const w = size;
  const h = Math.round(size * 0.9);
  const common = { width: w, height: h, viewBox: '0 0 160 144', fill: 'none', 'aria-hidden': true, focusable: false } as const;
  if (role === 'student') {
    return (
      <svg {...common}>
        <circle cx="122" cy="30" r="14" fill="var(--gt-sun)" />
        <path d="M122 12v-5M122 53v-5M104 30h-5M145 30h-5M109 17l-3-3M135 43l-3-3M135 17l3-3M109 43l-3 3" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18 112c14-6 36-8 62 2 26-10 48-8 62-2v12c-14-6-36-8-62 2-26-10-48-8-62-2z" fill="var(--gt-paper-deep)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M18 100V54c14-6 36-8 62 2v58c-26-10-48-8-62-2z" fill="var(--gt-card)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M142 100V54c-14-6-36-8-62 2v58c26-10 48-8 62-2z" fill="var(--gt-role)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M30 70c8-2 18-2 28 1M30 82c8-2 18-2 28 1M30 94c8-2 18-2 28 1" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".55" />
        <path d="M96 72l22 2M96 84l22 2" stroke="var(--gt-card)" strokeWidth="2.4" strokeLinecap="round" />
        <g transform="rotate(32 118 108)">
          <rect x="108" y="86" width="12" height="46" rx="2" fill="var(--gt-sun)" stroke={INK} strokeWidth="2.2" />
          <path d="M108 132l6 12 6-12z" fill="var(--gt-card)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M108 94h12" stroke={INK} strokeWidth="2.2" />
        </g>
      </svg>
    );
  }
  if (role === 'parent') {
    return (
      <svg {...common}>
        <circle cx="30" cy="30" r="9" fill="var(--gt-paper-deep)" />
        <path d="M14 126h132" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M32 126V70l48-38 48 38v56z" fill="var(--gt-card)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M22 76L80 28l58 48" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M104 40V24h12v26" fill="var(--gt-paper-deep)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="66" y="92" width="28" height="34" rx="14" fill="var(--gt-role)" stroke={INK} strokeWidth="2.4" />
        <circle cx="88" cy="110" r="2" fill={INK} />
        <path d="M80 72c-7-6-14-1-12 5 1 4 7 8 12 11 5-3 11-7 12-11 2-6-5-11-12-5z" fill="var(--gt-role)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M130 126c0-14 4-22 10-28M140 126c-1-10 2-18 8-22" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="139" cy="97" rx="5" ry="8" transform="rotate(-24 139 97)" fill="var(--gt-sea)" stroke={INK} strokeWidth="2" />
        <ellipse cx="149" cy="103" rx="4" ry="7" transform="rotate(20 149 103)" fill="var(--gt-sea)" stroke={INK} strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="132" cy="26" r="10" fill="var(--gt-sun)" />
      <rect x="16" y="22" width="128" height="82" rx="8" fill="var(--gt-role)" stroke={INK} strokeWidth="2.6" />
      <rect x="24" y="30" width="112" height="66" rx="4" fill="var(--gt-chalk)" opacity=".16" />
      <path d="M36 80l22-24 18 14 26-34 20 20" stroke="var(--gt-card)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="80" r="3.6" fill="var(--gt-card)" /><circle cx="58" cy="56" r="3.6" fill="var(--gt-card)" /><circle cx="76" cy="70" r="3.6" fill="var(--gt-card)" /><circle cx="102" cy="36" r="3.6" fill="var(--gt-card)" /><circle cx="122" cy="56" r="3.6" fill="var(--gt-card)" />
      <path d="M32 40h24M32 48h14" stroke="var(--gt-card)" strokeWidth="2.2" strokeLinecap="round" opacity=".7" />
      <path d="M12 104h136" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="40" y="108" width="30" height="8" rx="2" fill="var(--gt-card)" stroke={INK} strokeWidth="2" />
      <rect x="78" y="110" width="12" height="6" rx="1.5" fill="var(--gt-paper-deep)" stroke={INK} strokeWidth="2" />
      <path d="M118 140c-8-6-12-14-8-22 5-8 14-5 16 0 2-5 12-8 16 0 4 8-2 17-10 22-4 3-10 3-14 0z" fill="var(--gt-coral)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" transform="translate(-14 4) scale(.9)" />
      <path d="M124 112c1-5 4-8 8-9" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
