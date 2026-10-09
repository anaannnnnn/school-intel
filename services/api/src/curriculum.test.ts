// Real-syllabus data for Grades 9 to 13: catalogue integrity, people and access.
import { beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '@school-intel/contracts';
import { AccessDenied } from './access';
import { SignInError, accountsFor, signIn } from './auth';
import { TEST_PASSCODE } from './test-setup';
import * as learn from './learn';
import * as teach from './teach';
import { CLASS_SPECS, catalogue, findCourse } from './seed-curriculum';
import { accountList, getDb, resetData } from './store';

beforeEach(() => resetData());

describe('curriculum catalogue', () => {
  it('has a real course, with chapter titles and a source, for every subject a class studies', () => {
    for (const spec of CLASS_SPECS) {
      for (const name of spec.subjects) {
        const c = findCourse(spec.p, spec.p === 'igcse' || spec.p === 'olevel' ? 10 : spec.grade, name);
        expect(c, `${spec.id} ${name}`).toBeTruthy();
        expect(c!.t.length, `${spec.id} ${name} topics`).toBeGreaterThanOrEqual(2);
        expect(c!.src).toMatch(/^https:\/\//);
        for (const t of c!.t) expect(t.title.trim().length).toBeGreaterThan(2);
      }
    }
  });

  it('covers every board the school offers and grades 9 to 13', () => {
    expect(new Set(CLASS_SPECS.map((s) => s.p))).toEqual(new Set(['cbse', 'icse', 'isc', 'igcse', 'olevel', 'as', 'al']));
    expect(new Set(CLASS_SPECS.map((s) => s.grade))).toEqual(new Set([9, 10, 11, 12, 13]));
    expect(catalogue.length).toBeGreaterThan(100);
  });

  it('stores real Cambridge codes and CBSE chapter titles', () => {
    expect(findCourse('igcse', 10, 'Physics')?.code).toBe('0625');
    expect(findCourse('al', 13, 'Mathematics')?.code).toBe('9709');
    expect(findCourse('cbse', 12, 'Physics')?.t.map((t) => t.title)).toContain('Electric Charges and Fields');
  });
});

describe('seeded people and records', () => {
  it('gives every class students, a tutor, subjects with topics and a timetable', () => {
    const d = getDb();
    for (const spec of CLASS_SPECS) {
      const cls = d.classes.find((c) => c.id === spec.id)!;
      expect(cls, spec.id).toBeTruthy();
      expect(d.staff.find((s) => s.id === cls.tutorId)?.classIds).toContain(spec.id);
      expect(d.students.filter((s) => s.classId === spec.id).length).toBe(4);
      const subs = d.subjects.filter((s) => s.classId === spec.id);
      expect(subs.length).toBe(spec.subjects.length);
      for (const s of subs) expect(d.topics.some((t) => t.subjectId === s.id)).toBe(true);
      expect(d.periods.filter((p) => p.classId === spec.id).length).toBe(30);
    }
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

describe('access follows grade and board', () => {
  const actorOf = (loginId: string, role: 'student' | 'parent' | 'teacher') => signIn(loginId, TEST_PASSCODE, role);

  it('a CBSE Class 9 student sees only Class 9 CBSE subjects and real chapters', async () => {
    const me = await actorOf('stu.cbse9.01', 'student');
    const subs = learn.subjectsFor(me, me.id);
    expect(subs.map((s) => s.name).sort()).toEqual(['English', 'Mathematics', 'Science', 'Social Science']);
    const maths = subs.find((s) => s.name === 'Mathematics')!;
    const detail = learn.subjectDetail(me, me.id, maths.id);
    expect(detail.topics.map((t) => t.name)).toContain('Quadrilaterals');
  });

  it('a parent can open only their own child', async () => {
    const parent = await actorOf('par.igcse10.01', 'parent');
    const own = getDb().relationships.find((r) => r.guardianId === parent.id)!.studentId;
    expect(learn.subjectsFor(parent, own).length).toBeGreaterThan(0);
    const other = getDb().students.find((s) => s.classId === '10IG' && s.id !== own)!;
    expect(() => learn.subjectsFor(parent, other.id)).toThrow(AccessDenied);
  });

  it('a subject teacher sees only their own family and stage', async () => {
    const t = (await actorOf('tch.cbse.physics.upper', 'teacher')) as Actor;
    const mine = teach.mySubjects(t);
    expect(mine.length).toBeGreaterThan(0);
    for (const s of mine) expect(['11CBS', '12CBS']).toContain(s.classId);
    const cambridgePhysics = getDb().subjects.find((s) => s.classId === '12ASS' && s.name === 'Physics')!;
    expect(mine.some((s) => s.id === cambridgePhysics.id)).toBe(false);
  });

  it('students from different boards are not mixed in a roster', async () => {
    const t = (await actorOf('tch.cie-adv.physics.upper', 'teacher')) as Actor;
    expect(() => teach.classRoster(t, '9CB')).toThrow(AccessDenied);
    expect(teach.classRoster(t, '13ALS')).toBeTruthy();
  });
});

describe('login IDs', () => {
  it('rejects a wrong passcode and an unknown ID, and records each failure', async () => {
    const before = getDb().audit.length;
    await expect(signIn('stu.cbse9.01', 'nope', 'student')).rejects.toBeInstanceOf(SignInError);
    await expect(signIn('nobody', TEST_PASSCODE, 'student')).rejects.toBeInstanceOf(SignInError);
    expect(getDb().audit.length).toBe(before + 2);
    expect(getDb().audit[0].outcome).toBe('denied');
  });

  it('tells a person when their ID belongs to another role, only once the passcode is right', async () => {
    await expect(signIn('stu.cbse9.01', TEST_PASSCODE, 'teacher')).rejects.toMatchObject({ otherRole: 'student' });
    await expect(signIn('tch.cbse.physics.upper', TEST_PASSCODE, 'parent')).rejects.toMatchObject({ otherRole: 'teacher' });
    await expect(signIn('stu.cbse9.01', 'nope', 'teacher')).rejects.toMatchObject({ otherRole: undefined });
  });

  it('is not case sensitive on the ID, and lists accounts per role without hashes', async () => {
    expect((await signIn(' STU.CBSE9.01 ', TEST_PASSCODE, 'student')).kind).toBe('student');
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

describe('demo store size', () => {
  it('stays well under the browser localStorage quota', () => {
    const bytes = JSON.stringify(getDb()).length * 2; // UTF-16 in localStorage
    expect(bytes).toBeLessThan(3_500_000);
  });
});
