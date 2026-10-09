// Student and family learning API: study materials, the AI study helper,
// quizzes, tests, past papers, exam preparation, written work and records.
// Guardians see released results and records for verified children only;
// tests, practice and the study helper are for the student themself.

import type { Actor, Assessment, Attempt, AttemptItem, Doubt, Presence, Question, Student } from '@school-intel/contracts';
import { AccessDenied, audit, requireFamilyAccess, ValidationError } from './access';
import * as ai from './ai';
import { DEMO_DATE } from './constants';
import type { Db } from './db-types';
import { getDb, mutate, nextId, nowIso } from './store';

/** UAE MoE guidance: no generative AI study tools below Grade 7 (age 13). */
export const MIN_AI_YEAR = 7;

/** Timed past-paper practice allows four minutes per question. */
export const PAPER_MIN_PER_Q = 4;

const staffName = (d: Db, id: string) => d.staff.find((s) => s.id === id)?.name ?? id;

function requireStudentSelf(actor: Actor, target: string): Student {
  if (actor.kind !== 'student') {
    mutate((d) => audit(d, actor, 'Access denied', target, 'denied'));
    throw new AccessDenied('Only the student can do this from their own account.');
  }
  return requireFamilyAccess(actor, actor.id);
}

function minutesBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

const dayOfWeek = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
};

function pct(got: number, max: number) {
  return max ? Math.round((got / max) * 100) : 0;
}

export function attemptScore(a: Pick<Attempt, 'items'>) {
  const max = a.items.reduce((n, i) => n + i.max, 0);
  const got = a.items.reduce((n, i) => n + (i.awarded ?? 0), 0);
  return { got, max, pct: pct(got, max) };
}

// ---------- Subjects, topics and materials ----------

export function subjectsFor(actor: Actor, studentId: string) {
  const st = requireFamilyAccess(actor, studentId);
  const d = getDb();
  const scores = ai.topicScores(d.attempts.filter((a) => a.studentId === studentId && a.status === 'released'), d.questions);
  return d.subjects
    .filter((s) => s.classId === st.classId)
    .map((s) => {
      const topics = d.topics.filter((t) => t.subjectId === s.id);
      const sc = scores.filter((x) => topics.some((t) => t.id === x.topicId));
      const mastery = sc.length ? Math.round(sc.reduce((n, x) => n + x.pct, 0) / sc.length) : undefined;
      const next = d.examEvents.filter((e) => e.subjectId === s.id && e.date.slice(0, 10) >= DEMO_DATE).sort((a, b) => a.date.localeCompare(b.date))[0];
      return {
        ...s,
        teacher: staffName(d, s.teacherId),
        topicCount: topics.length,
        materialCount: d.materials.filter((m) => m.subjectId === s.id && m.status === 'published').length,
        mastery,
        nextExam: next,
      };
    });
}

export function subjectDetail(actor: Actor, studentId: string, subjectId: string) {
  const subject = subjectsFor(actor, studentId).find((s) => s.id === subjectId);
  if (!subject) throw new AccessDenied('This subject is not on your timetable.');
  const d = getDb();
  const scores = ai.topicScores(d.attempts.filter((a) => a.studentId === studentId && a.status === 'released'), d.questions);
  return {
    subject,
    topics: d.topics
      .filter((t) => t.subjectId === subjectId)
      .sort((a, b) => a.order - b.order)
      .map((t) => ({
        ...t,
        score: scores.find((x) => x.topicId === t.id),
        materials: d.materials.filter((m) => m.topicId === t.id && m.status === 'published'),
        practice: d.questions.filter((q) => q.topicId === t.id && q.status === 'approved' && !q.paperId && q.type !== 'short').length,
      })),
  };
}

export function material(actor: Actor, studentId: string, id: string) {
  const st = requireFamilyAccess(actor, studentId);
  const d = getDb();
  const m = d.materials.find((x) => x.id === id && x.status === 'published');
  const subj = m && d.subjects.find((s) => s.id === m.subjectId);
  if (!m || !subj || subj.classId !== st.classId) throw new AccessDenied('This material is not shared with your class.');
  return { material: m, subject: subj, topic: d.topics.find((t) => t.id === m.topicId), teacher: staffName(d, m.createdBy) };
}

