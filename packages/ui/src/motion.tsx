import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/*
 * Motion toolkit shared by both workspaces. Everything here is progressive: the screens render and
 * work without it, and every effect stands down when the device asks for reduced motion.
 */

export const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** A short buzz on phones that support it. Silent everywhere else. */
export function haptic(pattern: number | number[] = 6) {
  try {
    if (!reducedMotion()) navigator.vibrate?.(pattern);
  } catch {
    /* not available */
  }
}

export type RouteDirection = 'forward' | 'back' | 'tab';

const depth = (path: string) => path.split('/').filter(Boolean).length;

/**
 * Which way a screen change should feel: deeper in is forward, up and out is back, and moving between
 * the top-level tabs is a quiet cross-fade.
 */
export function useRouteDirection(pathname: string, navigationType: string): RouteDirection {
  const last = useRef(pathname);
  const dir = useRef<RouteDirection>('tab');
  if (last.current !== pathname) {
    const from = depth(last.current);
    const to = depth(pathname);
    dir.current = navigationType === 'POP' ? 'back' : from <= 1 && to <= 1 ? 'tab' : to > from ? 'forward' : to < from ? 'back' : 'forward';
    last.current = pathname;
  }
  return dir.current;
}

/** Slides a pill behind whichever tab is active, with a small overshoot when it lands. */
export function useGlider(nav: RefObject<HTMLElement | null>, activeSelector: string, key: string) {
  useLayoutEffect(() => {
    const el = nav.current;
    if (!el) return;
    let frame = 0;
    const place = () => {
      const target = el.querySelector<HTMLElement>(activeSelector);
      if (!target) {
        el.removeAttribute('data-glide');
        return;
      }
      const a = el.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      el.style.setProperty('--gx', `${b.left - a.left - el.clientLeft}px`);
      el.style.setProperty('--gy', `${b.top - a.top - el.clientTop}px`);
      el.style.setProperty('--gw', `${b.width}px`);
      el.style.setProperty('--gh', `${b.height}px`);
      if (!el.hasAttribute('data-glide')) {
        // The first placement should not travel across the bar.
        el.setAttribute('data-glide', 'set');
        frame = requestAnimationFrame(() => el.setAttribute('data-glide', 'ready'));
      }
    };
    place();
    const ro = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(place);
    ro?.observe(el);
    void document.fonts?.ready.then(place);
    return () => {
      cancelAnimationFrame(frame);
      ro?.disconnect();
    };
  }, [nav, activeSelector, key]);
}

const COUNTABLE = '.mini-stat strong, .hero-num, .stat-value, .ring > span, [data-count]';
const NUMBER = /^(\d+(?:\.\d+)?)(%|\/\d+|\s?[a-zA-Z]{1,5})?$/;

function countUp(el: HTMLElement, stop: Set<() => void>) {
  const node = el.firstChild;
  if (!node || node.nodeType !== 3 || el.childNodes.length !== 1) return;
  const original = node.nodeValue ?? '';
  const m = NUMBER.exec(original.trim());
  if (!m) return;
  const target = parseFloat(m[1]);
  if (!(target > 0) || target >= 100000) return;
  const decimals = (m[1].split('.')[1] ?? '').length;
  const lead = original.slice(0, original.indexOf(m[1]));
  const tail = m[2] ?? '';
  const trail = original.slice(original.indexOf(m[1]) + m[1].length + tail.length);
  const render = (v: number) => `${lead}${v.toFixed(decimals)}${tail}${trail}`;
  const duration = Math.min(1100, 520 + Math.sqrt(target) * 40);
  const start = performance.now() + 120;
  let frame = 0;
  let written = render(0);
  node.nodeValue = written;
  const cancel = () => {
    cancelAnimationFrame(frame);
    // Only put the value back if nothing else has changed it meanwhile.
    if (node.nodeValue === written) node.nodeValue = original;
  };
  const tick = (now: number) => {
    if (node.nodeValue !== written) return;
    const t = Math.min(1, Math.max(0, (now - start) / duration));
    const eased = 1 - Math.pow(1 - t, 4);
    written = t >= 1 ? original : render(target * eased);
    node.nodeValue = written;
    if (t < 1) frame = requestAnimationFrame(tick);
    else stop.delete(cancel);
  };
  frame = requestAnimationFrame(tick);
  stop.add(cancel);
}

