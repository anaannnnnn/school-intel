// Teaching API for the staff workspace: lessons and registers, study
// materials, the question bank, assessments, AI-assisted marking, student
// questions, the gradebook and discipline points. Teachers change only the
// subjects they teach; the class tutor and leadership can read across the class.

import type { Actor, Assessment, BehaviourPoint, Material, Presence, Question, StaffMember, Subject } from '@school-intel/contracts';
import { AccessDenied, audit, canStaffSeeStudent, linkedStudentIds, requireRole, staffOf, ValidationError } from './access';
import * as ai from './ai';
import { attemptScore, attendanceSummary } from './learn';
import { DEMO_DATE, type Db } from './seed';
import { getDb, mutate, nextId, nowIso } from './store';

const studentName = (d: Db, id: string) => d.students.find((s) => s.id === id)?.name ?? id;

/** Subjects this person can read: their own, every subject of a class they tutor, or all for leadership. */
export function subjectsVisible(actor: Actor): Subject[] {
  const s = staffOf(actor);
  const d = getDb();
  if (s.roles.includes('leadership')) return d.subjects;
  const tutorOf = d.classes.filter((c) => c.tutorId === s.id).map((c) => c.id);
  return d.subjects.filter((x) => x.teacherId === s.id || tutorOf.includes(x.classId));
}

export function mySubjects(actor: Actor): Subject[] {
  const s = staffOf(actor);
  return getDb().subjects.filter((x) => x.teacherId === s.id);
}

function requireTeacherOf(actor: Actor, subjectId: string, target: string): StaffMember {
  const s = requireRole(actor, target, 'teacher');
  const subj = getDb().subjects.find((x) => x.id === subjectId);
  if (!subj || subj.teacherId !== s.id) {
    mutate((d) => audit(d, actor, 'Access denied', target, 'denied'));
    throw new AccessDenied('Only the subject teacher can change this.');
  }
  return s;
}

function requireReader(actor: Actor, subjectId: string, target: string) {
  if (!subjectsVisible(actor).some((x) => x.id === subjectId)) {
    mutate((d) => audit(d, actor, 'Access denied', target, 'denied'));
    throw new AccessDenied('This subject is not one you teach or tutor.');
  }
}

function notifyFamily(d: Db, studentId: string, title: string, body: string, link?: string) {
  for (const g of d.guardians) {
    if (!linkedStudentIds(d, g.id).includes(studentId)) continue;
    d.notifications.unshift({ id: nextId(d, 'N', 'n'), audience: { kind: 'guardian', id: g.id }, title, body, at: nowIso(), read: false, link });
  }
}

function notifyStudent(d: Db, studentId: string, title: string, body: string, link?: string) {
  d.notifications.unshift({ id: nextId(d, 'N', 'n'), audience: { kind: 'student', id: studentId }, title, body, at: nowIso(), read: false, link });
}

const dayOfWeek = (date: string) => {
  const x = new Date(`${date}T12:00:00Z`).getUTCDay();
  return x === 0 ? 7 : x;
};

// ---------- Lessons and registers ----------

/** Today's lessons this person teaches (or tutors), with register state. */
export function teachingDay(actor: Actor) {
  const s = staffOf(actor);
  const d = getDb();
  const visible = new Set(subjectsVisible(actor).map((x) => x.id));
  const own = new Set(mySubjects(actor).map((x) => x.id));
  const tutor = d.classes.filter((c) => c.tutorId === s.id).map((c) => c.id);
  const now = nowIso().slice(11, 16);
  const lessons = d.periods
    .filter((p) => p.day === dayOfWeek(DEMO_DATE) && (own.has(p.subjectId) || (tutor.includes(p.classId) && visible.has(p.subjectId)) || s.roles.includes('attendance')))
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((p) => {
      const reg = d.lessonRegisters.find((r) => r.periodId === p.id && r.date === DEMO_DATE);
      return {
        period: p,
        subject: d.subjects.find((x) => x.id === p.subjectId)!,
        register: reg,
        mine: own.has(p.subjectId),
        state: now >= p.end ? 'done' : now >= p.start ? 'now' : 'later',
      } as const;
    });
  return lessons;
}

function canTakeRegister(actor: Actor, periodId: string) {
  const s = staffOf(actor);
  const d = getDb();
  const p = d.periods.find((x) => x.id === periodId);
  if (!p) return false;
  const subj = d.subjects.find((x) => x.id === p.subjectId);
  return subj?.teacherId === s.id || d.classes.find((c) => c.id === p.classId)?.tutorId === s.id || s.roles.includes('attendance');
}