/** Revision cards or a simpler reading level, generated on request and not stored. */
export function materialAssist(actor: Actor, studentId: string, id: string, mode: 'cards' | 'simple') {
  const { material: m } = material(actor, studentId, id);
  const st = getDb().students.find((s) => s.id === studentId)!;
  if (st.yearGroup < MIN_AI_YEAR) throw new ValidationError('AI study tools are available from Year 7.');
  return mode === 'cards' ? ai.revisionCards(m) : ai.simplify(m);
}

// ---------- Timetable ----------

export function timetableFor(actor: Actor, studentId: string, date = DEMO_DATE) {
  const st = requireFamilyAccess(actor, studentId);
  const d = getDb();
  const dow = dayOfWeek(date);
  const now = nowIso().slice(11, 16);
  return d.periods
    .filter((p) => p.classId === st.classId && p.day === dow)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((p) => {
      const reg = date === DEMO_DATE ? d.lessonRegisters.find((r) => r.periodId === p.id && r.date === date) : undefined;
      const subj = d.subjects.find((s) => s.id === p.subjectId)!;
      return {
        ...p,
        subject: subj,
        teacher: staffName(d, subj.teacherId),
        presence: reg?.status === 'submitted' ? reg.marks[studentId] : undefined,
        state: date !== DEMO_DATE ? 'later' : now >= p.end ? 'done' : now >= p.start ? 'now' : 'later',
      } as const;
    });
}

export function weekTimetable(actor: Actor, studentId: string) {
  const st = requireFamilyAccess(actor, studentId);
  const d = getDb();
  return [1, 2, 3, 4, 5].map((day) => ({
    day,
    periods: d.periods
      .filter((p) => p.classId === st.classId && p.day === day)
      .map((p) => ({ ...p, subject: d.subjects.find((s) => s.id === p.subjectId)! })),
  }));
}

// ---------- Quizzes and tests ----------

type Visible = Omit<Question, 'answer' | 'explanation' | 'rubric'> & { answer?: string; explanation?: string; rubric?: Question['rubric'] };

function hideAnswers(q: Question): Visible {
  const { answer: _a, explanation: _e, rubric, ...rest } = q;
  return { ...rest, rubric: rubric?.map((r) => ({ ...r, keywords: [] })) };
}

export function assessmentsFor(actor: Actor, studentId: string) {
  const st = requireFamilyAccess(actor, studentId);
  const d = getDb();
  const mine = d.assessments.filter((a) => a.classId === st.classId && a.status !== 'draft' && (a.kind !== 'mock' || a.createdBy === studentId));
  const rows = mine.map((a) => {
    const attempt = d.attempts.filter((x) => x.assessmentId === a.id && x.studentId === studentId).sort((x, y) => y.startedAt.localeCompare(x.startedAt))[0];
    const subject = d.subjects.find((s) => s.id === a.subjectId)!;
    const score = attempt && attempt.status === 'released' ? attemptScore(attempt) : undefined;
    return { ...a, subject, attempt, score, questionCount: a.questionIds.length };
  });
  return {
    todo: rows.filter((r) => r.status === 'open' && (!r.attempt || r.attempt.status === 'in-progress') && r.kind !== 'mock'),
    upcoming: rows.filter((r) => r.status === 'scheduled'),
    done: rows.filter((r) => r.attempt && r.attempt.status !== 'in-progress').sort((a, b) => (b.attempt!.submittedAt ?? '').localeCompare(a.attempt!.submittedAt ?? '')),
  };
}

export function activeTest(actor: Actor): Attempt | undefined {
  if (actor.kind !== 'student') return undefined;
  const d = getDb();
  return d.attempts.find((a) => a.studentId === actor.id && a.status === 'in-progress' && d.assessments.find((x) => x.id === a.assessmentId)?.kind === 'test');
}

