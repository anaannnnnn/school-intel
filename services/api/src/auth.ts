// Demo sign-in by login ID. Every account is fictional and every account shares
// one published demo passcode. This stands in for the school's SSO and MFA; it is
// not a real authentication service.

import type { Account, Actor } from '@school-intel/contracts';
import { getDb, mutate } from './store';
import { audit } from './access';

export const DEMO_PASSCODE = 'Demo-2026';

export class SignInError extends Error {
  constructor(message = 'Login ID or passcode not recognised.') {
    super(message);
    this.name = 'SignInError';
  }
}

/** Returns the person for a login ID and passcode, or throws. Failed attempts are audited. */
export function signInWithLoginId(loginId: string, passcode: string, surface: 'family' | 'staff'): Actor {
  const id = loginId.trim().toLowerCase();
  const account = getDb().accounts.find((a) => a.loginId === id);
  const allowed = !!account && (surface === 'staff' ? account.kind === 'staff' : account.kind !== 'staff');
  if (!account || !allowed || passcode !== DEMO_PASSCODE) {
    mutate((d) => audit(d, `login:${id.slice(0, 40) || 'blank'}`, 'Sign-in failed', surface === 'staff' ? 'Staff workspace' : 'Family app', 'denied'));
    throw new SignInError();
  }
  mutate((d) => audit(d, { kind: account.kind, id: account.id } as Actor, 'Signed in with login ID', account.loginId));
  return { kind: account.kind, id: account.id } as Actor;
}

/** The demo accounts a reviewer can try, grouped for display. */
export function demoAccounts(surface: 'family' | 'staff'): Account[] {
  return getDb().accounts.filter((a) => (surface === 'staff' ? a.kind === 'staff' : a.kind !== 'staff'));
}
