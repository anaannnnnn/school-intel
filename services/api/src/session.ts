// Demo sign-in sessions. Family and staff sessions are kept separately so a
// reviewer can be signed in to both apps in the same browser.

import type { Actor } from '@school-intel/contracts';

type Surface = 'family' | 'staff';
const key = (s: Surface) => `school-intel:session:${s}`;
const listeners = new Set<() => void>();
const cache: Partial<Record<Surface, Actor | null>> = {};

function read(surface: Surface): Actor | null {
  if (surface in cache) return cache[surface] ?? null;
  try {
    const raw = localStorage.getItem(key(surface));
    cache[surface] = raw ? (JSON.parse(raw) as Actor) : null;
  } catch {
    cache[surface] = null;
  }
  return cache[surface] ?? null;
}

export function getSession(surface: Surface): Actor | null {
  return read(surface);
}

export function setSession(surface: Surface, actor: Actor | null) {
  cache[surface] = actor;
  try {
    if (actor) localStorage.setItem(key(surface), JSON.stringify(actor));
    else localStorage.removeItem(key(surface));
  } catch {
    /* in-memory only */
  }
  listeners.forEach((l) => l());
}

export function subscribeSession(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
