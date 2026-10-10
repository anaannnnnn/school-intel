// The shape of the school database document (a JSON object stored in school.db).

import type {
  Activity,
  AbsenceExplanation,
  Assessment,
  Attempt,
  AttendanceDay,
  BehaviourPoint,
  ChatMessage,
  ScoreEntry,
  Doubt,
  ExamEvent,
  LessonRegister,
  Material,
  PastPaper,
  Period,
  Question,
  Subject,
  Topic,
  WrittenSubmission,
  WrittenTask,
  Assignment,
  AuditEvent,
  BusRoute,
  Circular,
  ConcernReport,
  Connector,
  FamilyPreferences,
  FamilyRequest,
  FeedItem,
  Guardian,
  GuardianRelationship,
  HomeworkItem,
  Incident,
  LearningPassport,
  Notification,
  QuarantinedRow,
  Register,
  ReportDraft,
  SchoolClass,
  StaffMember,
  Student,
  Submission,
  SupportCase,
} from '@school-intel/contracts';

export interface Db {
  version: number;
  /** Content hash of the school database this state was loaded from. A new release resets local changes. */
  dataVersion?: string;
  staff: StaffMember[];
  students: Student[];
  guardians: Guardian[];
  relationships: GuardianRelationship[];
  classes: SchoolClass[];
  feed: FeedItem[];
  drafts: ReportDraft[];
  cases: SupportCase[];
  requests: FamilyRequest[];
  circulars: Circular[];
  assignments: Assignment[];
  submissions: Submission[];
  passports: LearningPassport[];
  concerns: ConcernReport[];
  registers: Register[];
  explanations: AbsenceExplanation[];
  incidents: Incident[];
  homework: HomeworkItem[];
  activities: Activity[];
  routes: BusRoute[];
  connectors: Connector[];
  quarantine: QuarantinedRow[];
  notifications: Notification[];
  audit: AuditEvent[];
  preferences: Record<string, FamilyPreferences>;
  consents: Record<string, ISOConsent>;
  // Learning, assessment and records (schema v4)
  subjects: Subject[];
  topics: Topic[];
  materials: Material[];
  questions: Question[];
  pastPapers: PastPaper[];
  assessments: Assessment[];
  attempts: Attempt[];
  writtenTasks: WrittenTask[];
  writtenSubmissions: WrittenSubmission[];
  doubts: Doubt[];
  examEvents: ExamEvent[];
  periods: Period[];
  lessonRegisters: LessonRegister[];
  attendanceHistory: Record<string, AttendanceDay[]>;
  behaviourPoints: BehaviourPoint[];
  /** Completed study-plan task IDs per student. */
  planDone: Record<string, string[]>;
  /** Report-card scores per student. */
  scorecards: Record<string, ScoreEntry[]>;
  chat: ChatMessage[];
  /** Last-read time per `kind:id` per room. */
  chatRead: Record<string, Record<string, string>>;
  counters: Record<string, number>;
  demo: { lmsOutage: boolean; staleBus: boolean; failPrimaryDelivery: boolean };
}

export interface ISOConsent {
  key: string;
  studentId: string;
  label: string;
  given: boolean;
  at?: string;
}
