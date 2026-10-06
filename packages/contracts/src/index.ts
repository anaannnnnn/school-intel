// Shared data contracts for School Intelligence.
// Every imported record keeps its source system, source ID and freshness
// (PRD §16 record contract). The platform owns drafts, workflow states and audit.

export type ISODate = string;

export type SourceSystem = 'SIS' | 'LMS' | 'Transport' | 'Platform';

export interface SourceRef {
  system: SourceSystem;
  recordId: string;
  updatedAt: ISODate;
}

export type Phase = 'MVP' | 'Phase 2' | 'Phase 3';

// ---------- Identity and access ----------

export type StaffRole =
  | 'teacher'
  | 'pastoral'
  | 'safeguarding'
  | 'office'
  | 'attendance'
  | 'it'
  | 'leadership';

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  initials: string;
  roles: StaffRole[];
  classIds: string[];
  email: string;
}

export interface Student {
  id: string;
  sisId: string;
  name: string;
  firstName: string;
  classId: string;
  yearGroup: number;
  initials: string;
}

export interface Guardian {
  id: string;
  name: string;
  firstName: string;
  email: string;
  phone: string;
}

export interface GuardianRelationship {
  guardianId: string;
  studentId: string;
  status: 'verified' | 'revoked';
  relationship: string;
  verifiedAt: ISODate;
}

export interface SchoolClass {
  id: string;
  label: string;
  yearGroup: number;
  tutorId: string;
}

export type Actor =
  | { kind: 'guardian'; id: string }
  | { kind: 'student'; id: string }
  | { kind: 'staff'; id: string };

// ---------- Family feed ----------

export type FeedKind = 'attendance' | 'homework' | 'activity' | 'action' | 'circular' | 'report';

export interface FeedItem {
  id: string;
  studentId: string;
  kind: FeedKind;
  title: string;
  detail: string;
  minutes?: number;
  due?: ISODate;
  status: 'confirmed' | 'pending' | 'action-needed' | 'done';
  source: SourceRef;
}

// ---------- Teacher Copilot ----------

export type DraftState = 'missing-evidence' | 'draft' | 'edited' | 'approved' | 'published';

export interface Evidence {
  id: string;
  label: string;
  date: ISODate;
  value: string;
  source: SourceRef;
}

export interface DraftVersion {
  version: number;
  text: string;
  editedBy: string;
  at: ISODate;
}

export interface ReportDraft {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  period: string;
  teacherId: string;
  state: DraftState;
  versions: DraftVersion[];
  evidence: Evidence[];
  publishedAt?: ISODate;
  publishedVersion?: number;
}

// ---------- Student support ----------

export type CaseStatus =
  | 'open'
  | 'acknowledged'
  | 'investigating'
  | 'support-plan'
  | 'insufficient-data'
  | 'dismissed'
  | 'closed';

export interface CaseEvent {
  at: ISODate;
  label: string;
  by: string;
  note?: string;
}

export interface SupportCase {
  id: string;
  studentId: string;
  ownerId: string;
  rule: string;
  status: CaseStatus;
  openedAt: ISODate;
  reviewDue: ISODate;
  signals: string[];
  missingData: string[];
  plan: { text: string; done: boolean }[];
  events: CaseEvent[];
}

// ---------- Family requests (office CRM) ----------

export type RequestType = 'early-collection' | 'question' | 'absence-explanation' | 'general';

export type RequestStatus = 'awaiting-approval' | 'in-progress' | 'approved' | 'declined' | 'answered' | 'withdrawn';

export interface RequestMessage {
  at: ISODate;
  from: 'guardian' | 'staff';
  author: string;
  text: string;
}

export interface FamilyRequest {
  id: string;
  type: RequestType;
  guardianId: string;
  studentId: string;
  subject: string;
  details: Record<string, string>;
  status: RequestStatus;
  submittedAt: ISODate;
  assignedTo: string;
  steps: { label: string; done: boolean; at?: ISODate }[];
  messages: RequestMessage[];
}

// ---------- Concierge ----------

export interface Circular {
  id: string;
  title: string;
  issued: ISODate;
  validUntil: ISODate;
  yearGroups: number[];
  keywords: string[];
  answer: string;
  approved: boolean;
}

