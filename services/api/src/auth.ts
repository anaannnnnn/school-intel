// Sign-in by login ID and passcode. Accounts come from the school database (the `accounts` table);
// passcodes are stored as scrypt hashes and checked in the browser. This is not a substitute for a
// server-side identity service: anyone who can download the database file can attempt offline guesses
// against the hashes, so use long passcodes and move to a real backend before holding real records.

import type { Actor } from '@school-intel/contracts';
import { accountList, mutate } from './store';
import { audit } from './access';
import { verifyPasscode } from './passcode';

/** What a person tells the app they are. Teachers include other school staff. */
export type Role = 'student' | 'parent' | 'teacher';

export const ROLE_LABEL: Record<Role, string> = { student: 'Student', parent: 'Parent or guardian', teacher: 'Teacher or staff' };

const KIND_OF = { student: 'student', parent: 'guardian', teacher: 'staff' } as const;
const roleOfKind = (k: 'student' | 'guardian' | 'staff'): Role => (k === 'guardian' ? 'parent' : k === 'staff' ? 'teacher' : 'student');

export class SignInError extends Error {
  /** Set when the ID and passcode are right but belong to another role, so the screen can offer to switch. */
  readonly otherRole?: Role;
  constructor(message = 'Login ID or passcode not recognised.', otherRole?: Role) {
    super(message);
    this.name = 'SignInError';
    this.otherRole = otherRole;
  }
}

// Checked when the ID is unknown so a wrong ID takes as long as a wrong passcode.
const DUMMY = 'scrypt$16384$8$1$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000';

/** Returns the person for a login ID and passcode, or throws. Failed attempts are audited. */
export async function signIn(loginId: string, passcode: string, role: Role): Promise<Actor> {
  const id = loginId.trim().toLowerCase();
  const account = accountList().find((a) => a.loginId === id);
  const ok = await verifyPasscode(passcode, account?.passwordHash ?? DUMMY);
  if (!account || !ok) {
    mutate((d) => audit(d, `login:${id.slice(0, 40) || 'blank'}`, 'Sign-in failed', role === 'teacher' ? 'Staff workspace' : 'Family app', 'denied'));
    throw new SignInError();
  }
  if (account.kind !== KIND_OF[role]) {
    const other = roleOfKind(account.kind);
    throw new SignInError(`That ID belongs to a ${ROLE_LABEL[other].toLowerCase()} account.`, other);
  }
  const actor = { kind: account.kind, id: account.id } as Actor;
  mutate((d) => audit(d, actor, 'Signed in', account.loginId));
  return actor;
}

/** Sign in with a guardian invitation code, as a first-time parent would. */
export { verifyGuardianInvitation } from './family';

/** Accounts for a role, without password hashes. For administration and tests. */
export function accountsFor(role: Role) {
  return accountList()
    .filter((a) => a.kind === KIND_OF[role])
    .map(({ passwordHash: _hash, ...rest }) => rest);
}

/** The name on an account, for the "welcome back" line. */
export function describeAccount(loginId: string): { name: string; detail: string } | undefined {
  const a = accountList().find((x) => x.loginId === loginId.trim().toLowerCase());
  if (!a) return undefined;
  const [name, ...rest] = a.label.split(' · ');
  return { name, detail: rest.join(' · ') };
}
