// Horizon Assistant: a rules-based, offline helper for students, parents, teachers and administrators.
// Every answer is built from the school database the person is allowed to see; nothing is sent to an
// external model. It says so when it cannot answer instead of guessing.

import type { Actor, Student } from '@school-intel/contracts';
import { linkedStudentIds, staffOf } from './access';
import { inClass } from './cohort';
import { getDb, nowIso } from './store';

export interface AssistantReply {
  text: string;
  bullets?: string[];
  materials?: Array<{ id: string; title: string; kind: string; subject: string }>;
  followUps: string[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const has = (q: string, ...words: RegExp[]) => words.some((w) => w.test(q));
const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

function today() {
  const iso = nowIso();
  const date = iso.slice(0, 10);
  return { date, day: new Date(`${date}T12:00:00Z`).getUTCDay() };
}

export function suggestionsFor(actor: Actor): string[] {
  if (actor.kind === 'student') return ['What is my attendance?', "What's my timetable today?", 'Find notes on fractions', 'When are my next exams?', 'How did I do in my tests?'];
  if (actor.kind === 'guardian') return ["How is my child's attendance?", 'What are the latest test scores?', 'Who teaches my child?', 'When are the exams?'];
  const admin = getDb().staff.find((s) => s.id === actor.id)?.roles.includes('admin');
  return admin
    ? ['Give me a school summary', 'Which classes have low attendance?', 'How many students are enrolled?', 'Find the login for a student']
    : ['Which classes do I teach?', 'Who is absent in my classes today?', 'Which students have low attendance?', 'Find sample papers for my class'];
}

function childrenOf(actor: Actor): Student[] {
  const d = getDb();
  if (actor.kind === 'student') return d.students.filter((s) => s.id === actor.id);
  if (actor.kind === 'guardian') return linkedStudentIds(d, actor.id).map((id) => d.students.find((s) => s.id === id)!).filter(Boolean);
  return [];
}

function attendanceLine(s: Student, you: boolean) {
  const d = getDb();
  const days = d.attendanceHistory[s.id] ?? [];
  const present = days.filter((x) => x.status === 'present' || x.status === 'late' || x.status === 'excused').length;
  const absent = days.filter((x) => x.status === 'absent').length;
  const late = days.filter((x) => x.status === 'late').length;
  const subject = you ? 'You have' : `${s.firstName} has`;
  if (!days.length) return `${you ? 'Your' : `${s.firstName}'s`} attendance has not been recorded yet.`;
  return `${subject} attended ${pct(present, days.length)}% of the last ${days.length} school days (${absent} absent, ${late} late).`;
}

function scoresLine(s: Student, you: boolean) {
  const card = getDb().scorecards[s.id] ?? [];
  if (!card.length) return [];
  const subs = new Map(getDb().subjects.map((x) => [x.id, x.name]));
  return card.map((e) => `${subs.get(e.subjectId) ?? 'Subject'} · ${e.exam}: ${e.marks}/${e.max}`).slice(0, you ? 12 : 12);
}

function materialsFor(student: Student | undefined, query: string, kind?: string) {
  const d = getDb();
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const subjects = student ? d.subjects.filter((x) => inClass(x.classId, student.classId)) : d.subjects;
  const subjectIds = new Set(subjects.map((x) => x.id));
  const names = new Map(subjects.map((x) => [x.id, x.name]));
  const topicName = new Map(d.topics.map((t) => [t.id, t.name.toLowerCase()]));
  const scored: Array<{ m: (typeof d.materials)[number]; score: number }> = [];
  for (const m of d.materials) {
    if (!subjectIds.has(m.subjectId) || m.status !== 'published') continue;
    if (kind && m.kind !== kind) continue;
    const hay = `${m.title} ${topicName.get(m.topicId) ?? ''} ${names.get(m.subjectId)}`.toLowerCase();
    const score = terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
    if (score > 0) scored.push({ m, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ m }) => ({ id: m.id, title: m.title, kind: m.kind, subject: names.get(m.subjectId) ?? '' }));
}

const STOP = new Set(['find', 'show', 'notes', 'note', 'the', 'for', 'and', 'about', 'on', 'me', 'get', 'study', 'material', 'materials', 'sample', 'paper', 'papers', 'worksheet', 'worksheets', 'revision', 'textbook', 'chapter', 'with', 'please', 'any', 'some', 'what', 'how']);

function kindOf(q: string): string | undefined {
  if (/sample|question paper|previous year/.test(q)) return 'sample-paper';
  if (/worksheet|practice/.test(q)) return 'worksheet';
  if (/revision|revise/.test(q)) return 'revision';
  if (/textbook|ncert/.test(q)) return 'textbook';
  if (/notes?/.test(q)) return 'notes';
  return undefined;
}

function studentReply(actor: Actor, q: string): AssistantReply | undefined {
  const d = getDb();
  const kids = childrenOf(actor);
  if (!kids.length) return undefined;
  const you = actor.kind === 'student';
  const t = today();
  const lines: string[] = [];
  const bullets: string[] = [];

  if (has(q, /attend|absent|present|late\b/)) {
    for (const s of kids) lines.push(attendanceLine(s, you));
    return { text: lines.join(' '), followUps: ['What are the latest test scores?', "What's the timetable today?"] };
  }
  if (has(q, /timetable|schedule|period|today|tomorrow|class(es)? today/)) {
    for (const s of kids) {
      const subs = new Map(d.subjects.map((x) => [x.id, x.name]));
      const periods = d.periods.filter((p) => p.classId === s.classId && p.day === t.day).sort((a, b) => a.start.localeCompare(b.start));
      if (!periods.length) lines.push(`${DAYS[t.day]} has no lessons for Class ${s.classId}.`);
      else {
        lines.push(`${you ? 'Your' : `${s.firstName}'s`} ${DAYS[t.day]} timetable (Class ${s.classId}):`);
        for (const p of periods) bullets.push(`${p.start}–${p.end} · ${subs.get(p.subjectId) ?? 'Lesson'} · Room ${p.room}`);
      }
    }
    return { text: lines.join(' '), bullets, followUps: ['When are my next exams?', 'What homework is due?'] };
  }
  if (has(q, /exam|test|assessment|date ?sheet/) && !has(q, /score|mark|result|grade|did i do|how did/)) {
    const names = new Map(d.subjects.map((x) => [x.id, x.name]));
    for (const s of kids) {
      const events = d.examEvents.filter((e) => inClass(e.classId, s.classId) && e.date >= t.date).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
      if (!events.length) lines.push('No upcoming exams are scheduled.');
      for (const e of events) bullets.push(`${e.date} · ${names.get(e.subjectId) ?? ''} — ${e.title}`);
    }
    return { text: bullets.length ? 'Upcoming exams and tests:' : lines.join(' '), bullets, followUps: ['Find sample papers', 'What is my attendance?'] };
  }
  if (has(q, /score|mark|result|grade|report|performance|did i do|how did/)) {
    for (const s of kids) {
      const rows = scoresLine(s, you);
      lines.push(rows.length ? `Recent results for ${you ? 'you' : s.firstName}:` : `No results are recorded yet for ${you ? 'you' : s.firstName}.`);
      bullets.push(...rows);
    }
    return { text: lines.join(' '), bullets, followUps: ['Find revision sheets', 'What is my attendance?'] };
  }
  if (has(q, /homework|assignment|due|submit/)) {
    for (const s of kids) {
      const items = d.assignments.filter((a) => a.classId === s.classId && a.due.slice(0, 10) >= t.date).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8);
      for (const a of items) bullets.push(`${a.due.slice(0, 10)} · ${a.subject} — ${a.title}`);
    }
    return { text: bullets.length ? 'Homework and assignments coming up:' : 'There is no homework due right now.', bullets, followUps: ["What's my timetable today?"] };
  }
  if (has(q, /teacher|who teaches|taught by/)) {
    for (const s of kids) {
      for (const sub of d.subjects.filter((x) => inClass(x.classId, s.classId))) {
        const tch = d.staff.find((x) => x.id === sub.teacherId);
        if (tch) bullets.push(`${sub.name} · ${tch.name}`);
      }
    }
    return { text: 'Subject teachers:', bullets, followUps: ['How do I message a teacher? Open the Chat tab.'] };
  }
  return undefined;
}

function materialReply(actor: Actor, q: string): AssistantReply | undefined {
  const kids = childrenOf(actor);
  const kind = kindOf(q);
  if (!kind && !has(q, /find|search|explain|chapter|topic|help me|study|learn|material|what is|how (do|does|to)/)) return undefined;
  const list = materialsFor(kids[0], q, kind);
  if (!list.length) return undefined;
  return {
    text: `I found ${list.length} study ${list.length === 1 ? 'resource' : 'resources'} that match. Open one from the Learn section.`,
    materials: list,
    followUps: ['Find a sample paper', 'Find revision sheets'],
  };
}

function teacherReply(actor: Actor, q: string): AssistantReply | undefined {
  const d = getDb();
  const me = staffOf(actor, d);
  const admin = me.roles.includes('admin');
  const t = today();
  const sections = d.classes.filter((c) => (admin ? true : me.classIds.includes(c.id)));
  const rateOf = (id: string) => {
    const days = d.attendanceHistory[id] ?? [];
    return days.length ? pct(days.filter((x) => x.status !== 'absent').length, days.length) : 100;
  };

  if (admin && has(q, /summary|overview|stats|statistics|school/)) {
    const rates = d.students.map((s) => rateOf(s.id));
    const avg = Math.round(rates.reduce((a, b) => a + b, 0) / Math.max(1, rates.length));
    return {
      text: 'School summary:',
      bullets: [`${d.students.length} students in ${d.classes.length} sections`, `${d.staff.filter((s) => s.roles.includes('teacher')).length} teachers`, `${d.guardians.length} parent accounts`, `${d.materials.length} study materials and ${d.questions.length} quiz questions`, `Average attendance ${avg}%`, `${d.students.filter((s) => rateOf(s.id) < 85).length} students below 85% attendance`],
      followUps: ['Which classes have low attendance?', 'How many students are enrolled?'],
    };
  }
  if (admin && has(q, /enrol|how many students|strength/)) {
    const by = new Map<number, number>();
    for (const s of d.students) by.set(s.yearGroup, (by.get(s.yearGroup) ?? 0) + 1);
    return { text: `${d.students.length} students are enrolled:`, bullets: [...by.entries()].sort((a, b) => a[0] - b[0]).map(([g, n]) => `Class ${g}: ${n} students`), followUps: ['Give me a school summary'] };
  }
  if (has(q, /login|credential|password|account/)) {
    if (!admin) return { text: 'Only administrators can look up logins. Ask the school office.', followUps: [] };
    const name = q.replace(/.*(login|credentials?|account)( for| of)?/, '').trim();
    return { text: 'Use Admin → Accounts to search by name or class and export credentials. I never show passcodes.', bullets: name.length > 2 ? d.students.filter((s) => s.name.toLowerCase().includes(name)).slice(0, 5).map((s) => `${s.name} · Class ${s.classId} · login stu.${s.classId.toLowerCase()}.${(s.rollNo ?? '').toString().padStart(2, '0')}`) : undefined, followUps: [] };
  }
  if (has(q, /which classes|my classes|teach\b/)) {
    return { text: admin ? `The school has ${sections.length} sections.` : `You teach ${sections.length} sections:`, bullets: admin ? undefined : sections.map((c) => `Class ${c.id} · ${d.students.filter((s) => s.classId === c.id).length} students`), followUps: ['Who is absent in my classes today?'] };
  }
  if (has(q, /absent|absentee|not in school/)) {
    const mine = new Set(sections.map((c) => c.id));
    const out = d.students.filter((s) => mine.has(s.classId) && (d.attendanceHistory[s.id] ?? []).some((x) => x.date === t.date && x.status === 'absent'));
    return { text: out.length ? `${out.length} students are marked absent today:` : 'No absences are recorded for today in your classes.', bullets: out.slice(0, 15).map((s) => `${s.name} · Class ${s.classId}`), followUps: ['Which students have low attendance?'] };
  }
  if (has(q, /low attendance|below|poor attendance|attendance/)) {
    const mine = new Set(sections.map((c) => c.id));
    if (admin && has(q, /class(es)?/)) {
      const rows = sections.map((c) => {
        const ids = d.students.filter((s) => s.classId === c.id).map((s) => rateOf(s.id));
        return { id: c.id, avg: Math.round(ids.reduce((a, b) => a + b, 0) / Math.max(1, ids.length)) };
      }).sort((a, b) => a.avg - b.avg).slice(0, 8);
      return { text: 'Sections with the lowest average attendance:', bullets: rows.map((r) => `Class ${r.id} · ${r.avg}%`), followUps: ['Give me a school summary'] };
    }
    const low = d.students.filter((s) => mine.has(s.classId)).map((s) => ({ s, r: rateOf(s.id) })).filter((x) => x.r < 85).sort((a, b) => a.r - b.r).slice(0, 12);
    return { text: low.length ? 'Students under 85% attendance:' : 'Every student in your classes is at 85% or above.', bullets: low.map((x) => `${x.s.name} · Class ${x.s.classId} · ${x.r}%`), followUps: ['Who is absent in my classes today?'] };
  }
  if (has(q, /sample|worksheet|revision|notes|textbook|find/)) {
    const names = new Map(d.subjects.map((x) => [x.id, x.name]));
    const kind = kindOf(q);
    const classes = new Set(me.classIds);
    const terms = q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
    const found = d.materials.filter((m) => {
      const sub = d.subjects.find((x) => x.id === m.subjectId);
      if (!sub || !(admin || classes.has(sub.classId) || me.classIds.some((c) => inClass(sub.classId, c)))) return false;
      if (kind && m.kind !== kind) return false;
      return terms.every((w) => `${m.title} ${names.get(m.subjectId)}`.toLowerCase().includes(w));
    }).slice(0, 6);
    if (found.length) return { text: `Found ${found.length} resources:`, materials: found.map((m) => ({ id: m.id, title: m.title, kind: m.kind, subject: names.get(m.subjectId) ?? '' })), followUps: [] };
  }
  return undefined;
}

/** Answer one question from the person's own data. */
export function ask(actor: Actor, question: string): AssistantReply {
  const q = question.trim().toLowerCase().slice(0, 300);
  if (!q) return { text: 'Ask me about attendance, timetable, exams, results or study materials.', followUps: suggestionsFor(actor) };
  if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(q)) {
    return { text: 'Hello! I can answer from your school records. Try one of these.', followUps: suggestionsFor(actor) };
  }
  if (/thank/.test(q)) return { text: 'You are welcome!', followUps: suggestionsFor(actor) };
  if (/message|chat|contact/.test(q) && /teacher|parent|student|class/.test(q)) {
    return { text: 'Open the Chat tab to message people or, as a teacher, to send a message to a whole class.', followUps: suggestionsFor(actor) };
  }
  const reply = actor.kind === 'staff' ? teacherReply(actor, q) ?? materialReply(actor, q) : studentReply(actor, q) ?? materialReply(actor, q);
  if (reply) return reply;
  return {
    text: "I can only answer from your school's records, and I couldn't match that. Try asking about attendance, timetable, exams, results or a study topic.",
    followUps: suggestionsFor(actor),
  };
}
