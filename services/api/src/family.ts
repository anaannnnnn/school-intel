// Parent and student API (family mobile web app).

import type {
  Actor,
  Circular,
  ConciergeAnswer,
  FamilyPreferences,
  FamilyRequest,
  FeedItem,
  RequestType,
  Submission,
} from '@school-intel/contracts';
import { audit, AccessDenied, linkedStudentIds, requireFamilyAccess, ValidationError } from './access';
import { DEMO_DATE } from './seed';
import { getDb, mutate, nextId, nowIso } from './store';

// ---------- Identity ----------

export const GUARDIAN_INVITE_CODE = '482106';

export function verifyGuardianInvitation(code: string): Actor {
  if (code.trim() !== GUARDIAN_INVITE_CODE) throw new ValidationError('That code does not match the invitation. Check the latest message from the school.');
  mutate((d) => audit(d, 'Fatima Ahmed', 'Verified guardian invitation', 'g-fatima'));
  return { kind: 'guardian', id: 'g-fatima' };
}

export function familyProfile(actor: Actor) {
  const d = getDb();
  if (actor.kind === 'guardian') {
    const guardian = d.guardians.find((g) => g.id === actor.id);
    if (!guardian) throw new AccessDenied();
    const ids = linkedStudentIds(d, actor.id);
    return { name: guardian.name, firstName: guardian.firstName, role: 'Parent' as const, children: d.students.filter((s) => ids.includes(s.id)) };
  }
  if (actor.kind === 'student') {
    const s = d.students.find((x) => x.id === actor.id);
    if (!s) throw new AccessDenied();
    return { name: s.name, firstName: s.firstName, role: 'Student' as const, children: [s] };
  }
  throw new AccessDenied();
}

// ---------- Daily feed (FR-F01, FR-F02) ----------

export interface FeedView {
  items: (FeedItem & { stale: boolean })[];
  lmsStale: boolean;
  lastSync: Record<string, string>;
}

export function feed(actor: Actor, studentId: string): FeedView {
  requireFamilyAccess(actor, studentId);
  const d = getDb();
  const lmsStale = d.demo.lmsOutage;
  const published: FeedItem[] = d.drafts
    .filter((x) => x.studentId === studentId && x.state === 'published' && x.publishedAt?.startsWith(DEMO_DATE))
    .map((x) => ({
      id: `rep-${x.id}`,
      studentId,
      kind: 'report',
      title: `${x.subject} report comment published`,
      detail: `${x.period} · approved by ${d.staff.find((s) => s.id === x.teacherId)?.name ?? 'teacher'}`,
      status: 'confirmed',
      source: { system: 'Platform', recordId: x.id, updatedAt: x.publishedAt! },
    }));
  const items = [...d.feed.filter((f) => f.studentId === studentId), ...published].map((f) => ({
    ...f,
    status: f.kind === 'action' && consentGiven(studentId, f.source.recordId) ? ('done' as const) : f.status,
    stale: lmsStale && f.source.system === 'LMS',
  }));
  const conn = Object.fromEntries(d.connectors.map((c) => [c.system, c.lastSuccess]));
  return { items, lmsStale, lastSync: conn };
}

function consentGiven(studentId: string, key: string) {
  return !!getDb().consents[`${key}:${studentId}`]?.given;
}

export function consentFor(actor: Actor, studentId: string, key: string) {
  requireFamilyAccess(actor, studentId);
  return getDb().consents[`${key}:${studentId}`];
}

export function giveConsent(actor: Actor, studentId: string, key: string) {
  requireFamilyAccess(actor, studentId);
  if (actor.kind !== 'guardian') throw new AccessDenied('Only a verified guardian can give consent.');
  mutate((d) => {
    const c = d.consents[`${key}:${studentId}`];
    if (!c) throw new ValidationError('No consent request found.');
    c.given = true;
    c.at = nowIso();
    audit(d, actor, 'Gave consent', `${key} · ${studentId}`);
  });
}