export function startAttempt(actor: Actor, assessmentId: string): Attempt {
  const st = requireStudentSelf(actor, `Assessment ${assessmentId}`);
  const d = getDb();
  const a = d.assessments.find((x) => x.id === assessmentId && x.classId === st.classId);
  if (!a || (a.kind === 'mock' && a.createdBy !== st.id)) throw new AccessDenied('This assessment is not set for your class.');
  if (a.status !== 'open') throw new ValidationError(a.status === 'scheduled' ? 'This test has not opened yet.' : 'This assessment is closed.');
  const existing = d.attempts.find((x) => x.assessmentId === a.id && x.studentId === st.id);
  if (existing && (existing.status === 'in-progress' || a.kind === 'test')) return existing;
  return mutate((db) => {
    const at: Attempt = {
      id: nextId(db, 'AT', 'AT'),
      assessmentId: a.id,
      studentId: st.id,
      startedAt: nowIso(),
      status: 'in-progress',
      items: a.questionIds.map((qid) => ({ questionId: qid, answer: '', max: db.questions.find((q) => q.id === qid)!.marks, status: 'auto' })),
    };
    db.attempts.push(at);
    audit(db, actor, a.kind === 'test' ? 'Started test' : 'Started practice', a.id);
    return at;
  });
}

function ownAttempt(actor: Actor, attemptId: string) {
  const d = getDb();
  const at = d.attempts.find((x) => x.id === attemptId);
  if (!at) throw new AccessDenied('Attempt not found.');
  requireFamilyAccess(actor, at.studentId);
  const a = d.assessments.find((x) => x.id === at.assessmentId)!;
  return { at, a, d };
}

export function deadlineOf(at: Attempt, a: Assessment): string | undefined {
  if (!a.durationMin) return a.closesAt;
  const end = new Date(new Date(at.startedAt).getTime() + a.durationMin * 60000);
  const byDuration = end.toISOString();
  if (a.closesAt && new Date(a.closesAt) < end) return a.closesAt;
  return byDuration;
}

export function player(actor: Actor, attemptId: string) {
  const { at, a, d } = ownAttempt(actor, attemptId);
  if (actor.kind !== 'student') throw new AccessDenied('Only the student can open their test.');
  if (at.status !== 'in-progress') throw new ValidationError('This attempt has been submitted.');
  return {
    attempt: at,
    assessment: a,
    subject: d.subjects.find((s) => s.id === a.subjectId)!,
    questions: a.questionIds.map((id) => hideAnswers(d.questions.find((q) => q.id === id)!)),
    deadline: deadlineOf(at, a),
  };
}

export function saveAnswer(actor: Actor, attemptId: string, questionId: string, answer: string) {
  const { at } = ownAttempt(actor, attemptId);
  if (actor.kind !== 'student' || at.status !== 'in-progress') throw new ValidationError('This attempt can no longer be changed.');
  mutate((d) => {
    const item = d.attempts.find((x) => x.id === attemptId)!.items.find((i) => i.questionId === questionId);
    if (item) item.answer = answer.slice(0, 4000);
  });
}

