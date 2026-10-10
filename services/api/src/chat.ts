// Chat rooms for teachers, students and parents. Access follows the class: a teacher can talk to the
// students and parents of the sections they teach, a parent to the teachers of their child's section,
// a student to their own teachers and classmates. Teachers can also broadcast to a whole section.

import type { Actor, ChatMessage, ChatPartyKind } from '@school-intel/contracts';
import { AccessDenied, ValidationError, actorName, audit, linkedStudentIds } from './access';
import type { Db } from './db-types';
import { getDb, mutate, nextId, nowIso } from './store';

export type Audience = 'students' | 'parents' | 'both';

export interface Contact {
  key: string;
  kind: ChatPartyKind;
  id: string;
  name: string;
  detail: string;
}

export interface RoomSummary {
  roomId: string;
  title: string;
  subtitle: string;
  kind: 'class' | 'dm';
  last?: ChatMessage;
  unread: number;
}

const MAX_LEN = 1000;
const keyOf = (a: { kind: ChatPartyKind; id: string }) => `${a.kind}:${a.id}`;
const me = (actor: Actor) => keyOf(actor as { kind: ChatPartyKind; id: string });

/** Sections a person belongs to or teaches. */
function sectionsFor(d: Db, actor: Actor): string[] {
  const sectionIds = new Set(d.classes.map((c) => c.id));
  if (actor.kind === 'staff') return (d.staff.find((s) => s.id === actor.id)?.classIds ?? []).filter((c) => sectionIds.has(c));
  if (actor.kind === 'student') return [d.students.find((s) => s.id === actor.id)?.classId].filter((c): c is string => !!c);
  return [...new Set(linkedStudentIds(d, actor.id).map((id) => d.students.find((s) => s.id === id)?.classId).filter((c): c is string => !!c))];
}

const isTeacher = (d: Db, id: string) => {
  const s = d.staff.find((x) => x.id === id);
  return !!s && s.roles.includes('teacher');
};

/** Everyone this person is allowed to message directly. */
export function contacts(actor: Actor): Contact[] {
  const d = getDb();
  const out: Contact[] = [];
  const sections = sectionsFor(d, actor);
  const teachersOf = (classIds: string[]) => d.staff.filter((s) => s.roles.includes('teacher') && s.classIds.some((c) => classIds.includes(c)));
  if (actor.kind === 'staff') {
    const self = d.staff.find((s) => s.id === actor.id);
    if (self?.roles.includes('admin')) {
      for (const s of d.staff) if (s.id !== actor.id) out.push({ key: `staff:${s.id}`, kind: 'staff', id: s.id, name: s.name, detail: s.title });
      return out;
    }
    for (const st of d.students.filter((x) => sections.includes(x.classId))) {
      out.push({ key: `student:${st.id}`, kind: 'student', id: st.id, name: st.name, detail: `Student Â· Class ${st.classId}` });
    }
    for (const r of d.relationships) {
      const st = d.students.find((x) => x.id === r.studentId);
      const g = d.guardians.find((x) => x.id === r.guardianId);
      if (st && g && r.status === 'verified' && sections.includes(st.classId)) {
        out.push({ key: `guardian:${g.id}`, kind: 'guardian', id: g.id, name: g.name, detail: `Parent of ${st.firstName} Â· Class ${st.classId}` });
      }
    }
    for (const s of teachersOf(sections)) if (s.id !== actor.id) out.push({ key: `staff:${s.id}`, kind: 'staff', id: s.id, name: s.name, detail: s.title });
  } else {
    for (const s of teachersOf(sections)) out.push({ key: `staff:${s.id}`, kind: 'staff', id: s.id, name: s.name, detail: s.title });
    if (actor.kind === 'student') {
      for (const st of d.students.filter((x) => sections.includes(x.classId) && x.id !== actor.id)) {
        out.push({ key: `student:${st.id}`, kind: 'student', id: st.id, name: st.name, detail: `Classmate Â· Class ${st.classId}` });
      }
    }
  }
  const seen = new Set<string>();
  return out.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true))).sort((a, b) => a.name.localeCompare(b.name));
}

