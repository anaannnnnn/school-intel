import { useSyncExternalStore } from 'react';
import { getDb, subscribe } from './store';
import { getSession, subscribeSession } from './session';

/** Re-render when demo data changes (including from another tab or app). */
export function useDb() {
  return useSyncExternalStore(subscribe, getDb, getDb);
}

export function useSession(surface: 'family' | 'staff') {
  return useSyncExternalStore(subscribeSession, () => getSession(surface), () => getSession(surface));
}