/** Objective answers are marked straight away; written answers get AI-suggested marks for the teacher. */
export function submitAttempt(actor: Actor, attemptId: string) {
  const { at, a } = ownAttempt(actor, attemptId);
  if (actor.kind !== 'student') throw new AccessDenied('Only the student can submit.');
  if (at.status !== 'in-progress') return at;
  return mutate((d) => {
    const x = d.attempts.find((y) => y.id === attemptId)!;
    x.items = x.items.map((it): AttemptItem => {
      const q = d.questions.find((qq) => qq.id === it.questionId)!;
      if (q.type === 'short') {
        const r = ai.suggestRubricMarks(it.answer, q.rubric ?? []);
        return { ...it, awarded: undefined, status: 'ai-suggested', suggestions: r.suggestions, confidence: r.confidence };
      }
      const m = ai.markObjective(q, it.answer);
      return { ...it, awarded: m.awarded, correct: m.correct, status: 'auto' };
    });
    x.submittedAt = nowIso();
    const needsTeacher = x.items.some((i) => i.status === 'ai-suggested');
    if (needsTeacher) x.status = 'submitted';
    else x.status = a.kind !== 'test' || a.resultsReleased ? 'released' : 'marked';
    if (needsTeacher) {
      const subj = d.subjects.find((s) => s.id === a.subjectId)!;
      d.notifications.unshift({ id: nextId(d, 'N', 'n'), audience: { kind: 'staff', id: subj.teacherId }, title: 'Written answer to confirm', body: `${d.students.find((s) => s.id === x.studentId)?.name} · ${a.title}`, at: nowIso(), read: false, link: '/marking' });
    }
    audit(d, actor, a.kind === 'test' ? 'Submitted test' : 'Submitted practice', a.id);
    return x;
  });
}

export function attemptResult(actor: Actor, attemptId: string) {
  const { at, a, d } = ownAttempt(actor, attemptId);
  const released = at.status === 'released';
  return {
    attempt: at,
    assessment: a,
    subject: d.subjects.find((s) => s.id === a.subjectId)!,
    released,
    score: released ? attemptScore(at) : undefined,
    items: released
      ? at.items.map((it) => {
          const q = d.questions.find((qq) => qq.id === it.questionId)!;
          return { item: it, question: q, note: q.type === 'numeric' && !it.correct ? ai.markObjective(q, it.answer).note : undefined };
        })
      : [],
    pending: at.status === 'submitted' ? 'Your teacher is checking your written answer.' : at.status === 'marked' ? 'Marked. Results are released when the whole class has finished.' : undefined,
  };
}

/** Practice on a topic: a short quiz built from approved questions, scored instantly. */
export function startTopicPractice(actor: Actor, topicId: string) {
  const st = requireStudentSelf(actor, `Practice ${topicId}`);
  const d = getDb();
  const topic = d.topics.find((t) => t.id === topicId);
  const subj = topic && d.subjects.find((s) => s.id === topic.subjectId && s.classId === st.classId);
  if (!topic || !subj) throw new AccessDenied('This topic is not in your subjects.');
  const qids = ai.buildPaper({ subjectId: subj.id, topicIds: [topicId], count: 5, includeWritten: false }, d.questions.filter((q) => !q.paperId), `${st.id}:${d.attempts.length}`);
  if (!qids.length) throw new ValidationError('No practice questions are ready for this topic yet.');
  return createPractice(actor, st, { title: `Practice · ${topic.name}`, subjectId: subj.id, questionIds: qids });
}

export function startPastPaper(actor: Actor, paperId: string) {
  const st = requireStudentSelf(actor, `Past paper ${paperId}`);
  const d = getDb();
  const p = d.pastPapers.find((x) => x.id === paperId);
  const subj = p && d.subjects.find((s) => s.id === p.subjectId && s.classId === st.classId);
  if (!p || !subj) throw new AccessDenied('This paper is not available for your class.');
  return createPractice(actor, st, { title: p.title, subjectId: p.subjectId, questionIds: p.questionIds, paperId: p.id, durationMin: p.questionIds.length * PAPER_MIN_PER_Q });
}

function createPractice(actor: Actor, st: Student, x: { title: string; subjectId: string; questionIds: string[]; paperId?: string; durationMin?: number }) {
  return mutate((d) => {
    const a: Assessment = {
      id: nextId(d, 'AS', 'PR', 3),
      kind: 'mock',
      title: x.title,
      subjectId: x.subjectId,
      classId: st.classId,
      questionIds: x.questionIds,
      durationMin: x.durationMin,
      opensAt: nowIso(),
      status: 'open',
      resultsReleased: true,
      paperId: x.paperId,
      createdBy: st.id,
    };
    d.assessments.push(a);
    const at: Attempt = {
      id: nextId(d, 'AT', 'AT'),
      assessmentId: a.id,
      studentId: st.id,
      startedAt: nowIso(),
      status: 'in-progress',
      items: a.questionIds.map((qid) => ({ questionId: qid, answer: '', max: d.questions.find((q) => q.id === qid)!.marks, status: 'auto' })),
    };
    d.attempts.push(at);
    audit(d, actor, 'Started practice', x.paperId ?? x.title);
    return at;
  });
}

