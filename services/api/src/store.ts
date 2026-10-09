// Persistence layer. The school database (a SQLite file, see database.ts) is read once at start-up and
// installed here. Changes made in the apps are kept in this browser's local storage until a server
// backend takes over; a new release of the database file replaces them (see `dataVersion`).
// Both apps are served from one origin, so they share this store, and other tabs stay in sync through
// storage events.

import { DEMO_DATE } from './constants';
import type { Db } from './db-types';

const KEY = 'school-intel:data';

type Listener = () => void;
const listeners = new Set<Listener>();

const storage: Storage | undefined = (() => {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
})();

/** A login. The password hash stays in memory only; it is never written to local storage. */
export interface AccountRow {
  loginId: string;
  kind: 'student' | 'guardian' | 'staff';
  id: string;
  label: string;
  group: string;
  passwordHash: string;
}

let db: Db | undefined;
let baseline = '';
let version: string | undefined;
let accountRows: AccountRow[] = [];

function readSaved(): Db | null {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Db;
    return version && parsed.dataVersion === version ? parsed : null;
  } catch {
    return null;
  }
}

/** Install the school database document and its logins. Local changes from the same release are kept. */
export function installDatabase(doc: Db, accounts: AccountRow[] = []) {
  baseline = JSON.stringify(doc);
  version = doc.dataVersion;
  accountRows = accounts;
  db = readSaved() ?? (JSON.parse(baseline) as Db);
  emit();
}

export const hasDatabase = () => !!db;

export function accountList(): AccountRow[] {
  return accountRows;
}

function persist() {
  try {
    storage?.setItem(KEY, JSON.stringify(db));
  } catch {
    /* private mode or quota: the app keeps working in memory */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !baseline) return;
    db = readSaved() ?? (JSON.parse(baseline) as Db);
    emit();
  });
}

export function getDb(): Db {
  if (!db) throw new Error('The school database has not loaded yet.');
  return db;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Apply a mutation atomically, then persist and notify subscribers. */
export function mutate<T>(fn: (draft: Db) => T): T {
  const next = structuredClone(getDb());
  const result = fn(next);
  db = next;
  persist();
  emit();
  return result;
}

/** Discard local changes and go back to the school database as released. */
export function resetData() {
  db = JSON.parse(baseline) as Db;
  persist();
  emit();
}

/** The school opens at 10:45 Dubai time on the day the database is dated, then runs at real speed so
 *  timers and timestamps move. */
export const DEMO_START = '10:45';
const startedAt = Date.now();
const demoBase = Date.parse(`${DEMO_DATE}T${DEMO_START}:00+04:00`);
const dayEnd = Date.parse(`${DEMO_DATE}T23:59:59+04:00`);

/** Current school time as an ISO string with the Dubai offset. */
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
