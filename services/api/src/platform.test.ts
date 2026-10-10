import { beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '@school-intel/contracts';
import { AccessDenied } from './access';
import * as admin from './admin';
import * as assistant from './assistant';
import * as chat from './chat';
import { signIn } from './auth';
import { TEST_PASSCODE } from './test-setup';
import { resetData } from './store';

beforeEach(() => resetData());
const as = (id: string, role: 'student' | 'parent' | 'teacher') => signIn(id, TEST_PASSCODE, role) as Promise<Actor>;

describe('chat rooms', () => {
  it('lets a teacher message a parent and student of a class they teach, and the parent reply', async () => {
    const t = await as('tch.mathematics.g9', 'teacher');
    const p = await as('par.9a.01', 'parent');
    const contact = chat.contacts(t).find((c) => c.key === `guardian:${p.id}`);
    expect(contact).toBeTruthy();
    const room = chat.directRoom(t, contact!.key);
    chat.send(t, room, 'Please review chapter 3 with Kunal.');
    expect(chat.rooms(p).find((r) => r.roomId === room)?.unread).toBe(1);
    chat.send(p, room, 'Thank you, we will.');
    expect(chat.messages(t, room).map((m) => m.fromKind)).toEqual(['staff', 'guardian']);
    chat.markRead(p, room);
    expect(chat.rooms(p).find((r) => r.roomId === room)?.unread).toBe(0);
  });

  it('does not allow messaging outside a teacher\'s own classes', async () => {
    const t = await as('tch.mathematics.g9', 'teacher');
    const stranger = await as('par.1a.01', 'parent');
    expect(() => chat.directRoom(t, `guardian:${stranger.id}`)).toThrow(AccessDenied);
    const p = await as('par.1a.01', 'parent');
    expect(() => chat.messages(p, 'class:9A')).toThrow(AccessDenied);
  });

  it('lets a parent reach only the teachers of their child', async () => {
    const p = await as('par.9a.01', 'parent');
    const names = chat.contacts(p);
    expect(names.length).toBeGreaterThan(3);
    expect(names.every((c) => c.kind === 'staff')).toBe(true);
  });

  it('broadcasts to a class audience only', async () => {
    const t = await as('tch.mathematics.g9', 'teacher');
    const s = await as('stu.9a.01', 'student');
    const p = await as('par.9a.01', 'parent');
    chat.broadcast(t, '9A', 'parents', 'Parent meeting on Saturday.');
    expect(chat.messages(p, 'class:9A').some((m) => m.broadcast)).toBe(true);
    expect(chat.messages(s, 'class:9A').some((m) => m.broadcast)).toBe(false);
    chat.broadcast(t, '9A', 'both', 'Quiz tomorrow.');
    expect(chat.messages(s, 'class:9A').length).toBe(1);
    expect(() => chat.broadcast(t, '2A', 'both', 'hello')).toThrow(AccessDenied);
    expect(() => chat.broadcast(s, '9A', 'both', 'hi')).toThrow(AccessDenied);
    expect(() => chat.send(t, 'class:9A', '   ')).toThrow();
  });
});

describe('assistant', () => {
  it('answers a student from their own attendance and timetable', async () => {
    const s = await as('stu.9a.01', 'student');
    expect(assistant.ask(s, 'What is my attendance?').text).toMatch(/attended \d+%/);
    expect(assistant.ask(s, 'Find sample papers for mathematics').materials?.length).toBeGreaterThan(0);
    expect(assistant.ask(s, 'zzz qqq').text).toMatch(/couldn't match/);
  });
  it('answers a teacher and an administrator', async () => {
    const t = await as('tch.mathematics.g9', 'teacher');
    expect(assistant.ask(t, 'Which classes do I teach?').bullets?.length).toBeGreaterThan(3);
    const a = await as('adm.rajesh', 'teacher');
    expect(assistant.ask(a, 'Give me a school summary').bullets?.[0]).toMatch(/students/);
  });
});

describe('admin console', () => {
  it('is available to administrators only', async () => {
    const a = await as('adm.rajesh', 'teacher');
    const o = admin.overview(a);
    expect(o.students).toBeGreaterThan(1200);
    expect(admin.students(a, { classId: '9A' }).length).toBeGreaterThanOrEqual(20);
    expect(admin.accounts(a, { q: 'stu.9a.01' })[0]).not.toHaveProperty('passwordHash');
    expect(admin.accountsCsv(a)).toContain('stu.9a.01');
    const t = await as('tch.mathematics.g9', 'teacher');
    expect(() => admin.overview(t)).toThrow(AccessDenied);
    const s = await as('stu.9a.01', 'student');
    expect(() => admin.accounts(s)).toThrow(AccessDenied);
  });
});