export function pastPapersFor(actor: Actor, studentId: string) {
  const st = requireFamilyAccess(actor, studentId);
  const d = getDb();
  return d.pastPapers
    .filter((p) => d.subjects.some((s) => s.id === p.subjectId && s.classId === st.classId))
    .map((p) => {
      const tries = d.attempts.filter((at) => at.studentId === studentId && at.status === 'released' && d.assessments.find((a) => a.id === at.assessmentId)?.paperId === p.id);
      const best = tries.map(attemptScore).sort((a, b) => b.pct - a.pct)[0];
      return { ...p, subject: d.subjects.find((s) => s.id === p.subjectId)!, tries: tries.length, best, durationMin: p.questionIds.length * PAPER_MIN_PER_Q, marks: p.questionIds.reduce((n, id) => n + (d.questions.find((q) => q.id === id)?.marks ?? 0), 0) };
    })
    .sort((a, b) => b.year - a.year);
}

// ---------- Exam preparation ----------

export function examPlan(actor: Actor, studentId: string) {
  const st = requireFamilyAccess(actor, studentId);
  const d = getDb();
  const scores = ai.topicScores(d.attempts.filter((a) => a.studentId === studentId && a.status === 'released'), d.questions);
  const exams = d.examEvents.filter((e) => e.classId === st.classId && e.date.slice(0, 10) >= DEMO_DATE).sort((a, b) => a.date.localeCompare(b.date));
  const done = new Set(d.planDone[studentId] ?? []);
  const tasks = ai.studyPlan(exams, scores, d.topics, DEMO_DATE).map((t) => ({ ...t, done: done.has(t.id) }));
  return {
    exams: exams.map((e) => {
      const topics = e.topicIds.map((id) => ({ topic: d.topics.find((t) => t.id === id)!, score: scores.find((s) => s.topicId === id) }));
      const known = topics.filter((t) => t.score);
      const readiness = known.length ? Math.round(known.reduce((n, t) => n + t.score!.pct, 0) / known.length) : undefined;
      const days = Math.round(minutesBetween(`${DEMO_DATE}T00:00:00+04:00`, `${e.date.slice(0, 10)}T00:00:00+04:00`) / 1440);
      const own = tasks.filter((t) => t.examId === e.id);
      return { ...e, subject: d.subjects.find((s) => s.id === e.subjectId)!, topics, readiness, days, planDone: own.filter((t) => t.done).length, planTotal: own.length };
    }),
    tasks,
  };
}

export function togglePlanTask(actor: Actor, taskId: string) {
  const st = requireStudentSelf(actor, 'Study plan');
  mutate((d) => {
    const list = (d.planDone[st.id] ??= []);
    const i = list.indexOf(taskId);
    if (i >= 0) list.splice(i, 1);
    else list.push(taskId);
  });
}

// ---------- AI study helper (doubt solving) ----------

export function doubtAccess(actor: Actor): { allowed: boolean; reason?: string } {
  if (actor.kind !== 'student') return { allowed: false, reason: 'The study helper is for students signed in with their school account.' };
  const st = getDb().students.find((s) => s.id === actor.id);
  if (!st || st.yearGroup < MIN_AI_YEAR) return { allowed: false, reason: 'The AI study helper is available from Year 7. Ask your teacher in class or use Help.' };
  const test = activeTest(actor);
  if (test) return { allowed: false, reason: 'The study helper is paused while you have a test in progress.' };
  return { allowed: true };
}

function requireDoubtAccess(actor: Actor) {
  const acc = doubtAccess(actor);
  if (!acc.allowed) throw new ValidationError(acc.reason!);
  return requireStudentSelf(actor, 'Study helper');
}