// ---------- Concierge (FR-Q01–Q04) ----------

const PERSONAL = ['leave early', 'leave before', 'pick up', 'pickup', 'collect', 'collection', 'my child', 'grade', 'marks', 'absent', 'sick', 'late', 'appointment'];

function score(c: Circular, q: string) {
  return c.keywords.reduce((s, k) => (q.includes(k) ? s + k.length : s), 0);
}

export function askConcierge(actor: Actor, studentId: string, question: string): ConciergeAnswer {
  const student = requireFamilyAccess(actor, studentId);
  const q = ` ${question.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ')} `;
  const d = getDb();
  if (PERSONAL.some((p) => q.includes(p))) {
    return {
      kind: 'personal',
      text: 'Approved documents do not cover personal arrangements. Collection changes and individual questions need a member of staff, so I can help you send a request to the school office.',
    };
  }
  const eligible = d.circulars.filter((c) => c.approved && c.yearGroups.includes(student.yearGroup));
  const ranked = eligible.map((c) => ({ c, s: score(c, q) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  const best = ranked[0]?.c;
  if (!best) {
    return { kind: 'unknown', text: 'We could not confirm an answer from approved school documents. You can send this question to the school office instead of relying on an unverified answer.' };
  }
  if (best.validUntil < `${DEMO_DATE}T00:00:00+04:00`) {
    return { kind: 'historical', text: best.answer, circular: best };
  }
  return { kind: 'answer', text: best.answer.replace(/Students should/, `${student.firstName} should`), circular: best };
}

// ---------- Requests (office CRM) ----------

export function myRequests(actor: Actor): FamilyRequest[] {
  if (actor.kind !== 'guardian') return [];
  const d = getDb();
  const ids = linkedStudentIds(d, actor.id);
  return d.requests.filter((r) => r.guardianId === actor.id && ids.includes(r.studentId)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getRequest(actor: Actor, id: string): FamilyRequest {
  const r = getDb().requests.find((x) => x.id === id);
  if (!r || actor.kind !== 'guardian' || r.guardianId !== actor.id) throw new AccessDenied('This request is not linked to your account.');
  requireFamilyAccess(actor, r.studentId);
  return r;
}

export interface NewRequest {
  type: RequestType;
  studentId: string;
  subject: string;
  details: Record<string, string>;
  message: string;
}

const STEPS: Record<RequestType, string[]> = {
  'early-collection': ['Office approval', 'Class teacher notified', 'Security acknowledgement', 'Transport update'],
  question: ['Office reply'],
  'absence-explanation': ['Attendance officer review', 'Register amended if accepted'],
  general: ['Office reply'],
};

export function createRequest(actor: Actor, input: NewRequest): FamilyRequest {
  requireFamilyAccess(actor, input.studentId);
  if (actor.kind !== 'guardian') throw new AccessDenied('Requests are submitted by verified guardians.');
  if (input.type === 'early-collection') {
    for (const k of ['Date', 'Time', 'Reason', 'Collector']) {
      if (!input.details[k]?.trim()) throw new ValidationError(`${k} is required.`);
    }
  }
  return mutate((d) => {
    const g = d.guardians.find((x) => x.id === actor.id)!;
    const req: FamilyRequest = {
      id: nextId(d, 'REQ', 'REQ'),
      type: input.type,
      guardianId: actor.id,
      studentId: input.studentId,
      subject: input.subject,
      details: input.details,
      status: 'awaiting-approval',
      submittedAt: nowIso(),
      assignedTo: 'st-layla',
      steps: STEPS[input.type].map((label) => ({ label, done: false })),
      messages: input.message ? [{ at: nowIso(), from: 'guardian', author: g.name, text: input.message }] : [],
    };
    d.requests.unshift(req);
    d.notifications.unshift({
      id: nextId(d, 'N', 'n'),
      audience: { kind: 'staff', id: 'st-layla' },
      title: `New family request ${req.id}`,
      body: `${req.subject} · ${d.students.find((s) => s.id === req.studentId)?.name}`,
      at: nowIso(),
      read: false,
      link: `/requests/${req.id}`,
    });
    audit(d, actor, 'Submitted request', req.id);
    return req;
  });
}

export function withdrawRequest(actor: Actor, id: string) {
  const r = getRequest(actor, id);
  if (r.status !== 'awaiting-approval') throw new ValidationError('Only requests awaiting approval can be withdrawn. Call the school office for urgent changes.');
  mutate((d) => {
    const x = d.requests.find((y) => y.id === id)!;
    x.status = 'withdrawn';
    x.messages.push({ at: nowIso(), from: 'guardian', author: d.guardians.find((g) => g.id === actor.id)!.name, text: 'Request withdrawn.' });
    audit(d, actor, 'Withdrew request', id);
  });
}

export function replyToRequest(actor: Actor, id: string, text: string) {
  getRequest(actor, id);
  if (!text.trim()) throw new ValidationError('Write a message first.');
  mutate((d) => {
    const x = d.requests.find((y) => y.id === id)!;
    x.messages.push({ at: nowIso(), from: 'guardian', author: d.guardians.find((g) => g.id === actor.id)!.name, text });
  });
}

// ---------- Learning ----------

export function passport(actor: Actor, studentId: string) {
  requireFamilyAccess(actor, studentId);
  const p = getDb().passports.find((x) => x.studentId === studentId);
  return p?.approvedBy ? p : undefined; // unapproved summaries are never shown (FR-L02)
}

export function publishedComments(actor: Actor, studentId: string) {
  requireFamilyAccess(actor, studentId);
  const d = getDb();
  return d.drafts
    .filter((x) => x.studentId === studentId && x.state === 'published')
    .map((x) => ({
      id: x.id,
      subject: x.subject,
      period: x.period,
      text: x.versions.find((v) => v.version === x.publishedVersion)?.text ?? '',
      publishedAt: x.publishedAt!,
      teacher: d.staff.find((s) => s.id === x.teacherId)?.name ?? '',
    }));
}

export function assignmentsFor(actor: Actor, studentId: string) {
  const s = requireFamilyAccess(actor, studentId);
  const d = getDb();
  return d.assignments
    .filter((a) => a.classId === s.classId)
    .map((a) => ({ ...a, stale: d.demo.lmsOutage, submission: latestSubmission(studentId, a.id) }))
    .sort((a, b) => a.due.localeCompare(b.due));
}

function latestSubmission(studentId: string, assignmentId: string): Submission | undefined {
  return getDb()
    .submissions.filter((x) => x.studentId === studentId && x.assignmentId === assignmentId)
    .sort((a, b) => b.version - a.version)[0];
}

export const SUBMISSION_RULES = { maxBytes: 20 * 1024 * 1024, types: ['pdf', 'docx'] };

export function validateFile(name: string, size: number) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (!SUBMISSION_RULES.types.includes(ext)) throw new ValidationError('Only PDF or DOCX files are accepted.');
  if (size > SUBMISSION_RULES.maxBytes) throw new ValidationError('The file is larger than 20 MB.');
  if (size === 0) throw new ValidationError('The file is empty.');
}

/**
 * Server acceptance (FR-E01/E02). The client only calls this once the transfer
 * has completed; the returned receipt is the proof of acceptance. An identical
 * retry (same checksum) returns the existing receipt instead of a duplicate.
 */
export function acceptSubmission(actor: Actor, assignmentId: string, file: { name: string; size: number; checksum: string }): Submission {
  if (actor.kind !== 'student') throw new AccessDenied('Only the student can submit their own work.');
  const s = requireFamilyAccess(actor, actor.id);
  const a = getDb().assignments.find((x) => x.id === assignmentId && x.classId === s.classId);
  if (!a || !a.acceptsSubmission) throw new AccessDenied('This assignment is not available to you.');
  validateFile(file.name, file.size);
  const existing = latestSubmission(actor.id, assignmentId);
  if (existing && existing.checksum === file.checksum) return existing;
  return mutate((d) => {
    const sub: Submission = {
      id: nextId(d, 'SUB', 'SUB', 4),
      assignmentId,
      studentId: actor.id,
      fileName: file.name,
      sizeBytes: file.size,
      version: (existing?.version ?? 0) + 1,
      state: 'accepted',
      acceptedAt: nowIso(),
      checksum: file.checksum,
      teacherReview: 'pending',
    };
    d.submissions.push(sub);
    audit(d, actor, `Submission accepted · version ${sub.version}`, `${assignmentId} · ${sub.id}`);
    return sub;
  });
}

export function submissionsFor(actor: Actor, assignmentId: string) {
  if (actor.kind !== 'student' && actor.kind !== 'guardian') throw new AccessDenied();
  const ids = actor.kind === 'student' ? [actor.id] : linkedStudentIds(getDb(), actor.id);
  return getDb().submissions.filter((x) => x.assignmentId === assignmentId && ids.includes(x.studentId)).sort((a, b) => b.version - a.version);
}

// ---------- Confidential help (FR-C01–C04) ----------

export interface NewConcern {
  category: string;
  description: string;
  whenWhere: string;
  contactPreference: string;
  attachments: number;
  acknowledgedLimits: boolean;
}

export function reportConcern(actor: Actor, input: NewConcern) {
  if (actor.kind !== 'student') throw new AccessDenied('Confidential help is available to students.');
  if (!input.acknowledgedLimits) throw new ValidationError('Please confirm you have read how confidentiality works.');
  if (!input.description.trim()) throw new ValidationError('Tell us what happened so staff can help.');
  return mutate((d) => {
    const failed = d.demo.failPrimaryDelivery;
    const id = nextId(d, 'SG', 'SG');
    const at = nowIso();
    d.concerns.unshift({
      id,
      studentId: actor.id,
      category: input.category,
      description: input.description,
      whenWhere: input.whenWhere,
      contactPreference: input.contactPreference,
      attachments: input.attachments,
      receivedAt: at,
      status: 'received',
      studentStatus: 'Your report is stored. An authorised member of staff will review it.',
      dutyLeadId: 'st-aisha',
      backupId: 'st-daniel',
      primaryDelivery: failed ? 'failed' : 'delivered',
      events: [
        { at, label: 'Report stored · restricted evidence', by: 'System' },
        failed
          ? { at, label: 'Primary notification failed · backup duty lead routed', by: 'System' }
          : { at, label: 'Duty staff notified · delivered', by: 'System' },
      ],
    });
    // Notification previews never contain the allegation (FR-C02).
    const notify = (staffId: string) =>
      d.notifications.unshift({
        id: nextId(d, 'N', 'n'),
        audience: { kind: 'staff', id: staffId },
        title: 'New restricted concern',
        body: `${id} requires duty review. Details are only visible in the safeguarding workspace.`,
        at,
        read: false,
        link: `/safeguarding/${id}`,
      });
    notify(failed ? 'st-daniel' : 'st-aisha');
    if (failed) notify('st-aisha');
    audit(d, 'System', 'Restricted concern stored and routed', id);
    return { id, receivedAt: at, primaryDelivery: failed ? 'failed' : 'delivered' };
  });
}

/** Students only ever see the safe status, never staff notes. */
export function myConcerns(actor: Actor) {
  if (actor.kind !== 'student') return [];
  return getDb()
    .concerns.filter((c) => c.studentId === actor.id)
    .map((c) => ({ id: c.id, category: c.category, receivedAt: c.receivedAt, studentStatus: c.studentStatus, closed: c.status === 'closed' }));
}

// ---------- Activities (FR-X01–X02) ----------

export function activitiesFor(actor: Actor, studentId: string) {
  const s = requireFamilyAccess(actor, studentId);
  const d = getDb();
  return d.activities
    .filter((a) => {
      const m = a.yearGroups.match(/(\d+)–(\d+)/);
      return !m || (s.yearGroup >= Number(m[1]) && s.yearGroup <= Number(m[2]));
    })
    .map((a) => ({
      ...a,
      coach: d.staff.find((x) => x.id === a.coachId)?.name ?? '',
      placesLeft: Math.max(0, a.capacity - a.booked.length),
      status: a.booked.includes(studentId) ? ('booked' as const) : a.waiting.includes(studentId) ? ('waiting' as const) : ('none' as const),
      waitingPosition: a.waiting.indexOf(studentId) + 1,
    }));
}

/** Capacity is checked inside the atomic mutation, so the final place is only taken once. */
export function bookActivity(actor: Actor, activityId: string, studentId: string, consent: boolean) {
  requireFamilyAccess(actor, studentId);
  if (actor.kind !== 'guardian') throw new AccessDenied('Bookings need a verified guardian.');
  return mutate((d) => {
    const a = d.activities.find((x) => x.id === activityId);
    if (!a) throw new ValidationError('Activity not found.');
    if (a.consentRequired && !consent) throw new ValidationError('Guardian consent is required for this activity.');
    if (a.booked.includes(studentId)) return { result: 'booked' as const };
    if (a.booked.length < a.capacity) {
      a.booked.push(studentId);
      audit(d, actor, 'Booked activity with consent', `${a.name} · ${studentId}`);
      return { result: 'booked' as const };
    }
    if (!a.waiting.includes(studentId)) a.waiting.push(studentId);
    audit(d, actor, 'Joined waiting list', `${a.name} · ${studentId}`);
    return { result: 'waiting' as const, position: a.waiting.indexOf(studentId) + 1 };
  });
}

export function cancelBooking(actor: Actor, activityId: string, studentId: string) {
  requireFamilyAccess(actor, studentId);
  mutate((d) => {
    const a = d.activities.find((x) => x.id === activityId)!;
    a.booked = a.booked.filter((x) => x !== studentId);
    a.waiting = a.waiting.filter((x) => x !== studentId);
    audit(d, actor, 'Cancelled activity booking', `${a.name} · ${studentId}`);
  });
}

// ---------- Transport (FR-O01–O03) ----------

export function busFor(actor: Actor, studentId: string) {
  requireFamilyAccess(actor, studentId);
  const d = getDb();
  if (studentId !== 'stu-sara') return undefined; // only assigned routes are visible
  const r = d.routes[0];
  return { ...r, stale: d.demo.staleBus, boardedAt: r.boarding[studentId] };
}

// ---------- Preferences and notifications ----------

const DEFAULT_PREFS: FamilyPreferences = { language: 'en', quietStart: '20:00', quietEnd: '07:00', digest: '18:00', homework: true, circulars: true, activities: true };

export function preferences(actor: Actor): FamilyPreferences {
  return getDb().preferences[actor.id] ?? DEFAULT_PREFS;
}

export function savePreferences(actor: Actor, prefs: FamilyPreferences) {
  if (actor.kind === 'staff') throw new AccessDenied();
  mutate((d) => {
    d.preferences[actor.id] = prefs;
    audit(d, actor, 'Updated notification preferences', actor.id);
  });
}

export function notificationsFor(actor: Actor) {
  return getDb().notifications.filter((n) => n.audience.kind === actor.kind && n.audience.id === actor.id);
}

export function markNotificationsRead(actor: Actor) {
  mutate((d) => d.notifications.forEach((n) => n.audience.kind === actor.kind && n.audience.id === actor.id && (n.read = true)));
}

export function tonightPlan(actor: Actor, studentId: string) {
  const items = feed(actor, studentId).items.filter((i) => i.kind === 'homework');
  return { items, minutes: items.reduce((s, i) => s + (i.minutes ?? 0), 0) };
}
