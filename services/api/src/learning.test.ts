// Learning, assessment and records rules exercised against the demo API.
import { beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '@school-intel/contracts';
import { AccessDenied, ValidationError } from './access';
import * as ai from './ai';
import * as learn from './learn';
import * as teach from './teach';
import { getDb, resetDemo } from './store';

const fatima: Actor = { kind: 'guardian', id: 'g-fatima' };
const sara: Actor = { kind: 'student', id: 'stu-sara' };
const adam: Actor = { kind: 'student', id: 'stu-adam' };
const nadia: Actor = { kind: 'staff', id: 'st-nadia' };
const priya: Actor = { kind: 'staff', id: 'st-priya' };
const james: Actor = { kind: 'staff', id: 'st-james' };
const daniel: Actor = { kind: 'staff', id: 'st-daniel' };

beforeEach(() => resetDemo());

describe('AI study helper', () => {
  it('is not available below Year 7 or to guardians', () => {
    expect(learn.doubtAccess(adam).allowed).toBe(false);
    expect(learn.doubtAccess(fatima).allowed).toBe(false);
    expect(() => learn.askDoubt(adam, { subjectId: 'sub-math', question: 'How do I add fractions?' })).toThrow(ValidationError);
  });

  it('answers with hints grounded in class materials and cites them', () => {
    const x = learn.askDoubt(sara, { subjectId: 'sub-math', question: 'How do I add 1/4 + 1/6 with different denominators?' });
    const reply = x.messages[1];
    expect(reply.from).toBe('ai');
    expect(reply.sources).toContain('Adding fractions with unlike denominators');
    expect(reply.steps!.join(' ')).not.toContain('5/12');
  });

  it('declines to guess when nothing in the materials matches', () => {
    const help = ai.helpWithDoubt('Who won the football world cup?', getDb().materials, getDb().topics, 'sub-math');
    expect(help.grounded).toBe(false);
    expect(help.steps).toHaveLength(0);
  });

  it('is paused while a test is in progress', () => {
    const at = learn.startAttempt(sara, 'AS-SCI-T1');
    expect(learn.doubtAccess(sara).allowed).toBe(false);
    expect(() => learn.askDoubt(sara, { subjectId: 'sub-sci', question: 'What do particles in a solid do?' })).toThrow(ValidationError);
    learn.submitAttempt(sara, at.id);
    expect(learn.doubtAccess(sara).allowed).toBe(true);
  });

  it('escalates to the subject teacher, who can reply', () => {
    const x = learn.askDoubt(sara, { subjectId: 'sub-sci', question: 'Why does ice melt faster in the sun than in the shade?' });
    learn.escalateDoubt(sara, x.id);
    expect(teach.doubtsInbox(priya).list.some((y) => y.id === x.id)).toBe(true);
    expect(teach.doubtsInbox(nadia).list.some((y) => y.id === x.id)).toBe(false);
    teach.replyToDoubt(priya, x.id, 'Great question. The sun transfers more energy to the ice.');
    expect(learn.doubt(sara, x.id).status).toBe('teacher-answered');
  });
});

describe('Quizzes and tests', () => {
  it('auto-marks objective questions and shows quiz results straight away', () => {
    const at = learn.startAttempt(sara, 'AS-QZ1');
    learn.saveAnswer(sara, at.id, 'Q-101', '0');
    learn.saveAnswer(sara, at.id, 'Q-102', '2');
    learn.saveAnswer(sara, at.id, 'Q-103', '8');
    learn.saveAnswer(sara, at.id, 'Q-104', '0');
    const done = learn.submitAttempt(sara, at.id);
    expect(done.status).toBe('released');
    expect(learn.attemptResult(sara, at.id).score).toEqual({ got: 3, max: 4, pct: 75 });
  });

  it('requires fractions in simplest form', () => {
    const q = getDb().questions.find((x) => x.id === 'Q-105')!;
    expect(ai.markObjective(q, '3/4').correct).toBe(true);
    const r = ai.markObjective(q, '9/12');
    expect(r.correct).toBe(false);
    expect(r.note).toMatch(/simplest/);
  });

  it('hides answers while a test is in progress', () => {
    const at = learn.startAttempt(sara, 'AS-SCI-T1');
    const p = learn.player(sara, at.id);
    expect(p.questions.every((q) => q.answer === undefined)).toBe(true);
    expect(p.questions.find((q) => q.type === 'short')!.rubric!.every((r) => r.keywords.length === 0)).toBe(true);
  });

  it('keeps written answers for teacher confirmation before any result is released', () => {
    const at = learn.startAttempt(sara, 'AS-SCI-T1');
    learn.saveAnswer(sara, at.id, 'Q-203', '1');
    learn.saveAnswer(sara, at.id, 'Q-207', 'In a solid the particles are close together in a regular pattern and vibrate. In a liquid they move past each other. Heat gives them energy.');
    const sub = learn.submitAttempt(sara, at.id);
    expect(sub.status).toBe('submitted');
    expect(learn.attemptResult(sara, at.id).released).toBe(false);
    expect(() => teach.releaseResults(priya, 'AS-SCI-T1')).toThrow(/confirmation/);

    const keys = teach.markingQueue(priya).filter((x) => x.ref.kind === 'test').map((x) => x.key);
    for (const key of keys) {
      const item = teach.markingItem(priya, key);
      teach.confirmMarks(priya, key, Object.fromEntries(item.suggestions.map((s) => [s.criterionId, s.suggested])));
    }
    expect(teach.releaseResults(priya, 'AS-SCI-T1')).toBeGreaterThan(0);
    expect(learn.attemptResult(sara, at.id).released).toBe(true);
    expect(getDb().audit.some((a) => a.action.startsWith('Confirmed'))).toBe(true);
  });

  it('only the subject teacher can mark or release', () => {
    expect(() => teach.releaseResults(nadia, 'AS-SCI-T1')).toThrow(AccessDenied);
    expect(teach.markingQueue(nadia).some((x) => x.subject.id === 'sub-sci')).toBe(false);
  });

  it('builds a paper from approved questions only', () => {
    const qs = teach.previewPaper(nadia, { subjectId: 'sub-math', topicIds: ['tp-eqf'], count: 10, includeWritten: false });
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((q) => q.status === 'approved' && q.topicId === 'tp-eqf')).toBe(true);
  });

  it('keeps AI question drafts out of practice until approved', () => {
    const made = teach.generateQuestionDrafts(nadia, 'tp-unlike', 3);
    expect(made.every((q) => q.status === 'draft' && q.aiGenerated)).toBe(true);
    const qs = teach.previewPaper(nadia, { subjectId: 'sub-math', topicIds: ['tp-unlike'], count: 20, includeWritten: false });
    expect(qs.some((q) => made.some((m) => m.id === q.id))).toBe(false);
  });
});

