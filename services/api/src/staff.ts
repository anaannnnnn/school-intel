// Staff CRM API: teachers, pastoral, safeguarding, office, IT and leadership.

import type { Actor, CaseStatus, HomeworkItem, Incident, StaffRole } from '@school-intel/contracts';
import { audit, AccessDenied, canStaffSeeStudent, hasRole, requireRole, staffOf, ValidationError } from './access';
import { DEMO_DATE } from './seed';
import { getDb, mutate, nextId, nowIso } from './store';

const nameOf = (id: string) => getDb().staff.find((s) => s.id === id)?.name ?? id;
const studentName = (id: string) => getDb().students.find((s) => s.id === id)?.name ?? id;

/** Navigation areas by role. The API enforces the same boundaries. */
export const AREA_ROLES: Record<string, StaffRole[]> = {
  overview: ['teacher', 'pastoral', 'safeguarding', 'office', 'attendance', 'it', 'leadership'],
  copilot: ['teacher'],
  support: ['pastoral', 'teacher'],
  requests: ['office'],
  students: ['teacher', 'pastoral', 'safeguarding', 'office', 'attendance', 'it', 'leadership'],
  homework: ['teacher', 'leadership'],
  behaviour: ['teacher', 'pastoral', 'leadership'],
  safeguarding: ['safeguarding'],
  attendance: ['attendance', 'teacher', 'pastoral', 'leadership'],
  passport: ['teacher'],
  exams: ['teacher'],
  activities: ['teacher', 'office', 'leadership'],
  leadership: ['leadership'],
  integrations: ['it'],
  audit: ['it', 'leadership'],
};

export function canAccessArea(actor: Actor, area: string) {
  return hasRole(actor, ...(AREA_ROLES[area] ?? []));
}

export function me(actor: Actor) {
  return staffOf(actor);
}

export function staffDirectory() {
  return getDb().staff;
}

// ---------- Teacher Copilot (FR-T01–T04) ----------

export function drafts(actor: Actor) {
  const s = requireRole(actor, 'Teacher Copilot', 'teacher');
  const d = getDb();
  return d.drafts
    .filter((x) => x.teacherId === s.id && s.classIds.includes(x.classId))
    .map((x) => ({ ...x, student: d.students.find((st) => st.id === x.studentId)! }));
}

export function draft(actor: Actor, id: string) {
  const x = drafts(actor).find((y) => y.id === id);
  if (!x) throw new AccessDenied('This draft is not in your assigned classes.');
  return x;
}

export function saveDraftEdit(actor: Actor, id: string, text: string) {
  const current = draft(actor, id);
  if (current.state === 'published') throw new ValidationError('Published comments create a new draft version first.');
  const latest = current.versions.at(-1);
  if (latest && latest.text === text) return;
  mutate((d) => {
    const x = d.drafts.find((y) => y.id === id)!;
    x.versions.push({ version: (latest?.version ?? 0) + 1, text, editedBy: nameOf(actor.id), at: nowIso() });
    x.state = 'edited';
    audit(d, actor, `Edited draft · v${x.versions.length}`, `${studentName(x.studentId)} · ${x.subject}`);
  });
}

/** Regenerating a draft never invents content: no evidence means a missing-data warning. */
export function regenerateDraft(actor: Actor, id: string): { ok: boolean; message: string } {
  const current = draft(actor, id);
  if (current.evidence.length === 0) {
    mutate((d) => audit(d, actor, 'Draft generation refused · missing evidence', `${studentName(current.studentId)} · ${current.subject}`));
    return { ok: false, message: 'No published assessment exists in this reporting period. Add an authorised teacher note or write the comment manually.' };
  }
  return { ok: true, message: 'The draft already reflects all authorised evidence.' };
}