export interface ConciergeAnswer {
  kind: 'answer' | 'historical' | 'personal' | 'unknown';
  text: string;
  circular?: Circular;
}

// ---------- Assignments and submissions ----------

export interface Assignment {
  id: string;
  classId: string;
  subject: string;
  title: string;
  instructions: string[];
  due: ISODate;
  minutes: number;
  acceptsSubmission: boolean;
  source: SourceRef;
}

export type SubmissionState = 'pending' | 'received' | 'processing' | 'accepted' | 'rejected';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileName: string;
  sizeBytes: number;
  version: number;
  state: SubmissionState;
  acceptedAt?: ISODate;
  checksum: string;
  teacherReview: 'pending' | 'reviewed';
}

// ---------- Learning passport ----------

export type Mastery = 'secure' | 'developing' | 'practice' | 'insufficient';

export interface Objective {
  id: string;
  label: string;
  mastery: Mastery;
  sources: number;
}

export interface LearningPassport {
  studentId: string;
  subject: string;
  objectives: Objective[];
  practice: string[];
  nextCheckpoint: ISODate;
  latest: string;
  approvedBy?: string;
  approvedAt?: ISODate;
}

// ---------- Confidential help (restricted boundary) ----------

export interface ConcernReport {
  id: string;
  studentId: string;
  category: string;
  description: string;
  whenWhere: string;
  contactPreference: string;
  attachments: number;
  receivedAt: ISODate;
  status: 'received' | 'acknowledged' | 'check-in-scheduled' | 'closed';
  studentStatus: string;
  dutyLeadId: string;
  backupId: string;
  primaryDelivery: 'delivered' | 'failed';
  events: CaseEvent[];
}

// ---------- Attendance ----------

export interface Register {
  id: string;
  classId: string;
  period: string;
  recorded: number;
  total: number;
  status: 'complete' | 'pending';
  updatedAt: ISODate;
}

export interface AbsenceExplanation {
  id: string;
  studentId: string;
  guardianId: string;
  reason: string;
  date: ISODate;
  receivedAt: ISODate;
  status: 'awaiting-review' | 'accepted' | 'queried';
  hasAttachment: boolean;
}

// ---------- Behaviour ----------

export interface Incident {
  id: string;
  at: ISODate;
  location: string;
  kind: 'concern' | 'positive';
  description: string;
  verified: boolean;
  recordedBy: string;
  version: number;
}

// ---------- Homework ----------

export interface HomeworkItem {
  id: string;
  yearGroup: number;
  subject: string;
  title: string;
  minutes: number;
  evening: ISODate; // the evening the work is expected to be done (day before due)
  due: ISODate;
  status: 'published' | 'proposed';
  overrideReason?: string;
}

// ---------- Activities ----------

export interface Activity {
  id: string;
  name: string;
  yearGroups: string;
  schedule: string;
  location: string;
  coachId: string;
  capacity: number;
  booked: string[];
  waiting: string[];
  consentRequired: boolean;
}

// ---------- Transport ----------

export interface BusRoute {
  id: string;
  label: string;
  service: string;
  lastLocationAt: ISODate;
  etaFrom: string;
  etaTo: string;
  boarding: Record<string, ISODate | undefined>;
}

// ---------- Integrations ----------

export interface Connector {
  id: string;
  system: SourceSystem;
  name: string;
  scope: string;
  mode: string;
  status: 'healthy' | 'degraded' | 'outage' | 'not-enabled';
  lastSuccess: ISODate;
  records: number;
}

export interface QuarantinedRow {
  id: string;
  sourceId: string;
  issue: string;
  rows: number;
  status: 'quarantined' | 'resolved';
}

// ---------- Notifications and audit ----------

export interface Notification {
  id: string;
  audience: Actor;
  title: string;
  body: string;
  at: ISODate;
  read: boolean;
  link?: string;
  heldForQuietHours?: boolean;
}

export interface AuditEvent {
  id: string;
  at: ISODate;
  actor: string;
  action: string;
  target: string;
  outcome: 'allowed' | 'denied';
}

export interface FamilyPreferences {
  language: 'en' | 'ar';
  quietStart: string;
  quietEnd: string;
  digest: string;
  homework: boolean;
  circulars: boolean;
  activities: boolean;
}