export function myDoubts(actor: Actor) {
  if (actor.kind !== 'student') throw new AccessDenied('Only students have study helper conversations.');
  const d = getDb();
  return d.doubts
    .filter((x) => x.studentId === actor.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((x) => ({ ...x, subject: d.subjects.find((s) => s.id === x.subjectId) }));
}

export function doubt(actor: Actor, id: string) {
  const x = myDoubts(actor).find((y) => y.id === id);
  if (!x) throw new AccessDenied('Conversation not found.');
  return x;
}

export function askDoubt(actor: Actor, input: { subjectId: string; question: string }): Doubt {
  const st = requireDoubtAccess(actor);
  const q = input.question.trim();
  if (q.length < 8) throw new ValidationError('Tell the helper a little more about what you are stuck on.');
  const d = getDb();
  const subj = d.subjects.find((s) => s.id === input.subjectId && s.classId === st.classId);
  if (!subj) throw new ValidationError('Choose one of your subjects.');
  const help = ai.helpWithDoubt(q, d.materials, d.topics, subj.id);
  return mutate((db) => {
    const at = nowIso();
    const x: Doubt = {
      id: nextId(db, 'DB', 'DB'),
      studentId: st.id,
      subjectId: subj.id,
      topicId: help.topicId,
      question: q,
      status: 'ai-answered',
      createdAt: at,
      messages: [
        { from: 'student', author: st.name, text: q, at },
        { from: 'ai', author: ai.AI_LABEL, text: help.text, steps: help.steps, sources: help.sources, at },
      ],
    };
    db.doubts.unshift(x);
    audit(db, actor, 'Asked study helper', `${x.id} · ${subj.name}`);
    return x;
  });
}

export function followUpDoubt(actor: Actor, id: string, text: string) {
  const st = requireDoubtAccess(actor);
  const x = doubt(actor, id);
  const msg = text.trim();
  if (!msg) throw new ValidationError('Write a message first.');
  const d = getDb();
  const help = ai.helpWithDoubt(`${x.question} ${msg}`, d.materials, d.topics, x.subjectId);
  mutate((db) => {
    const y = db.doubts.find((z) => z.id === id)!;
    const at = nowIso();
    y.messages.push({ from: 'student', author: st.name, text: msg, at });
    if (y.status !== 'escalated') {
      y.messages.push({ from: 'ai', author: ai.AI_LABEL, text: help.grounded ? 'Here is another way to look at it.' : help.text, steps: help.steps.slice(-2), sources: help.sources, at });
      if (y.status === 'resolved') y.status = 'ai-answered';
    }
  });
}

export function escalateDoubt(actor: Actor, id: string) {
  const st = requireStudentSelf(actor, `Doubt ${id}`);
  const x = doubt(actor, id);
  if (x.status === 'escalated') return;
  mutate((d) => {
    const y = d.doubts.find((z) => z.id === id)!;
    y.status = 'escalated';
    const subj = d.subjects.find((s) => s.id === y.subjectId)!;
    d.notifications.unshift({ id: nextId(d, 'N', 'n'), audience: { kind: 'staff', id: subj.teacherId }, title: 'Student question for you', body: `${st.name} · ${subj.name}: ${y.question.slice(0, 80)}`, at: nowIso(), read: false, link: `/doubts/${y.id}` });
    audit(d, actor, 'Sent question to teacher', y.id);
  });
}

export function resolveDoubt(actor: Actor, id: string) {
  requireStudentSelf(actor, `Doubt ${id}`);
  doubt(actor, id);
  mutate((d) => {
    d.doubts.find((z) => z.id === id)!.status = 'resolved';
  });
}

// ---------- Written work with AI feedback ----------

export function writtenTasksFor(actor: Actor, studentId: string) {
  const st = requireFamilyAccess(actor, studentId);
  const d = getDb();
  return d.writtenTasks
    .filter((w) => w.classId === st.classId)
    .map((w) => ({ ...w, subject: d.subjects.find((s) => s.id === w.subjectId)!, submission: d.writtenSubmissions.find((s) => s.taskId === w.id && s.studentId === studentId) }));
}

export function writtenTask(actor: Actor, studentId: string, id: string) {
  const w = writtenTasksFor(actor, studentId).find((x) => x.id === id);
  if (!w) throw new AccessDenied('This task is not set for your class.');
  const sub = w.submission;
  const released = sub?.status === 'released';
  return {
    ...w,
    submission: sub && {
      ...sub,
      // Marks stay hidden until the teacher confirms and releases them.
      suggestions: released ? sub.suggestions : [],
      total: released ? sub.suggestions.reduce((n, s) => n + (s.awarded ?? s.suggested), 0) : undefined,
    },
    max: w.rubric.reduce((n, r) => n + r.marks, 0),
  };
}

/** Formative check before submitting. Nothing is stored and no marks are shown. */
export function checkDraft(actor: Actor, taskId: string, text: string) {
  const st = requireStudentSelf(actor, `Written task ${taskId}`);
  const w = getDb().writtenTasks.find((x) => x.id === taskId && x.classId === st.classId);
  if (!w) throw new AccessDenied('This task is not set for your class.');
  if (st.yearGroup < MIN_AI_YEAR) throw new ValidationError('AI feedback is available from Year 7.');
  const r = ai.suggestRubricMarks(text, w.rubric, w.minWords);
  return {
    feedback: r.feedback.replace(/\s*\(\d+\/\d+ suggested\)$/, ''),
    criteria: r.suggestions.map((s) => ({ criterion: s.criterion, met: s.suggested === s.max ? 'yes' : s.suggested > 0 ? 'partly' : 'not yet' })),
    words: ai.wordCount(text),
  };
}

export function submitWritten(actor: Actor, taskId: string, text: string) {
  const st = requireStudentSelf(actor, `Written task ${taskId}`);
  const d = getDb();
  const w = d.writtenTasks.find((x) => x.id === taskId && x.classId === st.classId);
  if (!w) throw new AccessDenied('This task is not set for your class.');
  if (d.writtenSubmissions.some((s) => s.taskId === taskId && s.studentId === st.id)) throw new ValidationError('You have already submitted this task.');
  const words = ai.wordCount(text);
  if (words < Math.min(20, w.minWords)) throw new ValidationError(`Write at least ${w.minWords} words before submitting.`);
  const r = ai.suggestRubricMarks(text, w.rubric, w.minWords);
  return mutate((db) => {
    const sub = {
      id: nextId(db, 'WS', 'WS', 1),
      taskId,
      studentId: st.id,
      text: text.trim(),
      submittedAt: nowIso(),
      suggestions: r.suggestions,
      confidence: r.confidence,
      aiFeedback: r.feedback,
      status: 'ai-suggested' as const,
    };
    db.writtenSubmissions.push(sub);
    const subj = db.subjects.find((s) => s.id === w.subjectId)!;
    db.notifications.unshift({ id: nextId(db, 'N', 'n'), audience: { kind: 'staff', id: subj.teacherId }, title: 'Written work to confirm', body: `${st.name} · ${w.title}`, at: nowIso(), read: false, link: '/marking' });
    audit(db, actor, 'Submitted written work', `${sub.id} · ${w.id}`);
    return sub;
  });
}

// ---------- Records: grades, attendance and behaviour ----------

export function gradesFor(actor: Actor, studentId: string) {
  const st = requireFamilyAccess(actor, studentId);
  const d = getDb();
  return d.subjects
    .filter((s) => s.classId === st.classId)
    .map((s) => {
      const results = d.attempts
        .filter((at) => at.studentId === studentId && at.status === 'released')
        .map((at) => ({ at, a: d.assessments.find((x) => x.id === at.assessmentId)! }))
        .filter(({ a }) => a.subjectId === s.id && a.kind !== 'mock')
        .map(({ at, a }) => ({ id: at.id, taskId: undefined as string | undefined, title: a.title, kind: a.kind as string, date: at.submittedAt ?? at.startedAt, ...attemptScore(at) }));
      const written = d.writtenSubmissions
        .filter((w) => w.studentId === studentId && w.status === 'released')
        .map((w) => ({ w, task: d.writtenTasks.find((x) => x.id === w.taskId)! }))
        .filter(({ task }) => task.subjectId === s.id)
        .map(({ w, task }) => {
          const got = w.suggestions.reduce((n, x) => n + (x.awarded ?? x.suggested), 0);
          const max = w.suggestions.reduce((n, x) => n + x.max, 0);
          return { id: w.id, taskId: task.id, title: task.title, kind: 'written', date: w.submittedAt, got, max, pct: pct(got, max) };
        });
      const all = [...results, ...written].sort((a, b) => b.date.localeCompare(a.date));
      const average = all.length ? Math.round(all.reduce((n, r) => n + r.pct, 0) / all.length) : undefined;
      return { subject: s, teacher: staffName(d, s.teacherId), results: all, average };
    });
}

export function attendanceFor(actor: Actor, studentId: string) {
  requireFamilyAccess(actor, studentId);
  return attendanceSummary(getDb(), studentId);
}

export function attendanceSummary(d: Db, studentId: string) {
  const history = d.attendanceHistory[studentId] ?? [];
  const todayMarks = d.lessonRegisters.filter((r) => r.date === DEMO_DATE && r.status === 'submitted' && r.marks[studentId]).map((r) => r.marks[studentId]);
  const todayStatus: Presence | undefined = todayMarks.length ? (todayMarks.includes('absent') ? 'absent' : todayMarks.includes('late') ? 'late' : todayMarks[0]) : undefined;
  const days = todayStatus ? [...history, { date: DEMO_DATE, status: todayStatus }] : history;
  const count = (p: Presence) => days.filter((x) => x.status === p).length;
  const attended = count('present') + count('late');
  return {
    days,
    present: count('present'),
    late: count('late'),
    absent: count('absent'),
    excused: count('excused'),
    rate: days.length ? Math.round((attended / days.length) * 1000) / 10 : 100,
    lessonsToday: d.lessonRegisters
      .filter((r) => r.date === DEMO_DATE && r.marks[studentId])
      .map((r) => {
        const p = d.periods.find((x) => x.id === r.periodId)!;
        return { period: p, subject: d.subjects.find((s) => s.id === p.subjectId)!, mark: r.status === 'submitted' ? r.marks[studentId] : undefined };
      }),
  };
}

export function behaviourFor(actor: Actor, studentId: string) {
  requireFamilyAccess(actor, studentId);
  const pts = getDb()
    .behaviourPoints.filter((b) => b.studentId === studentId)
    .sort((a, b) => b.at.localeCompare(a.at));
  return {
    points: pts,
    merits: pts.filter((p) => p.kind === 'merit').reduce((n, p) => n + p.points, 0),
    demerits: pts.filter((p) => p.kind === 'demerit').reduce((n, p) => n + p.points, 0),
  };
}

/** Everything the student's Today screen needs in one read. */
export function studentDay(actor: Actor, studentId: string) {
  const st = requireFamilyAccess(actor, studentId);
  const lessons = timetableFor(actor, studentId);
  const tests = assessmentsFor(actor, studentId);
  const written = writtenTasksFor(actor, studentId).filter((w) => !w.submission);
  const plan = examPlan(actor, studentId);
  const beh = behaviourFor(actor, studentId);
  return {
    student: st,
    lessons,
    current: lessons.find((l) => l.state === 'now'),
    next: lessons.find((l) => l.state === 'later'),
    tests,
    written,
    nextExam: plan.exams[0],
    todayTasks: plan.tasks.filter((t) => t.date === DEMO_DATE),
    merits: beh.merits,
    aiAllowed: st.yearGroup >= MIN_AI_YEAR,
  };
}