export function approveAndPublish(actor: Actor, id: string, checklist: boolean[]) {
  const current = draft(actor, id);
  if (current.state === 'missing-evidence' || current.versions.length === 0) throw new ValidationError('Write or generate a comment before approving.');
  if (checklist.length < 3 || checklist.some((c) => !c)) throw new ValidationError('Complete the review checklist before publishing.');
  return mutate((d) => {
    const x = d.drafts.find((y) => y.id === id)!;
    const at = nowIso();
    x.state = 'published';
    x.publishedAt = at;
    x.publishedVersion = x.versions.at(-1)!.version;
    const guardians = d.relationships.filter((r) => r.studentId === x.studentId && r.status === 'verified');
    for (const g of guardians) {
      d.notifications.unshift({
        id: nextId(d, 'N', 'n'),
        audience: { kind: 'guardian', id: g.guardianId },
        title: `${x.subject} report comment published`,
        body: `${studentName(x.studentId)} · ${x.period}. Open Learning to read it.`,
        at,
        read: false,
        link: '/learning',
      });
    }
    audit(d, actor, `Approved and published comment v${x.publishedVersion}`, `${studentName(x.studentId)} · ${x.subject}`);
    return { version: x.publishedVersion, at };
  });
}

export function reopenDraft(actor: Actor, id: string) {
  const current = draft(actor, id);
  if (current.state !== 'published') return;
  mutate((d) => {
    const x = d.drafts.find((y) => y.id === id)!;
    x.state = 'edited';
    audit(d, actor, 'Opened new draft version after publication', `${studentName(x.studentId)} · ${x.subject}`);
  });
}

// ---------- Student support (FR-S01–S04) ----------

export function supportCases(actor: Actor) {
  const s = requireRole(actor, 'Student support', 'pastoral', 'teacher');
  const d = getDb();
  // Assigned cases only: each owner sees the cases routed to them.
  return d.cases
    .filter((c) => c.ownerId === s.id)
    .map((c) => ({ ...c, student: d.students.find((st) => st.id === c.studentId)!, owner: nameOf(c.ownerId) }));
}

/** Aggregate queue health is visible to leadership without case detail. */
export function supportSummary() {
  const d = getDb();
  const open = d.cases.filter((c) => !['closed', 'dismissed'].includes(c.status));
  return {
    open: open.length,
    dueToday: open.filter((c) => c.reviewDue.startsWith(DEMO_DATE) || c.reviewDue.startsWith('2026-10-07')).length,
    awaitingData: open.filter((c) => c.status === 'insufficient-data').length,
    owned: open.filter((c) => !!c.ownerId).length,
  };
}

export function supportCase(actor: Actor, id: string) {
  const c = supportCases(actor).find((x) => x.id === id);
  if (!c) {
    mutate((d) => audit(d, actor, 'Access denied', id, 'denied'));
    throw new AccessDenied('This case is not assigned to you.');
  }
  return c;
}

const ACTION_STATUS: Record<string, CaseStatus> = {
  acknowledge: 'acknowledged',
  investigate: 'investigating',
  'support-plan': 'support-plan',
  dismiss: 'dismissed',
  close: 'closed',
  'check-in': 'investigating',
};

const ACTION_LABEL: Record<string, string> = {
  acknowledge: 'Acknowledged',
  investigate: 'Investigation started',
  'support-plan': 'Support plan agreed',
  dismiss: 'Dismissed',
  close: 'Closed',
  'check-in': 'Check-in outcome recorded',
};

export function caseAction(actor: Actor, id: string, action: keyof typeof ACTION_STATUS, note = '') {
  supportCase(actor, id);
  if ((action === 'dismiss' || action === 'close' || action === 'check-in') && !note.trim()) {
    throw new ValidationError('A reason or outcome is required for this action.');
  }
  mutate((d) => {
    const c = d.cases.find((x) => x.id === id)!;
    c.status = ACTION_STATUS[action];
    c.events.push({ at: nowIso(), label: ACTION_LABEL[action], by: nameOf(actor.id), note: note || undefined });
    audit(d, actor, `Support case · ${ACTION_LABEL[action]}`, id);
  });
}

export function togglePlanItem(actor: Actor, id: string, index: number) {
  supportCase(actor, id);
  mutate((d) => {
    const c = d.cases.find((x) => x.id === id)!;
    c.plan[index].done = !c.plan[index].done;
  });
}