function partyName(d: Db, key: string): string {
  const [kind, id] = key.split(':') as [ChatPartyKind, string];
  return actorName(d, { kind: kind === 'student' ? 'student' : kind === 'guardian' ? 'guardian' : 'staff', id } as Actor);
}

function canUseRoom(d: Db, actor: Actor, roomId: string): boolean {
  if (roomId.startsWith('class:')) {
    const classId = roomId.slice(6);
    const self = actor.kind === 'staff' ? d.staff.find((s) => s.id === actor.id) : undefined;
    if (self?.roles.includes('admin')) return d.classes.some((c) => c.id === classId);
    return sectionsFor(d, actor).includes(classId);
  }
  if (roomId.startsWith('dm:')) {
    const parts = roomId.slice(3).split('|');
    return parts.length === 2 && parts.includes(me(actor));
  }
  return false;
}

function visible(_d: Db, actor: Actor, m: ChatMessage): boolean {
  if (!m.broadcast || m.broadcast.audience === 'both') return true;
  if (actor.kind === 'staff') return true;
  return (m.broadcast.audience === 'students') === (actor.kind === 'student');
}

function requireRoom(actor: Actor, roomId: string) {
  const d = getDb();
  if (!canUseRoom(d, actor, roomId)) {
    mutate((x) => audit(x, actor, 'Access denied', `Chat room ${roomId}`, 'denied'));
    throw new AccessDenied('You are not a member of this chat room.');
  }
  return d;
}

export function roomTitle(d: Db, actor: Actor, roomId: string): { title: string; subtitle: string } {
  if (roomId.startsWith('class:')) {
    const cls = d.classes.find((c) => c.id === roomId.slice(6));
    return { title: `Class ${cls?.id ?? roomId.slice(6)}`, subtitle: 'Teachers, students and parents of this section' };
  }
  const other = roomId.slice(3).split('|').find((k) => k !== me(actor)) ?? '';
  const c = contactDetail(d, other);
  return { title: partyName(d, other), subtitle: c };
}

function contactDetail(d: Db, key: string): string {
  const [kind, id] = key.split(':');
  if (kind === 'staff') return d.staff.find((s) => s.id === id)?.title ?? 'Staff';
  if (kind === 'student') return `Student Â· Class ${d.students.find((s) => s.id === id)?.classId ?? ''}`;
  const rel = d.relationships.find((r) => r.guardianId === id);
  const st = rel && d.students.find((s) => s.id === rel.studentId);
  return st ? `Parent of ${st.firstName} Â· Class ${st.classId}` : 'Parent';
}

const readAt = (d: Db, actor: Actor, roomId: string) => d.chatRead[me(actor)]?.[roomId] ?? '';

/** Rooms the person can open: their class rooms plus every direct conversation they are in. */
export function rooms(actor: Actor): RoomSummary[] {
  const d = getDb();
  const ids = new Set<string>();
  const self = actor.kind === 'staff' ? d.staff.find((s) => s.id === actor.id) : undefined;
  if (!self?.roles.includes('admin')) for (const c of sectionsFor(d, actor)) ids.add(`class:${c}`);
  for (const m of d.chat) if (m.roomId.startsWith('dm:') && canUseRoom(d, actor, m.roomId)) ids.add(m.roomId);
  const list: RoomSummary[] = [];
  for (const roomId of ids) {
    const msgs = d.chat.filter((m) => m.roomId === roomId && visible(d, actor, m));
    const read = readAt(d, actor, roomId);
    const { title, subtitle } = roomTitle(d, actor, roomId);
    list.push({
      roomId,
      title,
      subtitle,
      kind: roomId.startsWith('class:') ? 'class' : 'dm',
      last: msgs[msgs.length - 1],
      unread: msgs.filter((m) => m.at > read && me(actor) !== `${m.fromKind}:${m.fromId}`).length,
    });
  }
  return list.sort((a, b) => (b.last?.at ?? '').localeCompare(a.last?.at ?? '') || a.title.localeCompare(b.title));
}

