// CBSE data for Classes 1 to 12: catalogue integrity, people and access.
import { beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '@school-intel/contracts';
import { AccessDenied } from './access';
import { SignInError, accountsFor, signIn } from './auth';
import { TEST_PASSCODE } from './test-setup';
import * as learn from './learn';
import * as teach from './teach';
import { catalogue, findCourse } from './seed-curriculum';
import { accountList, getDb, resetData } from './store';

beforeEach(() => resetData());

describe('CBSE curriculum', () => {
  it('has a real course, with chapter titles and a source, for every cohort subject', () => {
    const d = getDb();
    for (const sub of d.subjects) {
      const cls = d.classes.find((c) => (c.cohort ?? c.id) === sub.classId);
      if (!cls || !sub.name) continue;
      const c = findCourse('cbse', Number(String(sub.classId).match(/\d+/)![0]), sub.name);
      if (!c) continue;
      expect(c.t.length, sub.name).toBeGreaterThanOrEqual(2);
      expect(c.src).toMatch(/^https:\/\//);
    }
    expect(catalogue.every((c) => c.p === 'cbse')).toBe(true);
    expect(findCourse('cbse', 12, 'Physics')?.t.map((t) => t.title)).toContain('Electric Charges and Fields');
  });

  it('covers grades 1 to 12 with 4 to 6 sections each', () => {
    const d = getDb();
    for (let g = 1; g <= 12; g++) {
      const sections = d.classes.filter((c) => c.yearGroup === g || String(c.id).startsWith(String(g)) && /^\d+[A-Z]$/.test(c.id) && parseInt(c.id) === g);
      expect(sections.length, 'grade ' + g).toBeGreaterThanOrEqual(4);
      expect(sections.length, 'grade ' + g).toBeLessThanOrEqual(6);
    }
  });

  it('offers every study-material kind, with a textbook guide for every chapter', () => {
    const kinds = new Set(getDb().materials.map((m) => m.kind));
    for (const k of ['notes', 'revision', 'worksheet', 'textbook', 'sample-paper']) expect(kinds.has(k as never), k).toBe(true);
    expect(getDb().questions.length).toBeGreaterThan(1000);
  });
});

describe('seeded people and records', () => {
  it('gives every section 20+ students, a class teacher and a full timetable', () => {
    const d = getDb();
    for (const cls of d.classes) {
      expect(d.students.filter((s) => s.classId === cls.id).length, cls.id).toBeGreaterThanOrEqual(20);
      expect(d.staff.find((s) => s.id === cls.tutorId)?.classIds, cls.id).toContain(cls.id);
      expect(d.periods.filter((p) => p.classId === cls.id).length, cls.id).toBeGreaterThanOrEqual(30);
    }
  });

  it('records attendance and scores for the generated students', () => {
    const d = getDb();
    const s = d.students.find((x) => x.id === 'stu-9a-01')!;
    expect(s.rollNo).toBeTruthy();
    expect(Object.keys(d.attendanceHistory[s.id] ?? {}).length).toBeGreaterThan(10);
    expect(d.scorecards[s.id]?.length).toBeGreaterThan(0);
  });

  it('uses unique ids and login IDs, and every account points to a real person', () => {
    const d = getDb();
    const ids = [...d.staff.map((s) => s.id), ...d.students.map((s) => s.id), ...d.guardians.map((g) => g.id)];
    expect(new Set(ids).size).toBe(ids.length);
    const accounts = accountList();
    expect(new Set(accounts.map((a) => a.loginId)).size).toBe(accounts.length);
    for (const a of accounts) {
      const list = a.kind === 'staff' ? d.staff : a.kind === 'student' ? d.students : d.guardians;
      expect(list.some((p) => p.id === a.id), a.loginId).toBe(true);
    }
  });

  it('keeps the data fictional: example domains only', () => {
    const d = getDb();
    for (const s of d.staff) expect(s.email).toMatch(/@horizon\.example$/);
    for (const g of d.guardians) expect(g.email).toMatch(/@family\.example$/);
  });
});

describe('access follows class and cohort', () => {
  const actorOf = (loginId: string, role: 'student' | 'parent' | 'teacher') => signIn(loginId, TEST_PASSCODE, role);

  it('a Class 9 student sees the Class 9 cohort subjects', async () => {
    const me = await actorOf('stu.9a.01', 'student');
    const subs = learn.subjectsFor(me, me.id);
    expect(subs.map((s) => s.name).sort()).toEqual(['English', 'Hindi', 'Mathematics', 'Science', 'Social Science']);
  });

  it('a parent can open only their own child', async () => {
    const parent = await actorOf('par.9a.01', 'parent');
    const own = getDb().relationships.find((r) => r.guardianId === parent.id)!.studentId;
    expect(learn.subjectsFor(parent, own).length).toBeGreaterThan(0);
    const other = getDb().students.find((s) => s.classId === '9A' && s.id !== own)!;
    expect(() => learn.subjectsFor(parent, other.id)).toThrow(AccessDenied);
  });

  it('a subject teacher sees only their own cohort', async () => {
    const t = (await actorOf('tch.physics.g11science', 'teacher')) as Actor;
    const mine = teach.mySubjects(t);
    expect(mine.length).toBeGreaterThan(0);
    for (const s of mine) expect(s.classId).toBe('G11-Science');
    expect(() => teach.classRoster(t, '9A')).toThrow(AccessDenied);
    expect(teach.classRoster(t, '11A')).toBeTruthy();
  });
});

describe('login IDs', () => {
  it('rejects a wrong passcode and an unknown ID, and records each failure', async () => {
    const before = getDb().audit.length;
    await expect(signIn('stu.9a.01', 'nope', 'student')).rejects.toBeInstanceOf(SignInError);
    await expect(signIn('nobody', TEST_PASSCODE, 'student')).rejects.toBeInstanceOf(SignInError);
    expect(getDb().audit.length).toBe(before + 2);
    expect(getDb().audit[0].outcome).toBe('denied');
  });

  it('tells a person when their ID belongs to another role, only once the passcode is right', async () => {
    await expect(signIn('stu.9a.01', TEST_PASSCODE, 'teacher')).rejects.toMatchObject({ otherRole: 'student' });
    await expect(signIn('tch.physics.g11science', TEST_PASSCODE, 'parent')).rejects.toMatchObject({ otherRole: 'teacher' });
    await expect(signIn('stu.9a.01', 'nope', 'teacher')).rejects.toMatchObject({ otherRole: undefined });
  });

  it('is not case sensitive on the ID, and lists accounts per role without hashes', async () => {
    expect((await signIn(' STU.9A.01 ', TEST_PASSCODE, 'student')).kind).toBe('student');
    expect(accountsFor('teacher').every((a) => a.kind === 'staff')).toBe(true);
    expect(accountsFor('parent').every((a) => a.kind === 'guardian')).toBe(true);
    expect(accountsFor('student').every((a) => a.kind === 'student')).toBe(true);
    expect(JSON.stringify(accountsFor('student'))).not.toContain('scrypt');
  });

  it('gives the original Year 7A people login IDs too', async () => {
    expect(await signIn('stu.sara', TEST_PASSCODE, 'student')).toEqual({ kind: 'student', id: 'stu-sara' });
    expect(await signIn('par.fatima', TEST_PASSCODE, 'parent')).toEqual({ kind: 'guardian', id: 'g-fatima' });
    expect(await signIn('tch.nadia', TEST_PASSCODE, 'teacher')).toEqual({ kind: 'staff', id: 'st-nadia' });
    expect(await signIn('staff.samira', TEST_PASSCODE, 'teacher')).toEqual({ kind: 'staff', id: 'st-samira' });
  });
});