/**
 * Screen-level motion. Call once in each workspace shell with the current path:
 *  - counts numbers up to their value and reveals blocks as they scroll into view,
 *  - raises the top bar once the page scrolls and tucks the tab bar away while reading downward,
 *  - gives taps a buzz and buttons a ripple.
 */
export function useMotion(pathname: string, mainId = 'main') {
  useLayoutEffect(() => {
    if (reducedMotion()) return;
    const main = document.getElementById(mainId);
    if (!main) return;
    const stop = new Set<() => void>();
    main.querySelectorAll<HTMLElement>(COUNTABLE).forEach((el) => countUp(el, stop));

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      const below = Array.from(main.children).filter((c) => c.getBoundingClientRect().top > window.innerHeight * 0.9);
      if (below.length) {
        io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              (e.target as HTMLElement).dataset.reveal = 'in';
              io?.unobserve(e.target);
            }
          },
          { threshold: 0.06, rootMargin: '0px 0px -5% 0px' },
        );
        for (const c of below) {
          (c as HTMLElement).dataset.reveal = 'pending';
          io.observe(c);
        }
      }
    }
    return () => {
      stop.forEach((fn) => fn());
      io?.disconnect();
    };
  }, [pathname, mainId]);

  useEffect(() => {
    const root = document.documentElement;
    let lastY = window.scrollY;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const dy = y - lastY;
      root.toggleAttribute('data-scrolled', y > 6);
      if (!reducedMotion()) {
        const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 48;
        if (y < 90 || dy < -6 || atEnd) root.removeAttribute('data-nav-hidden');
        else if (dy > 10) root.setAttribute('data-nav-hidden', '');
      }
      if (Math.abs(dy) > 6) lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      root.removeAttribute('data-scrolled');
      root.removeAttribute('data-nav-hidden');
    };
  }, []);

  useEffect(() => {
    // Always bring the bar back when moving to another screen.
    document.documentElement.removeAttribute('data-nav-hidden');
  }, [pathname]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest) return;
      if (t.closest('.tab, .hz-tab, .option, [role="radio"], [role="tab"], .hz-tile, .child-switcher button')) haptic(6);
      const btn = t.closest<HTMLElement>('.btn:not([disabled]):not([aria-disabled="true"])');
      if (btn && !reducedMotion()) {
        const r = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height) * 2;
        const dot = document.createElement('span');
        dot.className = 'ripple';
        dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
        btn.appendChild(dot);
        dot.addEventListener('animationend', () => dot.remove(), { once: true });
        window.setTimeout(() => dot.remove(), 900);
      }
    };
    document.addEventListener('pointerdown', onDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);
}

/** Keeps something mounted just long enough for its exit animation to play. */
export function useExit(open: boolean, ms = 220) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const id = window.setTimeout(() => setMounted(false), reducedMotion() ? 0 : ms);
    return () => window.clearTimeout(id);
  }, [open, ms]);
  return { mounted: open || mounted, closing: !open && mounted };
}

const COLOURS = ['var(--color-brand)', 'var(--color-sun, #f4b942)', 'var(--color-coral, #e4572e)', 'var(--color-sea, #1d7a6c)', '#ffffff'];

/** A short burst of paper shapes for good news. Decorative only, and gone after a few seconds. */
export function Confetti({ pieces = 44 }: { pieces?: number }) {
  const [live, setLive] = useState(true);
  useEffect(() => {
    haptic([14, 50, 14]);
    const id = window.setTimeout(() => setLive(false), 3400);
    return () => window.clearTimeout(id);
  }, []);
  if (!live || reducedMotion()) return null;
  // Pseudo-random but stable, so a re-render does not reshuffle the burst.
  const rnd = (i: number, k: number) => {
    const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: pieces }, (_, i) => {
        const angle = (rnd(i, 1) - 0.5) * Math.PI * 1.15;
        const power = 140 + rnd(i, 2) * 260;
        return (
          <i
            key={i}
            data-shape={i % 3}
            style={{
              ['--dx' as string]: `${Math.round(Math.sin(angle) * power)}px`,
              ['--dy' as string]: `${Math.round(-Math.cos(angle) * power * 0.9)}px`,
              ['--rot' as string]: `${Math.round(rnd(i, 3) * 900 - 450)}deg`,
              ['--dur' as string]: `${(1.6 + rnd(i, 4) * 1.3).toFixed(2)}s`,
              ['--delay' as string]: `${Math.round(rnd(i, 5) * 160)}ms`,
              ['--c' as string]: COLOURS[i % COLOURS.length],
            }}
          />
        );
      })}
    </div>
  );
}
