// Deny-by-default access checks (PRD §17). Every API function calls these
// before reading or changing a record; denied attempts are audited.

import type { Actor, StaffMember, StaffRole, Student } from '@school-intel/contracts';
import type { Db } from './db-types';
import { getDb, mutate, nextId, nowIso } from './store';

export class AccessDenied extends Error {
  constructor(message = 'Your current role cannot view this record.') {
    super(message);
    this.name = 'AccessDenied';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function actorName(d: Db, actor: Actor): string {
  if (actor.kind === 'staff') return d.staff.find((s) => s.id === actor.id)?.name ?? 'Unknown staff';
  if (actor.kind === 'guardian') return d.guardians.find((g) => g.id === actor.id)?.name ?? 'Unknown guardian';
  return d.students.find((s) => s.id === actor.id)?.name ?? 'Unknown student';
}

export function audit(d: Db, actor: Actor | string, action: string, target: string, outcome: 'allowed' | 'denied' = 'allowed') {
  d.audit.unshift({
    id: nextId(d, 'A', 'A', 4),
    at: nowIso(),
    actor: typeof actor === 'string' ? actor : actorName(d, actor),
    action,
    target,
    outcome,
  });
}

function deny(actor: Actor, target: string, message?: string): never {
  mutate((d) => audit(d, actor, 'Access denied', target, 'denied'));
  throw new AccessDenied(message);
}

export function staffOf(actor: Actor, d: Db = getDb()): StaffMember {
  if (actor.kind !== 'staff') deny(actor, 'Staff workspace');
  const s = d.staff.find((x) => x.id === actor.id);
  if (!s) deny(actor, 'Staff workspace');
  return s;
}

export function hasRole(actor: Actor, ...roles: StaffRole[]): boolean {
  if (actor.kind !== 'staff') return false;
  const s = getDb().staff.find((x) => x.id === actor.id);
  return !!s && s.roles.some((r) => roles.includes(r));
}

export function requireRole(actor: Actor, target: string, ...roles: StaffRole[]): StaffMember {
  const s = staffOf(actor);
  if (!s.roles.some((r) => roles.includes(r))) deny(actor, target);
  return s;
}

/** Verified, unrevoked children of a guardian. Re-read on every request. */
export function linkedStudentIds(d: Db, guardianId: string): string[] {
  return d.relationships.filter((r) => r.guardianId === guardianId && r.status === 'verified').map((r) => r.studentId);
}

/** Guardians may see verified linked children; students may see themselves. */
export function requireFamilyAccess(actor: Actor, studentId: string): Student {
  const d = getDb();
  const student = d.students.find((s) => s.id === studentId);
  const ok =
    !!student &&
    ((actor.kind === 'guardian' && linkedStudentIds(d, actor.id).includes(studentId)) ||
      (actor.kind === 'student' && actor.id === studentId));
  if (!ok) deny(actor, `Student record ${studentId}`, 'This child is not linked to your verified account.');
  return student!;
}

/** Staff visibility of an individual student's general record. */
export function canStaffSeeStudent(actor: Actor, studentId: string): boolean {
  if (actor.kind !== 'staff') return false;
  const d = getDb();
  const s = d.staff.find((x) => x.id === actor.id);
  const student = d.students.find((x) => x.id === studentId);
  if (!s || !student) return false;
  if (s.roles.some((r) => ['office', 'attendance', 'pastoral', 'safeguarding', 'leadership', 'it'].includes(r))) return true;
  return s.classIds.includes(student.classId);
}
