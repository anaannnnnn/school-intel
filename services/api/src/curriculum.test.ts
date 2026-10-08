// Real-syllabus data for Grades 9 to 13: catalogue integrity, people and access.
import { beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '@school-intel/contracts';
import { AccessDenied } from './access';
import { DEMO_PASSCODE, SignInError, demoAccounts, signInWithLoginId } from './auth';
import * as learn from './learn';
import * as teach from './teach';
import { CLASS_SPECS, catalogue, findCourse } from './seed-curriculum';
import { getDb, resetDemo } from './store';

beforeEach(() => resetDemo());

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
    expect(new Set(d.accounts.map((a) => a.loginId)).size).toBe(d.accounts.length);
    for (const a of d.accounts) {
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
  const actorOf = (loginId: string, surface: 'family' | 'staff') => signInWithLoginId(loginId, DEMO_PASSCODE, surface);

  it('a CBSE Class 9 student sees only Class 9 CBSE subjects and real chapters', () => {
    const me = actorOf('stu.cbse9.01', 'family');
    const subs = learn.subjectsFor(me, me.id);
    expect(subs.map((s) => s.name).sort()).toEqual(['English', 'Mathematics', 'Science', 'Social Science']);
    const maths = subs.find((s) => s.name === 'Mathematics')!;
    const detail = learn.subjectDetail(me, me.id, maths.id);
    expect(detail.topics.map((t) => t.name)).toContain('Quadrilaterals');
  });

  it('a parent can open only their own child', () => {
    const parent = actorOf('par.igcse10.01', 'family');
    const own = getDb().relationships.find((r) => r.guardianId === parent.id)!.studentId;
    expect(learn.subjectsFor(parent, own).length).toBeGreaterThan(0);
    const other = getDb().students.find((s) => s.classId === '10IG' && s.id !== own)!;
    expect(() => learn.subjectsFor(parent, other.id)).toThrow(AccessDenied);
  });

  it('a subject teacher sees only their own family and stage', () => {
    const t = actorOf('tch.cbse.physics.upper', 'staff') as Actor;
    const mine = teach.mySubjects(t);
    expect(mine.length).toBeGreaterThan(0);
    for (const s of mine) expect(['11CBS', '12CBS']).toContain(s.classId);
    const cambridgePhysics = getDb().subjects.find((s) => s.classId === '12ASS' && s.name === 'Physics')!;
    expect(mine.some((s) => s.id === cambridgePhysics.id)).toBe(false);
  });

  it('students from different boards are not mixed in a roster', () => {
    const t = actorOf('tch.cie-adv.physics.upper', 'staff') as Actor;
    expect(() => teach.classRoster(t, '9CB')).toThrow(AccessDenied);
    expect(teach.classRoster(t, '13ALS')).toBeTruthy();
  });
});

describe('login IDs', () => {
  it('rejects a wrong passcode, an unknown ID and the wrong surface, and records each failure', () => {
    const before = getDb().audit.length;
    expect(() => signInWithLoginId('stu.cbse9.01', 'nope', 'family')).toThrow(SignInError);
    expect(() => signInWithLoginId('nobody', DEMO_PASSCODE, 'family')).toThrow(SignInError);
    expect(() => signInWithLoginId('stu.cbse9.01', DEMO_PASSCODE, 'staff')).toThrow(SignInError);
    expect(() => signInWithLoginId('tch.cbse.physics.upper', DEMO_PASSCODE, 'family')).toThrow(SignInError);
    expect(getDb().audit.length).toBe(before + 4);
    expect(getDb().audit[0].outcome).toBe('denied');
  });

  it('is not case sensitive on the ID and lists accounts per surface', () => {
    expect(signInWithLoginId(' STU.CBSE9.01 ', DEMO_PASSCODE, 'family').kind).toBe('student');
    expect(demoAccounts('staff').every((a) => a.kind === 'staff')).toBe(true);
    expect(demoAccounts('family').every((a) => a.kind !== 'staff')).toBe(true);
  });
});

describe('demo store size', () => {
  it('stays well under the browser localStorage quota', () => {
    const bytes = JSON.stringify(getDb()).length * 2; // UTF-16 in localStorage
    expect(bytes).toBeLessThan(3_500_000);
  });
});