export function lessonRegister(actor: Actor, registerId: string) {
  const d = getDb();
  const reg = d.lessonRegisters.find((r) => r.id === registerId);
  if (!reg || !canTakeRegister(actor, reg.periodId)) throw new AccessDenied('This register is not for one of your lessons.');
  const p = d.periods.find((x) => x.id === reg.periodId)!;
  return {
    register: reg,
    period: p,
    subject: d.subjects.find((x) => x.id === p.subjectId)!,
    students: Object.keys(reg.marks).map((id) => {
      const st = d.students.find((x) => x.id === id)!;
      const att = attendanceSummary(d, id);
      return { student: st, mark: reg.marks[id], rate: att.rate };
    }),
    takenBy: reg.takenBy ? d.staff.find((x) => x.id === reg.takenBy)?.name : undefined,
  };
}

export function setPresence(actor: Actor, registerId: string, studentId: string, mark: Presence) {
  const { register } = lessonRegister(actor, registerId);
  if (!(studentId in register.marks)) throw new ValidationError('Student is not in this class.');
  mutate((d) => {
    d.lessonRegisters.find((r) => r.id === registerId)!.marks[studentId] = mark;
  });
}

/** Submits the register. Families of absent students are told straight away. */
export function submitRegister(actor: Actor, registerId: string) {
  const { register, period, subject } = lessonRegister(actor, registerId);
  const s = staffOf(actor);
  const wasSubmitted = register.status === 'submitted';
  return mutate((d) => {
    const r = d.lessonRegisters.find((x) => x.id === registerId)!;
    r.status = 'submitted';
    r.takenBy = s.id;
    r.takenAt = nowIso();
    const absent = Object.entries(r.marks).filter(([, m]) => m === 'absent').map(([id]) => id);
    for (const id of absent) {
      notifyFamily(d, id, 'Absence recorded', `${studentName(d, id)} was marked absent from ${subject.name} (${period.start}). If this is unexpected, please contact the school office.`, '/');
    }
    audit(d, actor, wasSubmitted ? 'Updated lesson register' : 'Submitted lesson register', `${r.id} · ${subject.name} ${period.start}`);
    return { absent: absent.length, late: Object.values(r.marks).filter((m) => m === 'late').length };
  });
}

export function classRoster(actor: Actor, classId: string) {
  const s = staffOf(actor);
  const d = getDb();
  if (!s.classIds.includes(classId) && !s.roles.some((r) => ['leadership', 'attendance', 'pastoral'].includes(r))) throw new AccessDenied('This class is not one of yours.');
  return d.students.filter((x) => x.classId === classId).map((st) => ({ student: st, attendance: attendanceSummary(d, st.id) }));
}

// ---------- Study materials ----------

