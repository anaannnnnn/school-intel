// PRD acceptance scenarios exercised against the demo API.
import { beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '@school-intel/contracts';
import { AccessDenied, ValidationError } from './access';
import * as family from './family';
import * as staff from './staff';
import { getDb, resetData } from './store';

const fatima: Actor = { kind: 'guardian', id: 'g-fatima' };
const khalid: Actor = { kind: 'guardian', id: 'g-khalid' };
const sara: Actor = { kind: 'student', id: 'stu-sara' };
const nadia: Actor = { kind: 'staff', id: 'st-nadia' };
const aisha: Actor = { kind: 'staff', id: 'st-aisha' };
const layla: Actor = { kind: 'staff', id: 'st-layla' };
const karim: Actor = { kind: 'staff', id: 'st-karim' };

beforeEach(() => resetData());

describe('P01 Teacher Copilot', () => {
  it('never shows an unapproved comment to parents', () => {
    expect(family.publishedComments(fatima, 'stu-sara')).toHaveLength(0);
    staff.saveDraftEdit(nadia, 'd-sara', 'Edited but not approved.');
    expect(family.publishedComments(fatima, 'stu-sara')).toHaveLength(0);
  });

  it('requires the full checklist, then publishes only the selected student', () => {
    expect(() => staff.approveAndPublish(nadia, 'd-sara', [true, true, false])).toThrow(ValidationError);
    staff.approveAndPublish(nadia, 'd-sara', [true, true, true]);
    expect(family.publishedComments(fatima, 'stu-sara')).toHaveLength(1);
    expect(getDb().drafts.find((d) => d.id === 'd-hamdan')!.state).toBe('draft');
  });

  it('returns a missing-data warning instead of inventing a draft', () => {
    const r = staff.regenerateDraft(nadia, 'd-yusuf');
    expect(r.ok).toBe(false);
    expect(() => staff.approveAndPublish(nadia, 'd-yusuf', [true, true, true])).toThrow(ValidationError);
  });

  it('keeps every revision when a draft is edited', () => {
    staff.saveDraftEdit(nadia, 'd-sara', 'Version three.');
    expect(getDb().drafts.find((d) => d.id === 'd-sara')!.versions.map((v) => v.version)).toEqual([1, 2, 3]);
  });

  it('limits drafts to the teacher’s assigned classes', () => {
    expect(() => staff.drafts(layla)).toThrow(AccessDenied);
  });
});

describe('P02 Family feed and guardian access', () => {
  it('denies access to an unlinked child and audits the attempt', () => {
    expect(() => family.feed(khalid, 'stu-sara')).toThrow(AccessDenied);
    expect(getDb().audit[0].outcome).toBe('denied');
  });

  it('removes access on the next request after a guardian link is revoked', () => {
    expect(family.feed(fatima, 'stu-adam').items.length).toBeGreaterThan(0);
    staff.revokeGuardian(layla, 'g-fatima', 'stu-adam', 'Custody update from SIS');
    expect(() => family.feed(fatima, 'stu-adam')).toThrow(AccessDenied);
    expect(family.familyProfile(fatima).children.map((c) => c.id)).toEqual(['stu-sara']);
  });

  it('marks LMS items stale during an outage rather than newly confirmed', () => {
    staff.setDemoFlag(karim, 'lmsOutage', true);
    const items = family.feed(fatima, 'stu-sara').items;
    expect(items.filter((i) => i.source.system === 'LMS').every((i) => i.stale)).toBe(true);
    expect(items.filter((i) => i.source.system === 'SIS').every((i) => !i.stale)).toBe(true);
  });

  it('repeated imports do not duplicate feed items', () => {
    const before = family.feed(fatima, 'stu-sara').items.length;
    staff.runImport(karim, 'LMS');
    staff.runImport(karim, 'LMS');
    expect(family.feed(fatima, 'stu-sara').items.length).toBe(before);
  });
});

describe('P04 Student support', () => {
  it('merges a new referral into the existing open case', () => {
    const before = getDb().cases.length;
    const r = staff.referStudent(nadia, 'stu-yusuf', 'Seemed withdrawn in class.');
    expect(r).toEqual({ id: 'SC-1043', merged: true });
    expect(getDb().cases.length).toBe(before);
  });

  it('requires a reason to dismiss and records it', () => {
    expect(() => staff.caseAction(aisha, 'SC-1042', 'dismiss', '')).toThrow(ValidationError);
    staff.caseAction(aisha, 'SC-1042', 'dismiss', 'Explained by planned family travel.');
    expect(getDb().cases.find((c) => c.id === 'SC-1042')!.events.at(-1)!.note).toContain('family travel');
  });

  it('only shows assigned cases', () => {
    expect(staff.supportCases(nadia)).toHaveLength(0);
    expect(() => staff.supportCase(nadia, 'SC-1042')).toThrow(AccessDenied);
  });

  it('resumes paused rules once the register is complete', () => {
    expect(getDb().cases.find((c) => c.id === 'SC-1044')!.status).toBe('insufficient-data');
    staff.completeRegister(layla, 'REG-9C');
    expect(getDb().cases.find((c) => c.id === 'SC-1044')!.status).toBe('open');
  });
});

describe('P06 Confidential help', () => {
  it('stores the report even when primary delivery fails, routes to backup, and hides details from previews', () => {
    staff.setDemoFlag(karim, 'failPrimaryDelivery', true);
    const r = family.reportConcern(sara, {
      category: 'Online behaviour', description: 'Unkind messages after school.', whenWhere: 'Yesterday', contactPreference: 'Break', attachments: 0, acknowledgedLimits: true,
    });
    expect(r.primaryDelivery).toBe('failed');
    const notes = getDb().notifications.filter((n) => n.title === 'New restricted concern' && n.body.startsWith(r.id));
    expect(notes.map((n) => n.audience.id).sort()).toEqual(['st-aisha', 'st-daniel']);
    expect(notes.every((n) => !n.body.includes('Unkind'))).toBe(true);
  });

  it('is invisible to staff without the safeguarding role', () => {
    expect(() => staff.concerns(nadia)).toThrow(AccessDenied);
    expect(staff.concerns(aisha).length).toBeGreaterThan(0);
  });

  it('cannot be closed without a recorded action', () => {
    const r = family.reportConcern(sara, { category: 'Other', description: 'x', whenWhere: '', contactPreference: '', attachments: 0, acknowledgedLimits: true });
    expect(() => staff.concernAction(aisha, r.id, 'close', 'Plan agreed')).toThrow(ValidationError);
    staff.concernAction(aisha, r.id, 'note', 'Spoke with student.');
    staff.concernAction(aisha, r.id, 'close', 'Weekly check-in for a month.');
    expect(family.myConcerns(sara).find((c) => c.id === r.id)!.closed).toBe(true);
  });
});

describe('P07 Concierge', () => {
  it('answers from a current approved circular with its source', () => {
    const a = family.askConcierge(fatima, 'stu-sara', 'What does Sara need for sports day?');
    expect(a.kind).toBe('answer');
    expect(a.circular?.id).toBe('CIR-0214');
  });

  it('labels expired circulars as historical', () => {
    expect(family.askConcierge(fatima, 'stu-sara', 'When is the swimming gala?').kind).toBe('historical');
  });

  it('routes personal arrangements and unknown questions to staff', () => {
    expect(family.askConcierge(fatima, 'stu-sara', 'Can Sara leave before sports day finishes?').kind).toBe('personal');
    expect(family.askConcierge(fatima, 'stu-sara', 'Who painted the mural?').kind).toBe('unknown');
  });

  it('does not confirm early collection until approval and acknowledgements', () => {
    const req = family.createRequest(fatima, {
      type: 'early-collection', studentId: 'stu-sara', subject: 'Early collection · Sara', message: '',
      details: { Date: '15 October 2026', Time: '11:00', Reason: 'Medical appointment', Collector: 'Fatima Ahmed' },
    });
    expect(req.id).toBe('REQ-084');
    staff.decideRequest(layla, req.id, 'approve', '');
    expect(family.getRequest(fatima, req.id).status).toBe('in-progress');
    staff.completeRequestStep(layla, req.id, 2);
    staff.completeRequestStep(layla, req.id, 3);
    expect(family.getRequest(fatima, req.id).status).toBe('approved');
  });
});

describe('P09 Submissions', () => {
  it('issues a receipt on acceptance and is idempotent on retry', () => {
    const file = { name: 'report.pdf', size: 1_800_000, checksum: 'abc' };
    const a = family.acceptSubmission(sara, 'SCI-7A-014', file);
    const b = family.acceptSubmission(sara, 'SCI-7A-014', file);
    expect(a.id).toBe(b.id);
    const c = family.acceptSubmission(sara, 'SCI-7A-014', { ...file, checksum: 'def' });
    expect(c.version).toBe(2);
  });

  it('rejects unsupported files', () => {
    expect(() => family.acceptSubmission(sara, 'SCI-7A-014', { name: 'x.exe', size: 10, checksum: 'z' })).toThrow(ValidationError);
  });
});

describe('P11 Activities', () => {
  it('books the final place once, then uses the waiting list', () => {
    expect(family.bookActivity(fatima, 'ACT-BB', 'stu-sara', true).result).toBe('booked');
    getDb().students.push({ id: 'stu-new', sisId: 'x', name: 'New Learner', firstName: 'New', classId: '7A', yearGroup: 7, initials: 'NL' });
    getDb().relationships.push({ guardianId: 'g-fatima', studentId: 'stu-new', status: 'verified', relationship: 'Mother', verifiedAt: '' });
    expect(family.bookActivity(fatima, 'ACT-BB', 'stu-new', true)).toEqual({ result: 'waiting', position: 1 });
  });

  it('requires consent', () => {
    expect(() => family.bookActivity(fatima, 'ACT-BB', 'stu-sara', false)).toThrow(ValidationError);
  });
});
