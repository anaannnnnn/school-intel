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
  | 'leadership'
  | 'admin';

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
  /** Section letter within the grade, for example A. */
  section?: string;
  rollNo?: number;
  gender?: 'F' | 'M';
  dob?: string;
  house?: string;
  bloodGroup?: string;
  busRoute?: string;
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
  /** Learning group that shares subjects, notes and papers: every section of a grade (or grade and stream). */
  cohort?: string;
  section?: string;
  stream?: string;
  room?: string;
}

/** A demo login: a login ID that maps to one person. */
export interface Account {
  loginId: string;
  kind: 'student' | 'guardian' | 'staff';
  id: string;
  label: string;
  /** Heading under which the account is listed, for example "Class 9 · CBSE". */
  group: string;
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

// ======================================================================
// Learning platform: materials, doubts, question bank, assessments,
// past papers, exam planning, AI-assisted marking.
// ======================================================================

export interface Subject {
  id: string;
  name: string;
  short: string;
  classId: string;
  teacherId: string;
  hue: number; // used for the subject tile colour
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

export type MaterialKind = 'notes' | 'video' | 'worksheet' | 'slides' | 'textbook' | 'revision' | 'sample-paper';

export interface Material {
  id: string;
  subjectId: string;
  topicId: string;
  title: string;
  kind: MaterialKind;
  body: string; // paragraphs separated by blank lines
  minutes: number;
  status: 'draft' | 'published';
  aiGenerated: boolean;
  createdBy: string;
  updatedAt: ISODate;
}

export type QuestionType = 'mcq' | 'numeric' | 'short';

export interface RubricPoint {
  id: string;
  criterion: string;
  marks: number;
  keywords: string[];
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  answer: string; // option index for mcq, value for numeric, model answer for short
  explanation: string;
  marks: number;
  difficulty: 1 | 2 | 3;
  status: 'approved' | 'draft';
  aiGenerated: boolean;
  rubric?: RubricPoint[];
  paperId?: string;
}

export type AssessmentKind = 'quiz' | 'test' | 'mock';

export interface Assessment {
  id: string;
  kind: AssessmentKind;
  title: string;
  subjectId: string;
  classId: string;
  questionIds: string[];
  durationMin?: number;
  opensAt: ISODate;
  closesAt?: ISODate;
  status: 'draft' | 'scheduled' | 'open' | 'closed';
  resultsReleased: boolean;
  paperId?: string;
  createdBy: string;
}

export interface MarkSuggestion {
  criterionId: string;
  criterion: string;
  max: number;
  suggested: number;
  awarded?: number;
  evidence: string;
  rationale: string;
}

export interface AttemptItem {
  questionId: string;
  answer: string;
  max: number;
  awarded?: number;
  correct?: boolean;
  status: 'auto' | 'ai-suggested' | 'confirmed';
  suggestions?: MarkSuggestion[];
  confidence?: 'high' | 'medium' | 'low';
}

export interface Attempt {
  id: string;
  assessmentId: string;
  studentId: string;
  startedAt: ISODate;
  submittedAt?: ISODate;
  items: AttemptItem[];
  status: 'in-progress' | 'submitted' | 'marked' | 'released';
  teacherComment?: string;
}

export interface PastPaper {
  id: string;
  board: string;
  subjectId: string;
  year: number;
  session: string;
  title: string;
  questionIds: string[];
  licence: string;
}

export interface DoubtMessage {
  from: 'student' | 'ai' | 'teacher';
  author: string;
  text: string;
  steps?: string[];
  sources?: string[];
  at: ISODate;
}

export interface Doubt {
  id: string;
  studentId: string;
  subjectId: string;
  topicId?: string;
  question: string;
  messages: DoubtMessage[];
  status: 'ai-answered' | 'escalated' | 'teacher-answered' | 'resolved';
  createdAt: ISODate;
}

export interface ExamEvent {
  id: string;
  classId: string;
  subjectId: string;
  title: string;
  date: ISODate;
  topicIds: string[];
}

export interface WrittenTask {
  id: string;
  classId: string;
  subjectId: string;
  topicId: string;
  title: string;
  prompt: string;
  due: ISODate;
  rubric: RubricPoint[];
  minWords: number;
}

export interface WrittenSubmission {
  id: string;
  taskId: string;
  studentId: string;
  text: string;
  submittedAt: ISODate;
  suggestions: MarkSuggestion[];
  confidence: 'high' | 'medium' | 'low';
  aiFeedback: string;
  teacherFeedback?: string;
  status: 'ai-suggested' | 'confirmed' | 'released';
}

// ---------- Timetable, lesson attendance, discipline ----------

export interface Period {
  id: string;
  classId: string;
  subjectId: string;
  day: number; // 1 = Monday
  start: string;
  end: string;
  room: string;
}

export type Presence = 'present' | 'late' | 'absent' | 'excused';

export interface LessonRegister {
  id: string;
  periodId: string;
  date: string;
  marks: Record<string, Presence>;
  takenBy?: string;
  takenAt?: ISODate;
  status: 'open' | 'submitted';
}

export interface AttendanceDay {
  date: string;
  status: Presence;
}

export interface BehaviourPoint {
  id: string;
  studentId: string;
  kind: 'merit' | 'demerit';
  category: string;
  points: number;
  note: string;
  by: string;
  at: ISODate;
  parentNotified: boolean;
}

// ---------- Report cards ----------

export interface ScoreEntry {
  subjectId: string;
  exam: string;
  marks: number;
  max: number;
}

// ---------- Chat rooms ----------

export type ChatPartyKind = 'student' | 'guardian' | 'staff';

/** A room is either a class room (`class:<classId>`) or a direct thread (`dm:<keyA>|<keyB>`, keys are `kind:id`, sorted). */
export interface ChatMessage {
  id: string;
  roomId: string;
  fromKind: ChatPartyKind;
  fromId: string;
  fromName: string;
  text: string;
  at: ISODate;
  /** Set when a teacher sent one message to a whole class. */
  broadcast?: { classId: string; audience: 'students' | 'parents' | 'both' };
}