export function unreadTotal(actor: Actor): number {
  return rooms(actor).reduce((n, r) => n + r.unread, 0);
}

export function messages(actor: Actor, roomId: string): ChatMessage[] {
  const d = requireRoom(actor, roomId);
  return d.chat.filter((m) => m.roomId === roomId && visible(d, actor, m)).slice(-200);
}

/** The room id for a direct conversation, after checking the two people may talk. */
export function directRoom(actor: Actor, contactKey: string): string {
  if (!contacts(actor).some((c) => c.key === contactKey)) {
    mutate((d) => audit(d, actor, 'Access denied', `Chat with ${contactKey}`, 'denied'));
    throw new AccessDenied('You cannot message this person.');
  }
  return `dm:${[me(actor), contactKey].sort().join('|')}`;
}

function clean(text: string): string {
  const t = text.trim().replace(/\s+\n/g, '\n');
  if (!t) throw new ValidationError('Write a message first.');
  if (t.length > MAX_LEN) throw new ValidationError(`Messages can be up to ${MAX_LEN} characters.`);
  return t;
}

function push(d: Db, actor: Actor, roomId: string, text: string, broadcast?: ChatMessage['broadcast']): ChatMessage {
  const msg: ChatMessage = {
    id: nextId(d, 'MSG', 'MSG', 5),
    roomId,
    fromKind: actor.kind as ChatPartyKind,
    fromId: actor.id,
    fromName: actorName(d, actor),
    text,
    at: nowIso(),
    ...(broadcast ? { broadcast } : {}),
  };
  d.chat.push(msg);
  const reads = (d.chatRead[me(actor)] ??= {});
  reads[roomId] = msg.at;
  return msg;
}

export function send(actor: Actor, roomId: string, text: string): ChatMessage {
  const body = clean(text);
  requireRoom(actor, roomId);
  return mutate((d) => push(d, actor, roomId, body));
}

/** A teacher writes to the students, the parents, or both, of one section they teach. */
export function broadcast(actor: Actor, classId: string, audience: Audience, text: string): ChatMessage {
  const body = clean(text);
  const d = getDb();
  const self = actor.kind === 'staff' ? d.staff.find((s) => s.id === actor.id) : undefined;
  if (!self || !self.roles.includes('teacher') || !self.classIds.includes(classId) || !d.classes.some((c) => c.id === classId)) {
    mutate((x) => audit(x, actor, 'Access denied', `Broadcast to ${classId}`, 'denied'));
    throw new AccessDenied('You can only send to a class you teach.');
  }
  return mutate((x) => {
    audit(x, actor, 'Class broadcast', `${classId} Â· ${audience}`);
    return push(x, actor, `class:${classId}`, body, { classId, audience });
  });
}

export function markRead(actor: Actor, roomId: string) {
  requireRoom(actor, roomId);
  mutate((d) => {
    (d.chatRead[me(actor)] ??= {})[roomId] = nowIso();
  });
}

/** Sections a teacher may broadcast to. */
export function broadcastTargets(actor: Actor): Array<{ classId: string; label: string; students: number }> {
  const d = getDb();
  if (actor.kind !== 'staff' || !isTeacher(d, actor.id)) return [];
  return sectionsFor(d, actor)
    .map((classId) => ({ classId, label: `Class ${classId}`, students: d.students.filter((s) => s.classId === classId).length }))
    .sort((a, b) => a.classId.localeCompare(b.classId, undefined, { numeric: true }));
}

/** Display name for a room the person can open. */
export function roomName(actor: Actor, roomId: string): string {
  return roomTitle(getDb(), actor, roomId).title;
}