export function addPlanItem(actor: Actor, id: string, text: string) {
  supportCase(actor, id);
  if (!text.trim()) return;
  mutate((d) => d.cases.find((x) => x.id === id)!.plan.push({ text, done: false }));
}

/**
 * Referral or rule alert. If the learner already has an open case the new
 * signal is merged into it instead of creating a duplicate (PRD P04 acceptance).
 */
export function referStudent(actor: Actor, studentId: string, reason: string) {
  staffOf(actor);
  if (!canStaffSeeStudent(actor, studentId)) throw new AccessDenied();
  if (!reason.trim()) throw new ValidationError('Describe what you observed.');
  return mutate((d) => {
    const open = d.cases.find((c) => c.studentId === studentId && !['closed', 'dismissed'].includes(c.status));
    const at = nowIso();
    if (open) {
      open.signals.push(`Staff referral: ${reason}`);
      open.events.push({ at, label: 'Referral merged into open case', by: nameOf(actor.id), note: reason });
      audit(d, actor, 'Referral merged into open case', open.id);
      return { id: open.id, merged: true };
    }
    const id = nextId(d, 'SC', 'SC', 4);
    d.cases.unshift({
      id, studentId, ownerId: 'st-aisha', rule: 'Staff referral', status: 'open', openedAt: at, reviewDue: '2026-10-08T15:00:00+04:00',
      signals: [`Staff referral: ${reason}`], missingData: [], plan: [],
      events: [{ at, label: 'Referral created', by: nameOf(actor.id), note: reason }],
    });
    d.notifications.unshift({ id: nextId(d, 'N', 'n'), audience: { kind: 'staff', id: 'st-aisha' }, title: `New referral ${id}`, body: `${studentName(studentId)} · assigned to you`, at, read: false, link: `/support/${id}` });
    audit(d, actor, 'Created staff referral', id);
    return { id, merged: false };
  });
}

/** Re-evaluate rules after an import. Dismissed, unchanged alerts stay suppressed. */
export function evaluateSupportRules() {
  return mutate((d) => {
    let merged = 0;
    for (const c of d.cases) {
      if (['closed', 'dismissed'].includes(c.status)) continue;
      c.events.push({ at: nowIso(), label: 'Rules re-evaluated · no duplicate created', by: 'Support rules' });
      merged++;
    }
    audit(d, 'Support rules', `Re-evaluated rules · ${merged} open cases updated, 0 duplicates`, 'Support queue');
    return { created: 0, merged };
  });
}

// ---------- Family requests ----------