describe('Written work', () => {
  it('suggests rubric marks with quoted evidence', () => {
    const w = getDb().writtenSubmissions.find((x) => x.id === 'WS-1')!;
    expect(w.suggestions.every((s) => s.suggested > 0)).toBe(true);
    expect(w.suggestions[1].evidence).toMatch(/study/);
    const weak = getDb().writtenSubmissions.find((x) => x.id === 'WS-2')!;
    expect(weak.confidence).toBe('low');
  });

  it('hides marks from the student until the teacher releases them', () => {
    const lina: Actor = { kind: 'student', id: 'stu-lina' };
    expect(learn.writtenTask(lina, 'stu-lina', 'WT-ENG-1').submission!.suggestions).toHaveLength(0);
    const item = teach.markingItem(james, 'WS-1');
    teach.confirmMarks(james, 'WS-1', Object.fromEntries(item.suggestions.map((s) => [s.criterionId, s.max])), 'Excellent PEEL structure.');
    teach.releaseWritten(james, 'WT-ENG-1');
    const after = learn.writtenTask(lina, 'stu-lina', 'WT-ENG-1').submission!;
    expect(after.total).toBe(10);
    expect(after.teacherFeedback).toBe('Excellent PEEL structure.');
  });

  it('rejects marks outside the criterion range', () => {
    const item = teach.markingItem(james, 'WS-2');
    expect(() => teach.confirmMarks(james, 'WS-2', Object.fromEntries(item.suggestions.map((s) => [s.criterionId, s.max + 1])))).toThrow(ValidationError);
  });
});

describe('Attendance and discipline', () => {
  it('submits a lesson register and tells the family about an absence', () => {
    const reg = getDb().lessonRegisters.find((r) => r.status === 'open')!;
    teach.setPresence(nadia, reg.id, 'stu-sara', 'absent');
    const r = teach.submitRegister(nadia, reg.id);
    expect(r.absent).toBe(1);
    expect(getDb().notifications.some((n) => n.audience.id === 'g-fatima' && n.title === 'Absence recorded')).toBe(true);
  });

  it('does not let a teacher of another class take the register', () => {
    const reg = getDb().lessonRegisters[0];
    expect(() => teach.lessonRegister(daniel, reg.id)).toThrow(AccessDenied);
  });

  it('notifies parents of merits and shows them in the family record', () => {
    teach.awardPoint(nadia, { studentId: 'stu-sara', kind: 'merit', category: 'Effort', points: 2, note: 'Great persistence.', notifyParent: true });
    expect(learn.behaviourFor(fatima, 'stu-sara').merits).toBe(5);
    expect(getDb().notifications.some((n) => n.audience.id === 'g-fatima' && n.title.startsWith('Merit'))).toBe(true);
  });

  it('requires a note for a demerit and blocks students outside the teacher’s classes', () => {
    expect(() => teach.awardPoint(nadia, { studentId: 'stu-sara', kind: 'demerit', category: 'Uniform', points: 1, note: '', notifyParent: true })).toThrow(ValidationError);
    expect(() => teach.awardPoint(nadia, { studentId: 'stu-omar', kind: 'merit', category: 'Effort', points: 1, note: '', notifyParent: false })).toThrow(AccessDenied);
  });

  it('builds an exam plan that puts weaker topics first', () => {
    const plan = learn.examPlan(sara, 'stu-sara');
    const fractions = plan.tasks.filter((t) => t.examId === 'EX-1' && t.kind === 'read');
    expect(fractions[0].topicId).toBe('tp-unlike');
  });
});
