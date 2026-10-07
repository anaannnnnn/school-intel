// Demo persistence layer. In production this is the relational database behind
// the authenticated API (PRD §15). Here the store lives in the browser so the
// prototype runs as static files; both apps share it because they are served
// from the same origin, and other tabs are kept in sync through storage events.

import { createSeed, DEMO_DATE, type Db } from './seed';

const KEY = 'school-intel:demo-db';

type Listener = () => void;
const listeners = new Set<Listener>();

const storage: Storage | undefined = (() => {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
})();

function load(): Db {
  const seed = createSeed();
  try {
    const raw = storage?.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Db;
      if (parsed.version === seed.version) return parsed;
    }
  } catch {
    /* fall through to a fresh seed */
  }
  return seed;
}

let db: Db = load();

function persist() {
  try {
    storage?.setItem(KEY, JSON.stringify(db));
  } catch {
    /* private mode or quota: the demo keeps working in memory */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    db = load();
    emit();
  });
}

export function getDb(): Db {
  return db;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Apply a mutation atomically, then persist and notify subscribers. */
export function mutate<T>(fn: (draft: Db) => T): T {
  const next = structuredClone(db);
  const result = fn(next);
  db = next;
  persist();
  emit();
  return result;
}

export function resetDemo() {
  db = createSeed();
  persist();
  emit();
}

/** The demo opens at 10:45 Dubai time on 6 October 2026 (mid-way through
 *  lesson 4), then runs at real speed so timers and timestamps move. */
export const DEMO_START = '10:45';
const startedAt = Date.now();
const demoBase = Date.parse(`${DEMO_DATE}T${DEMO_START}:00+04:00`);
const dayEnd = Date.parse(`${DEMO_DATE}T23:59:59+04:00`);

/** Current demo time as an ISO string with the Dubai offset. */
export function nowIso(): string {
  const d = new Date(Math.min(dayEnd, demoBase + (Date.now() - startedAt)) + 4 * 3600_000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${DEMO_DATE}T${hh}:${mm}:${ss}+04:00`;
}

export function nextId(d: Db, counter: string, prefix: string, pad = 3): string {
  d.counters[counter] = (d.counters[counter] ?? 0) + 1;
  return `${prefix}-${String(d.counters[counter]).padStart(pad, '0')}`;
}