export function officeRequests(actor: Actor) {
  requireRole(actor, 'Family requests', 'office');
  const d = getDb();
  return d.requests
    .map((r) => ({ ...r, student: d.students.find((s) => s.id === r.studentId)!, guardian: d.guardians.find((g) => g.id === r.guardianId)! }))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function officeRequest(actor: Actor, id: string) {
  const r = officeRequests(actor).find((x) => x.id === id);
  if (!r) throw new AccessDenied('Request not found.');
  return r;
}

function notifyGuardian(guardianId: string, title: string, body: string, link: string) {
  return (d: ReturnType<typeof getDb>) =>
    d.notifications.unshift({ id: nextId(d, 'N', 'n'), audience: { kind: 'guardian', id: guardianId }, title, body, at: nowIso(), read: false, link });
}

export function decideRequest(actor: Actor, id: string, decision: 'approve' | 'decline', note: string) {
  const r = officeRequest(actor, id);
  if (r.status !== 'awaiting-approval' && r.status !== 'in-progress') throw new ValidationError('This request has already been decided.');
  if (decision === 'decline' && !note.trim()) throw new ValidationError('Give the family a reason.');
  mutate((d) => {
    const x = d.requests.find((y) => y.id === id)!;
    const at = nowIso();
    if (decision === 'approve') {
      x.status = x.steps.length > 1 ? 'in-progress' : 'approved';
      x.steps[0] = { ...x.steps[0], done: true, at };
      if (x.type === 'early-collection') {
        x.steps[1] = { ...x.steps[1], done: true, at };
      }
    } else {
      x.status = 'declined';
    }
    x.messages.push({ at, from: 'staff', author: nameOf(actor.id), text: note || (decision === 'approve' ? 'Approved by the school office.' : 'Declined.') });
    notifyGuardian(x.guardianId, `${x.id} ${decision === 'approve' ? 'approved' : 'declined'}`, x.subject, `/requests/${x.id}`)(d);
    audit(d, actor, `Request ${decision === 'approve' ? 'approved' : 'declined'}`, x.id);
  });
}

export function completeRequestStep(actor: Actor, id: string, index: number) {
  const r = officeRequest(actor, id);
  if (r.status !== 'in-progress') throw new ValidationError('Approve the request first.');
  mutate((d) => {
    const x = d.requests.find((y) => y.id === id)!;
    x.steps[index] = { ...x.steps[index], done: true, at: nowIso() };
    if (x.steps.every((s) => s.done)) {
      x.status = 'approved';
      notifyGuardian(x.guardianId, `${x.id} confirmed`, `${x.subject} · all acknowledgements received`, `/requests/${x.id}`)(d);
    }
    audit(d, actor, `Recorded “${x.steps[index].label}”`, x.id);
  });
}

export function answerRequest(actor: Actor, id: string, text: string) {
  officeRequest(actor, id);
  if (!text.trim()) throw new ValidationError('Write a reply first.');
  mutate((d) => {
    const x = d.requests.find((y) => y.id === id)!;
    x.messages.push({ at: nowIso(), from: 'staff', author: nameOf(actor.id), text });
    if (x.type === 'question' || x.type === 'general') {
      x.status = 'answered';
      x.steps = x.steps.map((s) => ({ ...s, done: true, at: nowIso() }));
    }
    notifyGuardian(x.guardianId, `Reply on ${x.id}`, x.subject, `/requests/${x.id}`)(d);
    audit(d, actor, 'Replied to family', x.id);
  });
}

// ---------- Students and families ----------

export function studentDirectory(actor: Actor) {
  staffOf(actor);
  const d = getDb();
  return d.students
    .filter((s) => canStaffSeeStudent(actor, s.id))
    .map((s) => ({
      ...s,
      guardians: d.relationships.filter((r) => r.studentId === s.id).map((r) => ({ ...r, guardian: d.guardians.find((g) => g.id === r.guardianId)! })),
      openRequests: d.requests.filter((r) => r.studentId === s.id && ['awaiting-approval', 'in-progress'].includes(r.status)).length,
    }));
}

export function studentProfile(actor: Actor, studentId: string) {
  const entry = studentDirectory(actor).find((s) => s.id === studentId);
  if (!entry) {
    mutate((d) => audit(d, actor, 'Access denied', `Student ${studentId}`, 'denied'));
    throw new AccessDenied('This learner is not in your assigned classes.');
  }
  const d = getDb();
  const pastoral = hasRole(actor, 'pastoral');
  const openCase = d.cases.find((c) => c.studentId === studentId && !['closed', 'dismissed'].includes(c.status));
  const register = d.registers.find((r) => r.classId === entry.classId);
  return {
    ...entry,
    register,
    requests: hasRole(actor, 'office') ? d.requests.filter((r) => r.studentId === studentId) : [],
    comments: d.drafts.filter((x) => x.studentId === studentId && x.state === 'published'),
    assignments: d.assignments.filter((a) => a.classId === entry.classId),
    submissions: d.submissions.filter((x) => x.studentId === studentId),
    activities: d.activities.filter((a) => a.booked.includes(studentId) || a.waiting.includes(studentId)).map((a) => ({ name: a.name, status: a.booked.includes(studentId) ? 'Booked' : 'Waiting list' })),
    supportCase: openCase ? (pastoral && openCase.ownerId === actor.id ? { id: openCase.id, status: openCase.status } : { id: 'restricted', status: openCase.status }) : undefined,
  };
}

export function revokeGuardian(actor: Actor, guardianId: string, studentId: string, reason: string) {
  requireRole(actor, 'Guardian relationships', 'office', 'it');
  if (!reason.trim()) throw new ValidationError('Record the reason, for example a custody update from the SIS.');
  mutate((d) => {
    const r = d.relationships.find((x) => x.guardianId === guardianId && x.studentId === studentId);
    if (!r) throw new ValidationError('Relationship not found.');
    r.status = 'revoked';
    audit(d, actor, `Revoked guardian access · ${reason}`, `${d.guardians.find((g) => g.id === guardianId)?.name} → ${studentName(studentId)}`);
  });
}

export function restoreGuardian(actor: Actor, guardianId: string, studentId: string) {
  requireRole(actor, 'Guardian relationships', 'office', 'it');
  mutate((d) => {
    const r = d.relationships.find((x) => x.guardianId === guardianId && x.studentId === studentId)!;
    r.status = 'verified';
    r.verifiedAt = nowIso();
    audit(d, actor, 'Restored verified guardian access', `${d.guardians.find((g) => g.id === guardianId)?.name} → ${studentName(studentId)}`);
  });
}

// ---------- Homework (FR-H01–H04) ----------

export const HOMEWORK_THRESHOLD = 120;

export function homework(actor: Actor, yearGroup = 9) {
  requireRole(actor, 'Homework planner', 'teacher', 'leadership');
  return getDb().homework.filter((h) => h.yearGroup === yearGroup);
}

export function eveningLoad(items: HomeworkItem[], includeProposed = true) {
  const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'];
  return days.map((day) => {
    const list = items.filter((h) => h.evening === day && (includeProposed || h.status === 'published'));
    return { day, minutes: list.reduce((s, h) => s + h.minutes, 0), items: list };
  });
}

export function moveHomework(actor: Actor, id: string, evening: string, due: string) {
  requireRole(actor, 'Homework planner', 'teacher');
  mutate((d) => {
    const h = d.homework.find((x) => x.id === id)!;
    h.evening = evening;
    h.due = due;
    h.status = 'published';
    h.overrideReason = undefined;
    audit(d, actor, `Published with moved deadline (${due})`, `${h.subject} · ${h.title}`);
  });
}

export function overrideHomework(actor: Actor, id: string, reason: string) {
  requireRole(actor, 'Homework planner', 'teacher');
  if (!reason.trim()) throw new ValidationError('An override needs a reason for the year coordinator.');
  mutate((d) => {
    const h = d.homework.find((x) => x.id === id)!;
    h.status = 'published';
    h.overrideReason = reason;
    d.notifications.unshift({ id: nextId(d, 'N', 'n'), audience: { kind: 'staff', id: 'st-samira' }, title: 'Homework threshold override', body: `${h.subject} · Year ${h.yearGroup}: ${reason}`, at: nowIso(), read: false, link: '/homework' });
    audit(d, actor, `Threshold override · ${reason}`, `${h.subject} · ${h.title}`);
  });
}

export function proposeHomework(actor: Actor, input: Omit<HomeworkItem, 'id' | 'status'>) {
  requireRole(actor, 'Homework planner', 'teacher');
  if (!input.minutes || input.minutes <= 0) throw new ValidationError('Every task needs a duration estimate.');
  return mutate((d) => {
    const id = nextId(d, 'HW', 'HW', 1);
    d.homework.push({ ...input, id, status: 'proposed' });
    return id;
  });
}

// ---------- Behaviour (FR-B01–B04) ----------

export function incidents(actor: Actor) {
  requireRole(actor, 'Behaviour', 'teacher', 'pastoral', 'leadership');
  return [...getDb().incidents].sort((a, b) => b.at.localeCompare(a.at));
}

export function recordIncident(actor: Actor, input: Pick<Incident, 'location' | 'kind' | 'description' | 'verified'>) {
  requireRole(actor, 'Behaviour', 'teacher', 'pastoral');
  if (!input.description.trim() || !input.location.trim()) throw new ValidationError('Location and description are required.');
  return mutate((d) => {
    const id = nextId(d, 'BI', 'BI');
    d.incidents.unshift({ ...input, id, at: nowIso(), recordedBy: nameOf(actor.id), version: 1 });
    audit(d, actor, `Recorded ${input.kind === 'positive' ? 'positive observation' : 'incident'}`, id);
    return id;
  });
}

export function verifyIncident(actor: Actor, id: string) {
  requireRole(actor, 'Behaviour', 'pastoral');
  mutate((d) => {
    const i = d.incidents.find((x) => x.id === id)!;
    i.verified = true;
    i.version += 1;
    audit(d, actor, `Verified incident · amendment v${i.version}`, id);
  });
}

// ---------- Safeguarding (restricted boundary) ----------

export function concerns(actor: Actor) {
  requireRole(actor, 'Safeguarding workspace', 'safeguarding');
  const d = getDb();
  return d.concerns.map((c) => ({ ...c, student: d.students.find((s) => s.id === c.studentId)! }));
}

export function concern(actor: Actor, id: string) {
  const c = concerns(actor).find((x) => x.id === id);
  if (!c) throw new AccessDenied('Case not found.');
  return c;
}

export function concernAction(actor: Actor, id: string, action: 'acknowledge' | 'schedule' | 'note' | 'status' | 'close', text = '') {
  const c = concern(actor, id);
  if (action !== 'acknowledge' && !text.trim()) throw new ValidationError('Add the detail for this action.');
  if (action === 'close' && !c.events.some((e) => e.label.startsWith('Restricted action'))) {
    throw new ValidationError('Closure requires at least one recorded action and a safe follow-up plan.');
  }
  mutate((d) => {
    const x = d.concerns.find((y) => y.id === id)!;
    const at = nowIso();
    const by = nameOf(actor.id);
    if (action === 'acknowledge') {
      x.status = 'acknowledged';
      x.studentStatus = 'A staff member is reviewing your concern.';
      x.events.push({ at, label: 'Acknowledged', by });
    } else if (action === 'schedule') {
      x.status = 'check-in-scheduled';
      x.studentStatus = 'A member of staff will speak with you privately soon.';
      x.events.push({ at, label: `Private check-in scheduled · ${text}`, by });
    } else if (action === 'note') {
      x.events.push({ at, label: 'Restricted action recorded', by, note: text });
    } else if (action === 'status') {
      x.studentStatus = text;
      x.events.push({ at, label: 'Student-facing status updated', by, note: text });
    } else {
      x.status = 'closed';
      x.studentStatus = 'Staff have followed up on your concern. You can always speak up again.';
      x.events.push({ at, label: 'Closed with safe follow-up plan', by, note: text });
    }
    audit(d, actor, `Safeguarding · ${action}`, id);
  });
}

// ---------- Attendance (FR-A01–A04) ----------

export function attendance(actor: Actor) {
  requireRole(actor, 'Attendance', 'attendance', 'teacher', 'pastoral', 'leadership');
  const d = getDb();
  const complete = d.registers.filter((r) => r.status === 'complete');
  const present = complete.reduce((s, r) => s + r.recorded, 0);
  const absences = 3; // synthetic: confirmed absences across complete registers
  return {
    registers: d.registers.map((r) => ({ ...r, label: d.classes.find((c) => c.id === r.classId)?.label ?? r.classId })),
    explanations: d.explanations.map((e) => ({ ...e, student: studentName(e.studentId), guardian: d.guardians.find((g) => g.id === e.guardianId)?.name ?? '' })),
    presentRate: present ? ((present - absences) / present) * 100 : 0,
    pending: d.registers.filter((r) => r.status === 'pending').length,
    canAmend: hasRole(actor, 'attendance'),
  };
}

export function completeRegister(actor: Actor, id: string) {
  const s = requireRole(actor, 'Attendance', 'attendance', 'teacher');
  const r = getDb().registers.find((x) => x.id === id)!;
  if (!s.roles.includes('attendance') && !s.classIds.includes(r.classId)) throw new AccessDenied('Only the class teacher or an attendance officer can complete this register.');
  mutate((d) => {
    const x = d.registers.find((y) => y.id === id)!;
    x.recorded = x.total;
    x.status = 'complete';
    x.updatedAt = nowIso();
    for (const c of d.cases) {
      if (c.status === 'insufficient-data' && d.students.find((st) => st.id === c.studentId)?.classId === x.classId) {
        c.status = 'open';
        c.missingData = [];
        c.events.push({ at: nowIso(), label: 'Register complete · rule evaluation resumed', by: 'Support rules' });
      }
    }
    audit(d, actor, 'Completed register', id);
  });
}

export function reviewExplanation(actor: Actor, id: string, decision: 'accepted' | 'queried') {
  requireRole(actor, 'Official register', 'attendance');
  mutate((d) => {
    const e = d.explanations.find((x) => x.id === id)!;
    e.status = decision;
    const req = d.requests.find((r) => r.type === 'absence-explanation' && r.studentId === e.studentId && r.status !== 'approved');
    if (req && decision === 'accepted') {
      req.status = 'approved';
      req.steps = req.steps.map((s) => ({ ...s, done: true, at: nowIso() }));
    }
    audit(d, actor, decision === 'accepted' ? 'Accepted explanation · register amended (authorised absence)' : 'Queried explanation with guardian', `${id} · ${studentName(e.studentId)}`);
  });
}

// ---------- Learning passport ----------

export function passports(actor: Actor) {
  const s = requireRole(actor, 'Learning passport', 'teacher');
  const d = getDb();
  return d.passports.filter((p) => s.classIds.includes(d.students.find((st) => st.id === p.studentId)?.classId ?? '')).map((p) => ({ ...p, student: d.students.find((st) => st.id === p.studentId)! }));
}

export function setPassportApproval(actor: Actor, studentId: string, approved: boolean) {
  passports(actor);
  mutate((d) => {
    const p = d.passports.find((x) => x.studentId === studentId)!;
    p.approvedBy = approved ? nameOf(actor.id) : undefined;
    p.approvedAt = approved ? nowIso() : undefined;
    audit(d, actor, approved ? 'Approved learning summary for sharing' : 'Withdrew learning summary from family view', studentName(studentId));
  });
}

// ---------- Exams and submissions ----------

export function classSubmissions(actor: Actor) {
  const s = requireRole(actor, 'Submissions', 'teacher');
  const d = getDb();
  return d.submissions
    .filter((x) => s.classIds.includes(d.students.find((st) => st.id === x.studentId)?.classId ?? ''))
    .map((x) => ({ ...x, student: studentName(x.studentId), assignment: d.assignments.find((a) => a.id === x.assignmentId)?.title ?? x.assignmentId }));
}

export function markSubmissionReviewed(actor: Actor, id: string) {
  classSubmissions(actor);
  mutate((d) => {
    d.submissions.find((x) => x.id === id)!.teacherReview = 'reviewed';
    audit(d, actor, 'Reviewed submission', id);
  });
}

// ---------- Activities (FR-X01–X04) ----------

export function activities(actor: Actor) {
  requireRole(actor, 'Activities', 'teacher', 'office', 'leadership');
  const d = getDb();
  return d.activities.map((a) => ({ ...a, coach: nameOf(a.coachId) }));
}

export function offerWaitingPlace(actor: Actor, activityId: string) {
  requireRole(actor, 'Activities', 'office');
  mutate((d) => {
    const a = d.activities.find((x) => x.id === activityId)!;
    if (a.booked.length >= a.capacity) {
      a.capacity += 1;
    }
    const next = a.waiting.shift();
    if (next) a.booked.push(next);
    audit(d, actor, 'Promoted waiting-list place (offer accepted)', a.name);
  });
}

// ---------- Integrations ----------

export function connectors(actor: Actor) {
  requireRole(actor, 'Integrations', 'it', 'leadership');
  const d = getDb();
  return { connectors: d.connectors, quarantine: d.quarantine, demo: d.demo };
}

export function setDemoFlag(actor: Actor, flag: 'lmsOutage' | 'staleBus' | 'failPrimaryDelivery', value: boolean) {
  requireRole(actor, 'Integrations', 'it');
  mutate((d) => {
    d.demo[flag] = value;
    if (flag === 'lmsOutage') {
      const c = d.connectors.find((x) => x.system === 'LMS')!;
      c.status = value ? 'outage' : 'healthy';
      if (!value) c.lastSuccess = nowIso();
    }
    audit(d, actor, `Simulation · ${flag} ${value ? 'on' : 'off'}`, 'Integrations');
  });
}

export function resolveQuarantine(actor: Actor, id: string, mappedTo: string) {
  requireRole(actor, 'Integrations', 'it');
  if (!mappedTo) throw new ValidationError('Choose the canonical student record.');
  mutate((d) => {
    const q = d.quarantine.find((x) => x.id === id)!;
    q.status = 'resolved';
    audit(d, actor, `Mapped ${q.sourceId} → ${studentName(mappedTo)} · ${q.rows} rows reprocessed`, 'Identity mapping');
  });
}

export function runImport(actor: Actor, system: 'SIS' | 'LMS') {
  requireRole(actor, 'Integrations', 'it');
  mutate((d) => {
    const c = d.connectors.find((x) => x.system === system)!;
    if (c.status === 'outage') {
      audit(d, actor, `${system} import failed · vendor unavailable`, 'Integrations');
      return;
    }
    c.lastSuccess = nowIso();
    audit(d, actor, `${system} import completed · idempotent, 0 duplicates`, 'Integrations');
  });
}

// ---------- Leadership ----------

export function leadershipMetrics(actor: Actor) {
  requireRole(actor, 'Leadership overview', 'leadership');
  const d = getDb();
  const att = attendanceRate();
  const s = supportSummary();
  const drafts = d.drafts;
  return {
    attendance: { value: att.rate, numerator: att.present, denominator: att.total, owner: 'Attendance officer', freshness: d.connectors.find((c) => c.system === 'SIS')!.lastSuccess },
    support: { open: s.open, owned: s.owned, owner: 'Pastoral team' },
    drafts: { published: drafts.filter((x) => x.state === 'published').length, total: drafts.length, owner: 'Department leads' },
    requests: { open: d.requests.filter((r) => ['awaiting-approval', 'in-progress'].includes(r.status)).length, total: d.requests.length, owner: 'School office' },
    pendingRegisters: d.registers.filter((r) => r.status === 'pending').length,
    quarantined: d.quarantine.filter((q) => q.status === 'quarantined').length,
  };
}

function attendanceRate() {
  const d = getDb();
  const complete = d.registers.filter((r) => r.status === 'complete');
  const total = complete.reduce((s, r) => s + r.total, 0);
  const present = total - 3;
  return { rate: total ? (present / total) * 100 : 0, present, total };
}

// ---------- Audit and notifications ----------

export function auditLog(actor: Actor) {
  requireRole(actor, 'Audit log', 'it', 'leadership');
  return getDb().audit;
}

export function overviewFor(actor: Actor) {
  const s = staffOf(actor);
  const d = getDb();
  return {
    staff: s,
    drafts: s.roles.includes('teacher') ? d.drafts.filter((x) => x.teacherId === s.id) : [],
    cases: d.cases.filter((c) => c.ownerId === s.id && !['closed', 'dismissed'].includes(c.status)),
    requests: s.roles.includes('office') ? d.requests.filter((r) => ['awaiting-approval', 'in-progress'].includes(r.status)) : [],
    concerns: s.roles.includes('safeguarding') ? d.concerns.filter((c) => c.status !== 'closed') : [],
    registers: d.registers.filter((r) => r.status === 'pending' && (s.roles.includes('attendance') || s.classIds.includes(r.classId))),
    quarantine: s.roles.includes('it') ? d.quarantine.filter((q) => q.status === 'quarantined') : [],
  };
}

/** Record a blocked navigation to a restricted area (shown in the audit log). */
export function recordDenied(actor: Actor, area: string) {
  mutate((d) => audit(d, actor, 'Access denied', `Workspace area · ${area}`, 'denied'));
}