export function materials(actor: Actor) {
  requireRole(actor, 'Study materials', 'teacher', 'leadership');
  const d = getDb();
  const visible = subjectsVisible(actor).map((x) => x.id);
  return d.materials
    .filter((m) => visible.includes(m.subjectId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((m) => ({ ...m, subject: d.subjects.find((x) => x.id === m.subjectId)!, topic: d.topics.find((t) => t.id === m.topicId)!, editable: d.subjects.find((x) => x.id === m.subjectId)?.teacherId === actor.id }));
}

export function materialById(actor: Actor, id: string) {
  const m = materials(actor).find((x) => x.id === id);
  if (!m) throw new AccessDenied('Material not found in your subjects.');
  return m;
}

export function saveMaterial(actor: Actor, input: Pick<Material, 'subjectId' | 'topicId' | 'title' | 'kind' | 'body' | 'minutes'> & { id?: string }) {
  requireTeacherOf(actor, input.subjectId, 'Study materials');
  if (!input.title.trim()) throw new ValidationError('Add a title.');
  if (input.body.trim().length < 20) throw new ValidationError('Add the material content (at least a couple of sentences).');
  const d0 = getDb();
  if (!d0.topics.some((t) => t.id === input.topicId && t.subjectId === input.subjectId)) throw new ValidationError('Choose a topic in this subject.');
  return mutate((d) => {
    if (input.id) {
      const m = d.materials.find((x) => x.id === input.id);
      if (!m) throw new ValidationError('Material not found.');
      Object.assign(m, { title: input.title.trim(), kind: input.kind, body: input.body.trim(), minutes: input.minutes, topicId: input.topicId, updatedAt: nowIso() });
      audit(d, actor, 'Edited material', m.id);
      return m;
    }
    const m: Material = { id: nextId(d, 'MAT', 'MAT'), subjectId: input.subjectId, topicId: input.topicId, title: input.title.trim(), kind: input.kind, body: input.body.trim(), minutes: input.minutes, status: 'draft', aiGenerated: false, createdBy: actor.id, updatedAt: nowIso() };
    d.materials.unshift(m);
    audit(d, actor, 'Created material', m.id);
    return m;
  });
}

export function setMaterialStatus(actor: Actor, id: string, status: Material['status']) {
  const m = materialById(actor, id);
  requireTeacherOf(actor, m.subjectId, `Material ${id}`);
  mutate((d) => {
    const x = d.materials.find((y) => y.id === id)!;
    x.status = status;
    x.updatedAt = nowIso();
    audit(d, actor, status === 'published' ? 'Published material' : 'Unpublished material', id);
  });
}

/** Creates an AI draft (revision cards or simpler version) for the teacher to review. */
export function aiMaterialDraft(actor: Actor, id: string, mode: 'cards' | 'simple') {
  const m = materialById(actor, id);
  requireTeacherOf(actor, m.subjectId, `Material ${id}`);
  return mutate((d) => {
    const x: Material = {
      id: nextId(d, 'MAT', 'MAT'),
      subjectId: m.subjectId,
      topicId: m.topicId,
      title: mode === 'cards' ? `Revision cards: ${m.title}` : `${m.title} (simpler reading level)`,
      kind: 'notes',
      body: mode === 'cards' ? ai.revisionCards(m) : ai.simplify(m),
      minutes: Math.max(3, Math.round(m.minutes / 2)),
      status: 'draft',
      aiGenerated: true,
      createdBy: actor.id,
      updatedAt: nowIso(),
    };
    d.materials.unshift(x);
    audit(d, actor, 'Generated AI draft material', `${x.id} from ${m.id}`);
    return x;
  });
}

// ---------- Question bank ----------

export function questionBank(actor: Actor) {
  requireRole(actor, 'Question bank', 'teacher', 'leadership');
  const d = getDb();
  const visible = subjectsVisible(actor).map((x) => x.id);
  const used = new Map<string, number>();
  d.assessments.forEach((a) => a.questionIds.forEach((q) => used.set(q, (used.get(q) ?? 0) + 1)));
  const scores = ai.itemAnalysis(d.attempts.filter((a) => a.status !== 'in-progress'), d.questions.map((q) => q.id));
  return d.questions
    .filter((q) => visible.includes(q.subjectId))
    .map((q) => ({ ...q, subject: d.subjects.find((x) => x.id === q.subjectId)!, topic: d.topics.find((t) => t.id === q.topicId)!, used: used.get(q.id) ?? 0, facility: scores.find((s) => s.questionId === q.id) }));
}

export function generateQuestionDrafts(actor: Actor, topicId: string, count: number) {
  const d0 = getDb();
  const topic = d0.topics.find((t) => t.id === topicId);
  if (!topic) throw new ValidationError('Choose a topic.');
  requireTeacherOf(actor, topic.subjectId, 'Question bank');
  const n = Math.max(1, Math.min(10, count));
  const drafts = ai.generateQuestions(topic, d0.materials, n, String(d0.counters.Q ?? 0));
  return mutate((d) => {
    const made = drafts.map((q) => ({ ...q, id: nextId(d, 'Q', 'Q-AI', 3) }) as Question);
    d.questions.push(...made);
    audit(d, actor, 'Generated AI question drafts', `${made.length} · ${topic.name}`);
    return made;
  });
}

export function saveQuestion(actor: Actor, q: Question) {
  requireTeacherOf(actor, q.subjectId, `Question ${q.id}`);
  if (!q.prompt.trim()) throw new ValidationError('The question needs a prompt.');
  if (q.type === 'mcq' && (!q.options || q.options.filter((o) => o.trim()).length < 2)) throw new ValidationError('Multiple choice needs at least two options.');
  if (!q.answer.trim()) throw new ValidationError('Add the correct answer.');
  mutate((d) => {
    const i = d.questions.findIndex((x) => x.id === q.id);
    if (i < 0) throw new ValidationError('Question not found.');
    d.questions[i] = { ...q, prompt: q.prompt.trim() };
    audit(d, actor, 'Edited question', q.id);
  });
}

export function reviewQuestion(actor: Actor, id: string, decision: 'approve' | 'reject') {
  const q = getDb().questions.find((x) => x.id === id);
  if (!q) throw new ValidationError('Question not found.');
  requireTeacherOf(actor, q.subjectId, `Question ${id}`);
  if (decision === 'reject' && getDb().assessments.some((a) => a.questionIds.includes(id))) throw new ValidationError('This question is used in an assessment and cannot be removed.');
  mutate((d) => {
    if (decision === 'approve') d.questions.find((x) => x.id === id)!.status = 'approved';
    else d.questions = d.questions.filter((x) => x.id !== id);
    audit(d, actor, decision === 'approve' ? 'Approved question' : 'Rejected AI draft question', id);
  });
}

// ---------- Assessments ----------

export function assessments(actor: Actor) {
  requireRole(actor, 'Assessments', 'teacher', 'leadership');
  const d = getDb();
  const visible = subjectsVisible(actor).map((x) => x.id);
  return d.assessments
    .filter((a) => visible.includes(a.subjectId) && a.kind !== 'mock')
    .map((a) => assessmentRow(d, a))
    .sort((a, b) => b.opensAt.localeCompare(a.opensAt));
}

function assessmentRow(d: Db, a: Assessment) {
  const cls = d.students.filter((s) => s.classId === a.classId);
  const attempts = d.attempts.filter((x) => x.assessmentId === a.id && x.status !== 'in-progress');
  const scored = attempts.filter((x) => x.items.every((i) => i.awarded !== undefined));
  return {
    ...a,
    subject: d.subjects.find((x) => x.id === a.subjectId)!,
    classSize: cls.length,
    submitted: attempts.length,
    inProgress: d.attempts.filter((x) => x.assessmentId === a.id && x.status === 'in-progress').length,
    toMark: attempts.filter((x) => x.status === 'submitted').length,
    average: scored.length ? Math.round(scored.reduce((n, x) => n + attemptScore(x).pct, 0) / scored.length) : undefined,
    marks: a.questionIds.reduce((n, id) => n + (d.questions.find((q) => q.id === id)?.marks ?? 0), 0),
  };
}

export function assessmentDetail(actor: Actor, id: string) {
  const d = getDb();
  const a = d.assessments.find((x) => x.id === id);
  if (!a) throw new ValidationError('Assessment not found.');
  requireReader(actor, a.subjectId, `Assessment ${id}`);
  const attempts = d.attempts.filter((x) => x.assessmentId === id);
  const items = ai.itemAnalysis(attempts.filter((x) => x.status !== 'in-progress'), a.questionIds);
  const topicScores = ai.topicScores(attempts.filter((x) => x.items.every((i) => i.awarded !== undefined)), d.questions);
  const weakest = [...topicScores].sort((x, y) => x.pct - y.pct)[0];
  return {
    assessment: assessmentRow(d, a),
    editable: d.subjects.find((x) => x.id === a.subjectId)?.teacherId === actor.id,
    questions: a.questionIds.map((qid) => {
      const q = d.questions.find((x) => x.id === qid)!;
      return { question: q, topic: d.topics.find((t) => t.id === q.topicId)!, insight: items.find((i) => i.questionId === qid)! };
    }),
    students: d.students
      .filter((s) => s.classId === a.classId)
      .map((s) => {
        const at = attempts.find((x) => x.studentId === s.id);
        return { student: s, attempt: at, score: at && at.items.every((i) => i.awarded !== undefined) ? attemptScore(at) : undefined };
      }),
    topicScores: topicScores.map((t) => ({ ...t, name: d.topics.find((x) => x.id === t.topicId)?.name ?? t.topicId })),
    insight: weakest
      ? `Weakest area: ${d.topics.find((x) => x.id === weakest.topicId)?.name} (${weakest.pct}%). ${items.filter((i) => i.pct < 50).length} question(s) below 50% — consider a short reteach before the next lesson.`
      : 'No submissions yet.',
  };
}

export interface NewAssessment {
  kind: 'quiz' | 'test';
  title: string;
  subjectId: string;
  topicIds: string[];
  count: number;
  durationMin?: number;
  opensAt: string;
  closesAt?: string;
  includeWritten: boolean;
}

/** Builds a paper from approved questions using the blueprint, saved as a draft. */
export function previewPaper(actor: Actor, bp: Omit<NewAssessment, 'title' | 'opensAt' | 'closesAt' | 'kind' | 'durationMin'>) {
  requireTeacherOf(actor, bp.subjectId, 'Assessment builder');
  const d = getDb();
  return ai.buildPaper(bp, d.questions, `${bp.topicIds.join()}:${bp.count}`).map((id) => d.questions.find((q) => q.id === id)!);
}

export function createAssessment(actor: Actor, input: NewAssessment & { questionIds?: string[] }) {
  requireTeacherOf(actor, input.subjectId, 'Assessment builder');
  if (!input.title.trim()) throw new ValidationError('Give the assessment a title.');
  if (!input.topicIds.length) throw new ValidationError('Choose at least one topic.');
  const qids = input.questionIds?.length ? input.questionIds : previewPaper(actor, input).map((q) => q.id);
  if (!qids.length) throw new ValidationError('There are no approved questions for those topics yet. Generate and approve some first.');
  if (input.kind === 'test' && !input.durationMin) throw new ValidationError('Tests need a time limit.');
  const subj = getDb().subjects.find((s) => s.id === input.subjectId)!;
  return mutate((d) => {
    const a: Assessment = {
      id: nextId(d, 'AS', input.kind === 'quiz' ? 'QZ' : 'TS', 3),
      kind: input.kind,
      title: input.title.trim(),
      subjectId: input.subjectId,
      classId: subj.classId,
      questionIds: qids,
      durationMin: input.durationMin,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      status: 'draft',
      resultsReleased: input.kind === 'quiz',
      createdBy: actor.id,
    };
    d.assessments.push(a);
    audit(d, actor, 'Created assessment', `${a.id} · ${a.title}`);
    return a;
  });
}

export function setAssessmentStatus(actor: Actor, id: string, status: Assessment['status']) {
  const a = getDb().assessments.find((x) => x.id === id);
  if (!a) throw new ValidationError('Assessment not found.');
  requireTeacherOf(actor, a.subjectId, `Assessment ${id}`);
  mutate((d) => {
    const x = d.assessments.find((y) => y.id === id)!;
    x.status = status;
    if (status === 'open') {
      if (x.opensAt > nowIso()) x.opensAt = nowIso();
      d.students.filter((s) => s.classId === x.classId).forEach((s) => notifyStudent(d, s.id, x.kind === 'quiz' ? 'New quiz' : 'Test open', `${x.title} is ready in Tests.`, '/tests'));
    }
    audit(d, actor, `Assessment ${status}`, x.id);
  });
}

/** Releases results to students and families. Every written answer must be teacher-confirmed first. */
export function releaseResults(actor: Actor, id: string) {
  const a = getDb().assessments.find((x) => x.id === id);
  if (!a) throw new ValidationError('Assessment not found.');
  requireTeacherOf(actor, a.subjectId, `Assessment ${id}`);
  const pending = getDb().attempts.filter((x) => x.assessmentId === id && x.status === 'submitted').length;
  if (pending) throw new ValidationError(`${pending} answer${pending === 1 ? '' : 's'} still need${pending === 1 ? 's' : ''} your confirmation in Marking.`);
  return mutate((d) => {
    const x = d.assessments.find((y) => y.id === id)!;
    x.resultsReleased = true;
    let n = 0;
    d.attempts
      .filter((at) => at.assessmentId === id && at.status === 'marked')
      .forEach((at) => {
        at.status = 'released';
        n++;
        notifyStudent(d, at.studentId, 'Results released', `${x.title}: ${attemptScore(at).pct}%`, `/tests/result/${at.id}`);
        notifyFamily(d, at.studentId, 'Test result released', `${studentName(d, at.studentId)} · ${x.title}: ${attemptScore(at).pct}%`);
      });
    audit(d, actor, 'Released results', `${x.id} · ${n} students`);
    return n;
  });
}

// ---------- AI-assisted marking ----------

export type MarkRef = { kind: 'test'; attemptId: string; questionId: string } | { kind: 'written'; submissionId: string };

export function markingQueue(actor: Actor) {
  requireRole(actor, 'Marking', 'teacher');
  const d = getDb();
  const own = mySubjects(actor).map((x) => x.id);
  const test = d.attempts.flatMap((at) => {
    const a = d.assessments.find((x) => x.id === at.assessmentId)!;
    if (!own.includes(a.subjectId)) return [];
    return at.items
      .filter((i) => i.status === 'ai-suggested')
      .map((i) => ({
        ref: { kind: 'test', attemptId: at.id, questionId: i.questionId } as MarkRef,
        key: `${at.id}:${i.questionId}`,
        student: d.students.find((s) => s.id === at.studentId)!,
        title: a.title,
        subject: d.subjects.find((x) => x.id === a.subjectId)!,
        submittedAt: at.submittedAt ?? at.startedAt,
        confidence: i.confidence ?? 'medium',
        suggested: (i.suggestions ?? []).reduce((n, s) => n + s.suggested, 0),
        max: i.max,
        status: 'to-confirm' as const,
      }));
  });
  const written = d.writtenSubmissions
    .map((w) => ({ w, task: d.writtenTasks.find((t) => t.id === w.taskId)! }))
    .filter(({ task }) => own.includes(task.subjectId))
    .map(({ w, task }) => ({
      ref: { kind: 'written', submissionId: w.id } as MarkRef,
      key: w.id,
      student: d.students.find((s) => s.id === w.studentId)!,
      title: task.title,
      subject: d.subjects.find((x) => x.id === task.subjectId)!,
      submittedAt: w.submittedAt,
      confidence: w.confidence,
      suggested: w.suggestions.reduce((n, s) => n + (w.status === 'ai-suggested' ? s.suggested : (s.awarded ?? s.suggested)), 0),
      max: w.suggestions.reduce((n, s) => n + s.max, 0),
      status: w.status === 'ai-suggested' ? ('to-confirm' as const) : w.status === 'confirmed' ? ('confirmed' as const) : ('released' as const),
    }));
  return [...test, ...written].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export function markingItem(actor: Actor, key: string) {
  const row = markingQueue(actor).find((x) => x.key === key);
  if (!row) throw new AccessDenied('This answer is not in your marking queue.');
  const d = getDb();
  if (row.ref.kind === 'test') {
    const ref = row.ref;
    const at = d.attempts.find((x) => x.id === ref.attemptId)!;
    const item = at.items.find((i) => i.questionId === ref.questionId)!;
    const q = d.questions.find((x) => x.id === ref.questionId)!;
    return { row, prompt: q.prompt, modelAnswer: q.answer, text: item.answer, suggestions: item.suggestions ?? [], feedback: undefined as string | undefined, teacherFeedback: at.teacherComment, minWords: 0 };
  }
  const ref = row.ref;
  const w = d.writtenSubmissions.find((x) => x.id === ref.submissionId)!;
  const task = d.writtenTasks.find((x) => x.id === w.taskId)!;
  return { row, prompt: task.prompt, modelAnswer: undefined as string | undefined, text: w.text, suggestions: w.suggestions, feedback: w.aiFeedback, teacherFeedback: w.teacherFeedback, minWords: task.minWords };
}

/** The teacher's confirmed marks replace the AI suggestion. Every change is audited. */
export function confirmMarks(actor: Actor, key: string, awards: Record<string, number>, feedback?: string) {
  const item = markingItem(actor, key);
  for (const s of item.suggestions) {
    const v = awards[s.criterionId];
    if (v === undefined || v < 0 || v > s.max || !Number.isFinite(v)) throw new ValidationError(`Enter a mark from 0 to ${s.max} for “${s.criterion}”.`);
  }
  const changed = item.suggestions.filter((s) => awards[s.criterionId] !== s.suggested).length;
  mutate((d) => {
    if (item.row.ref.kind === 'test') {
      const ref = item.row.ref;
      const at = d.attempts.find((x) => x.id === ref.attemptId)!;
      const it = at.items.find((i) => i.questionId === ref.questionId)!;
      it.suggestions = (it.suggestions ?? []).map((s) => ({ ...s, awarded: awards[s.criterionId] }));
      it.awarded = it.suggestions.reduce((n, s) => n + (s.awarded ?? 0), 0);
      it.correct = it.awarded === it.max;
      it.status = 'confirmed';
      if (feedback?.trim()) at.teacherComment = feedback.trim();
      if (at.items.every((i) => i.status !== 'ai-suggested')) {
        const a = d.assessments.find((x) => x.id === at.assessmentId)!;
        at.status = a.resultsReleased ? 'released' : 'marked';
      }
      audit(d, actor, changed ? `Confirmed marks (${changed} changed from AI)` : 'Confirmed AI-suggested marks', `${at.id} · ${ref.questionId}`);
    } else {
      const ref = item.row.ref;
      const w = d.writtenSubmissions.find((x) => x.id === ref.submissionId)!;
      w.suggestions = w.suggestions.map((s) => ({ ...s, awarded: awards[s.criterionId] }));
      w.teacherFeedback = feedback?.trim() || w.teacherFeedback;
      if (w.status === 'ai-suggested') w.status = 'confirmed';
      audit(d, actor, changed ? `Confirmed marks (${changed} changed from AI)` : 'Confirmed AI-suggested marks', w.id);
    }
  });
}

export function releaseWritten(actor: Actor, taskId: string) {
  const d0 = getDb();
  const task = d0.writtenTasks.find((t) => t.id === taskId);
  if (!task) throw new ValidationError('Task not found.');
  requireTeacherOf(actor, task.subjectId, `Written task ${taskId}`);
  return mutate((d) => {
    const subs = d.writtenSubmissions.filter((w) => w.taskId === taskId && w.status === 'confirmed');
    subs.forEach((w) => {
      w.status = 'released';
      notifyStudent(d, w.studentId, 'Feedback released', task.title, `/written/${task.id}`);
    });
    audit(d, actor, 'Released written feedback', `${taskId} · ${subs.length} students`);
    return subs.length;
  });
}

export function writtenTasks(actor: Actor) {
  requireRole(actor, 'Written tasks', 'teacher', 'leadership');
  const d = getDb();
  const visible = subjectsVisible(actor).map((x) => x.id);
  return d.writtenTasks
    .filter((t) => visible.includes(t.subjectId))
    .map((t) => {
      const subs = d.writtenSubmissions.filter((w) => w.taskId === t.id);
      return { ...t, subject: d.subjects.find((x) => x.id === t.subjectId)!, submitted: subs.length, toConfirm: subs.filter((w) => w.status === 'ai-suggested').length, confirmed: subs.filter((w) => w.status === 'confirmed').length, released: subs.filter((w) => w.status === 'released').length, classSize: d.students.filter((s) => s.classId === t.classId).length };
    });
}

// ---------- Student questions (escalated doubts) ----------

export function doubtsInbox(actor: Actor) {
  requireRole(actor, 'Student questions', 'teacher');
  const d = getDb();
  const own = mySubjects(actor).map((x) => x.id);
  const list = d.doubts
    .filter((x) => own.includes(x.subjectId))
    .sort((a, b) => (a.status === 'escalated' ? 0 : 1) - (b.status === 'escalated' ? 0 : 1) || b.createdAt.localeCompare(a.createdAt))
    .map((x) => ({ ...x, student: d.students.find((s) => s.id === x.studentId)!, subject: d.subjects.find((s) => s.id === x.subjectId)!, topic: d.topics.find((t) => t.id === x.topicId) }));
  return { list, themes: ai.doubtThemes(list, d.topics) };
}

export function replyToDoubt(actor: Actor, id: string, text: string) {
  const s = requireRole(actor, 'Student questions', 'teacher');
  const x = doubtsInbox(actor).list.find((y) => y.id === id);
  if (!x) throw new AccessDenied('This question is not for one of your subjects.');
  if (!text.trim()) throw new ValidationError('Write a reply first.');
  mutate((d) => {
    const y = d.doubts.find((z) => z.id === id)!;
    y.messages.push({ from: 'teacher', author: s.name, text: text.trim(), at: nowIso() });
    y.status = 'teacher-answered';
    notifyStudent(d, y.studentId, `${s.name} replied`, y.question.slice(0, 80), `/ask/${y.id}`);
    audit(d, actor, 'Answered student question', y.id);
  });
}

// ---------- Gradebook ----------

export function gradebook(actor: Actor, subjectId: string) {
  requireReader(actor, subjectId, `Gradebook ${subjectId}`);
  const d = getDb();
  const subj = d.subjects.find((x) => x.id === subjectId)!;
  const cols = [
    ...d.assessments.filter((a) => a.subjectId === subjectId && a.kind !== 'mock' && a.status !== 'draft').map((a) => ({ id: a.id, title: a.title, kind: a.kind as string, date: a.opensAt })),
    ...d.writtenTasks.filter((t) => t.subjectId === subjectId).map((t) => ({ id: t.id, title: t.title, kind: 'written', date: t.due })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const topics = d.topics.filter((t) => t.subjectId === subjectId).sort((a, b) => a.order - b.order);
  const rows = d.students
    .filter((s) => s.classId === subj.classId)
    .map((st) => {
      const cells = cols.map((c) => {
        if (c.kind === 'written') {
          const w = d.writtenSubmissions.find((x) => x.taskId === c.id && x.studentId === st.id);
          if (!w) return { state: 'missing' as const };
          if (w.status === 'ai-suggested') return { state: 'to-mark' as const };
          const got = w.suggestions.reduce((n, s) => n + (s.awarded ?? s.suggested), 0);
          const max = w.suggestions.reduce((n, s) => n + s.max, 0);
          return { state: 'scored' as const, pct: Math.round((got / max) * 100) };
        }
        const at = d.attempts.find((x) => x.assessmentId === c.id && x.studentId === st.id && x.status !== 'in-progress');
        if (!at) return { state: 'missing' as const };
        if (at.status === 'submitted') return { state: 'to-mark' as const };
        return { state: 'scored' as const, pct: attemptScore(at).pct };
      });
      const scored = cells.filter((c) => c.state === 'scored') as Array<{ pct: number }>;
      const ts = ai.topicScores(d.attempts.filter((a) => a.studentId === st.id && a.status !== 'in-progress' && a.items.every((i) => i.awarded !== undefined)), d.questions);
      return {
        student: st,
        cells,
        average: scored.length ? Math.round(scored.reduce((n, c) => n + c.pct, 0) / scored.length) : undefined,
        mastery: topics.map((t) => ts.find((x) => x.topicId === t.id)?.pct),
      };
    });
  return { subject: subj, columns: cols, topics, rows, editable: subj.teacherId === actor.id };
}

// ---------- Discipline points ----------

export const MERIT_CATEGORIES = ['Excellent work', 'Effort', 'Kindness', 'Leadership', 'Participation', 'Community'];
export const DEMERIT_CATEGORIES = ['Late to lesson', 'Homework not submitted', 'Disruption', 'Uniform', 'Device misuse'];

export function behaviourLog(actor: Actor) {
  const s = requireRole(actor, 'Discipline points', 'teacher', 'pastoral', 'leadership');
  const d = getDb();
  const pts = d.behaviourPoints.filter((p) => canStaffSeeStudent(actor, p.studentId)).sort((a, b) => b.at.localeCompare(a.at));
  const classIds = [...new Set(d.students.filter((st) => canStaffSeeStudent(actor, st.id)).map((st) => st.classId))].sort();
  return {
    points: pts.map((p) => ({ ...p, student: d.students.find((x) => x.id === p.studentId)! })),
    // Class totals only: the platform does not rank individual students.
    classes: classIds.map((c) => {
      const list = pts.filter((p) => d.students.find((x) => x.id === p.studentId)?.classId === c);
      return { classId: c, merits: list.filter((p) => p.kind === 'merit').reduce((n, p) => n + p.points, 0), demerits: list.filter((p) => p.kind === 'demerit').reduce((n, p) => n + p.points, 0) };
    }),
    students: d.students.filter((st) => canStaffSeeStudent(actor, st.id)),
    me: s,
  };
}

export function awardPoint(actor: Actor, input: { studentId: string; kind: BehaviourPoint['kind']; category: string; points: number; note: string; notifyParent: boolean }) {
  const s = requireRole(actor, 'Discipline points', 'teacher', 'pastoral', 'leadership');
  if (!canStaffSeeStudent(actor, input.studentId)) {
    mutate((d) => audit(d, actor, 'Access denied', `Student record ${input.studentId}`, 'denied'));
    throw new AccessDenied('This student is not in your classes.');
  }
  if (!input.category) throw new ValidationError('Choose a category.');
  if (input.points < 1 || input.points > 3) throw new ValidationError('Points must be between 1 and 3.');
  if (input.kind === 'demerit' && input.note.trim().length < 10) throw new ValidationError('Describe what happened (at least a short sentence) for a demerit.');
  return mutate((d) => {
    const p: BehaviourPoint = { id: nextId(d, 'BP', 'BP', 1), studentId: input.studentId, kind: input.kind, category: input.category, points: input.points, note: input.note.trim(), by: s.name, at: nowIso(), parentNotified: input.notifyParent };
    d.behaviourPoints.unshift(p);
    const name = studentName(d, input.studentId);
    if (input.notifyParent) notifyFamily(d, input.studentId, input.kind === 'merit' ? `Merit for ${name.split(' ')[0]}` : `Behaviour note for ${name.split(' ')[0]}`, `${p.category}${p.note ? ` · ${p.note}` : ''} (${s.name})`);
    notifyStudent(d, input.studentId, input.kind === 'merit' ? `+${p.points} merit` : 'Behaviour note', `${p.category} · ${s.name}`);
    audit(d, actor, input.kind === 'merit' ? 'Awarded merit' : 'Recorded demerit', `${p.id} · ${name}`);
    return p;
  });
}

// ---------- Teaching overview ----------

export function teachingSummary(actor: Actor) {
  const s = staffOf(actor);
  if (!s.roles.includes('teacher')) return undefined;
  const d = getDb();
  const queue = markingQueue(actor).filter((x) => x.status === 'to-confirm');
  const inbox = doubtsInbox(actor);
  return {
    lessons: teachingDay(actor),
    toMark: queue.length,
    escalated: inbox.list.filter((x) => x.status === 'escalated').length,
    draftQuestions: d.questions.filter((q) => q.status === 'draft' && mySubjects(actor).some((x) => x.id === q.subjectId)).length,
    draftMaterials: d.materials.filter((m) => m.status === 'draft' && mySubjects(actor).some((x) => x.id === m.subjectId)).length,
    openAssessments: assessments(actor).filter((a) => a.status === 'open' && a.subject.teacherId === s.id),
    upcoming: d.examEvents.filter((e) => e.date.slice(0, 10) >= DEMO_DATE && subjectsVisible(actor).some((x) => x.id === e.subjectId)).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/** Learning record for a student profile in the staff workspace. */
export function learningRecord(actor: Actor, studentId: string) {
  if (!canStaffSeeStudent(actor, studentId)) throw new AccessDenied();
  const d = getDb();
  const st = d.students.find((x) => x.id === studentId)!;
  const subs = d.subjects.filter((x) => x.classId === st.classId);
  return {
    attendance: attendanceSummary(d, studentId),
    behaviour: d.behaviourPoints.filter((p) => p.studentId === studentId).sort((a, b) => b.at.localeCompare(a.at)),
    grades: subs.map((sub) => {
      const ats = d.attempts.filter((a) => a.studentId === studentId && a.status !== 'in-progress' && a.items.every((i) => i.awarded !== undefined) && d.assessments.find((x) => x.id === a.assessmentId)?.subjectId === sub.id && d.assessments.find((x) => x.id === a.assessmentId)?.kind !== 'mock');
      return { subject: sub, count: ats.length, average: ats.length ? Math.round(ats.reduce((n, a) => n + attemptScore(a).pct, 0) / ats.length) : undefined };
    }),
    doubts: d.doubts.filter((x) => x.studentId === studentId).length,
  };
}
