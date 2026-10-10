// Administrator console data. Every function requires the admin role and is audited by the caller's
// session; passcodes and hashes are never returned.

import type { Actor, Student } from '@school-intel/contracts';
import { audit, requireRole } from './access';
import { accountList, getDb, mutate } from './store';

const rateOf = (id: string) => {
  const days = getDb().attendanceHistory[id] ?? [];
  return days.length ? Math.round((days.filter((x) => x.status !== 'absent').length / days.length) * 100) : 100;
};

const admin = (actor: Actor, what: string) => requireRole(actor, `Admin · ${what}`, 'admin');

export function overview(actor: Actor) {
  admin(actor, 'Overview');
  const d = getDb();
  const rates = d.students.map((s) => rateOf(s.id));
  const grades = Array.from({ length: 12 }, (_, i) => i + 1).map((g) => {
    const sts = d.students.filter((s) => s.yearGroup === g);
    const sections = d.classes.filter((c) => c.yearGroup === g || parseInt(c.id, 10) === g);
    return {
      grade: g,
      students: sts.length,
      sections: sections.length,
      attendance: sts.length ? Math.round(sts.reduce((n, s) => n + rateOf(s.id), 0) / sts.length) : 0,
    };
  });
  const kinds: Record<string, number> = {};
  for (const m of d.materials) kinds[m.kind] = (kinds[m.kind] ?? 0) + 1;
  return {
    students: d.students.length,
    guardians: d.guardians.length,
    teachers: d.staff.filter((s) => s.roles.includes('teacher')).length,
    sections: d.classes.length,
    materials: d.materials.length,
    questions: d.questions.length,
    assessments: d.assessments.length,
    messages: d.chat.length,
    accounts: accountList().length,
    attendance: Math.round(rates.reduce((a, b) => a + b, 0) / Math.max(1, rates.length)),
    below85: rates.filter((r) => r < 85).length,
    grades,
    materialKinds: kinds,
  };
}

export interface StudentRow {
  id: string;
  name: string;
  classId: string;
  grade: number;
  rollNo?: number;
  gender?: string;
  attendance: number;
  loginId?: string;
}

export function students(actor: Actor, filter: { q?: string; grade?: number; classId?: string } = {}): StudentRow[] {
  admin(actor, 'Students');
  const d = getDb();
  const q = filter.q?.trim().toLowerCase();
  const logins = new Map(accountList().filter((a) => a.kind === 'student').map((a) => [a.id, a.loginId]));
  return d.students
    .filter((s) => (!filter.grade || s.yearGroup === filter.grade) && (!filter.classId || s.classId === filter.classId))
    .filter((s) => !q || s.name.toLowerCase().includes(q) || s.classId.toLowerCase() === q || (logins.get(s.id) ?? '').includes(q))
    .slice(0, 400)
    .map((s) => ({ id: s.id, name: s.name, classId: s.classId, grade: s.yearGroup, rollNo: s.rollNo, gender: s.gender, attendance: rateOf(s.id), loginId: logins.get(s.id) }));
}

export function studentProfile(actor: Actor, studentId: string) {
  admin(actor, 'Student profile');
  const d = getDb();
  const s = d.students.find((x) => x.id === studentId) as Student | undefined;
  if (!s) return undefined;
  const logins = accountList().filter((a) => a.id === s.id || d.relationships.some((r) => r.studentId === s.id && r.guardianId === a.id));
  const subs = new Map(d.subjects.map((x) => [x.id, x.name]));
  mutate((x) => audit(x, actor, 'Viewed student profile', s.name));
  return {
    student: s,
    guardians: d.relationships.filter((r) => r.studentId === s.id).map((r) => d.guardians.find((g) => g.id === r.guardianId)).filter(Boolean),
    logins: logins.map(({ passwordHash: _h, ...rest }) => rest),
    attendance: rateOf(s.id),
    recent: (d.attendanceHistory[s.id] ?? []).slice(-14),
    scores: (d.scorecards[s.id] ?? []).map((e) => ({ ...e, subject: subs.get(e.subjectId) ?? e.subjectId })),
    behaviour: d.behaviourPoints.filter((b) => b.studentId === s.id),
  };
}

export function teachers(actor: Actor) {
  admin(actor, 'Teachers');
  const d = getDb();
  const logins = new Map(accountList().filter((a) => a.kind === 'staff').map((a) => [a.id, a.loginId]));
  return d.staff
    .filter((s) => s.roles.includes('teacher'))
    .map((s) => ({
      id: s.id,
      name: s.name,
      title: s.title,
      loginId: logins.get(s.id) ?? '',
      sections: s.classIds.filter((c) => d.classes.some((k) => k.id === c)).length,
      subjects: d.subjects.filter((x) => x.teacherId === s.id).map((x) => x.name),
    }));
}

export function classes(actor: Actor) {
  admin(actor, 'Classes');
  const d = getDb();
  return d.classes.map((c) => {
    const ids = d.students.filter((s) => s.classId === c.id).map((s) => s.id);
    return {
      id: c.id,
      grade: parseInt(c.id, 10),
      stream: c.stream,
      room: c.room,
      students: ids.length,
      tutor: d.staff.find((s) => s.id === c.tutorId)?.name ?? '—',
      attendance: Math.round(ids.reduce((n, id) => n + rateOf(id), 0) / Math.max(1, ids.length)),
    };
  });
}

/** Logins for the school, without hashes. The first-use passcode is documented, not stored here. */
export function accounts(actor: Actor, filter: { q?: string; kind?: 'student' | 'guardian' | 'staff' } = {}) {
  admin(actor, 'Accounts');
  const q = filter.q?.trim().toLowerCase();
  mutate((d) => audit(d, actor, 'Viewed accounts', filter.kind ?? 'all'));
  return accountList()
    .filter((a) => (!filter.kind || a.kind === filter.kind) && (!q || a.loginId.includes(q) || a.label.toLowerCase().includes(q)))
    .slice(0, 500)
    .map(({ passwordHash: _h, ...rest }) => rest);
}

/** All accounts as CSV for the school office. */
export function accountsCsv(actor: Actor): string {
  admin(actor, 'Accounts export');
  mutate((d) => audit(d, actor, 'Exported accounts', 'CSV'));
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return ['login_id,role,name,group', ...accountList().map((a) => [a.loginId, a.kind, a.label, a.group].map(esc).join(','))].join('\n');
}

export function recentChat(actor: Actor) {
  admin(actor, 'Chat');
  const d = getDb();
  return {
    total: d.chat.length,
    broadcasts: d.chat.filter((m) => m.broadcast).length,
    latest: d.chat.slice(-20).reverse(),
  };
}

export function auditLog(actor: Actor) {
  admin(actor, 'Audit');
  return getDb().audit.slice(0, 100);
}
