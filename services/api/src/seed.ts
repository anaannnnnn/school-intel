// Fictional demonstration data. Horizon Learning School and every person,
// student and number below are invented, following the Figma design project.
// Do not replace with real student records.

import type {
  Activity,
  AbsenceExplanation,
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

export const SCHOOL = {
  id: 'horizon',
  name: 'Horizon Learning School',
  shortName: 'Horizon Learning',
  timezone: 'Asia/Dubai',
};

/** The demo is pinned to the PRD date: Tuesday 6 October 2026, Dubai time. */
export const DEMO_DATE = '2026-10-06';
export const t = (date: string, time: string) => `${date}T${time}:00+04:00`;
const today = (time: string) => t(DEMO_DATE, time);

export interface Db {
  version: number;
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

const src = (system: 'SIS' | 'LMS' | 'Transport' | 'Platform', recordId: string, updatedAt: string) => ({
  system,
  recordId,
  updatedAt,
});

const student = (id: string, name: string, classId: string, sisId: string): Student => {
  const [first, last] = name.split(' ');
  return {
    id,
    sisId,
    name,
    firstName: first,
    classId,
    yearGroup: Number(classId.replace(/\D/g, '')),
    initials: `${first[0]}${last[0]}`,
  };
};

export function createSeed(): Db {
  const staff: StaffMember[] = [
    { id: 'st-nadia', name: 'Nadia Farooq', title: 'Mathematics teacher · Year 7 tutor', initials: 'NF', roles: ['teacher'], classIds: ['7A'], email: 'nadia.farooq@horizon.example' },
    { id: 'st-aisha', name: 'Aisha Rahman', title: 'Head of pastoral care · Designated safeguarding lead', initials: 'AR', roles: ['pastoral', 'safeguarding'], classIds: [], email: 'aisha.rahman@horizon.example' },
    { id: 'st-daniel', name: 'Daniel Reed', title: 'PE teacher · Pastoral support', initials: 'DR', roles: ['teacher', 'pastoral'], classIds: ['8B'], email: 'daniel.reed@horizon.example' },
    { id: 'st-layla', name: 'Layla Haddad', title: 'School office manager · Attendance officer', initials: 'LH', roles: ['office', 'attendance'], classIds: [], email: 'layla.haddad@horizon.example' },
    { id: 'st-karim', name: 'Karim Mansour', title: 'School IT administrator', initials: 'KM', roles: ['it'], classIds: [], email: 'karim.mansour@horizon.example' },
    { id: 'st-samira', name: 'Samira Qureshi', title: 'Principal', initials: 'SQ', roles: ['leadership'], classIds: [], email: 'samira.qureshi@horizon.example' },
  ];

  const students: Student[] = [
    student('stu-sara', 'Sara Ahmed', '7A', 'SIS-1007'),
    student('stu-adam', 'Adam Ahmed', '4B', 'SIS-1188'),
    student('stu-omar', 'Omar Khan', '8B', 'SIS-0954'),
    student('stu-lina', 'Lina Hassan', '7A', 'SIS-1012'),
    student('stu-yusuf', 'Yusuf Ali', '7A', 'SIS-1019'),
    student('stu-maya', 'Maya Said', '9C', 'SIS-0871'),
    student('stu-hamdan', 'Hamdan Saleh', '7A', 'SIS-1021'),
    student('stu-zara', 'Zara Malik', '7A', 'SIS-1025'),
    student('stu-ibrahim', 'Ibrahim Noor', '7A', 'SIS-1030'),
    student('stu-noor', 'Noor Aziz', '7A', 'SIS-1033'),
    student('stu-leo', 'Leo Martins', '7A', 'SIS-1036'),
    student('stu-hana', 'Hana Yousef', '7A', 'SIS-1040'),
  ];

  const guardians: Guardian[] = [
    { id: 'g-fatima', name: 'Fatima Ahmed', firstName: 'Fatima', email: 'fatima.ahmed@family.example', phone: '+971 50 000 0101' },
    { id: 'g-khalid', name: 'Khalid Khan', firstName: 'Khalid', email: 'khalid.khan@family.example', phone: '+971 50 000 0102' },
    { id: 'g-rania', name: 'Rania Hassan', firstName: 'Rania', email: 'rania.hassan@family.example', phone: '+971 50 000 0103' },
    { id: 'g-ali', name: 'Mariam Ali', firstName: 'Mariam', email: 'mariam.ali@family.example', phone: '+971 50 000 0104' },
  ];

  const relationships: GuardianRelationship[] = [
    { guardianId: 'g-fatima', studentId: 'stu-sara', status: 'verified', relationship: 'Mother', verifiedAt: t('2026-08-24', '10:02') },
    { guardianId: 'g-fatima', studentId: 'stu-adam', status: 'verified', relationship: 'Mother', verifiedAt: t('2026-08-24', '10:02') },
    { guardianId: 'g-khalid', studentId: 'stu-omar', status: 'verified', relationship: 'Father', verifiedAt: t('2026-08-25', '08:40') },
    { guardianId: 'g-rania', studentId: 'stu-lina', status: 'verified', relationship: 'Mother', verifiedAt: t('2026-08-26', '19:12') },
    { guardianId: 'g-ali', studentId: 'stu-yusuf', status: 'verified', relationship: 'Mother', verifiedAt: t('2026-08-27', '09:31') },
  ];

  const classes: SchoolClass[] = [
    { id: '7A', label: 'Year 7A', yearGroup: 7, tutorId: 'st-nadia' },
    { id: '4B', label: 'Year 4B', yearGroup: 4, tutorId: 'st-layla' },
    { id: '8B', label: 'Year 8B', yearGroup: 8, tutorId: 'st-daniel' },
    { id: '9C', label: 'Year 9C', yearGroup: 9, tutorId: 'st-daniel' },
  ];

  const feed: FeedItem[] = [
    { id: 'f-1', studentId: 'stu-sara', kind: 'attendance', title: 'Present', detail: 'Register confirmed 08:15', status: 'confirmed', source: src('SIS', 'REG-7A-0610-P1', today('08:15')) },
    { id: 'f-2', studentId: 'stu-sara', kind: 'homework', title: 'Mathematics practice', detail: 'Equivalent fractions worksheet · due tomorrow', minutes: 25, due: t('2026-10-07', '08:00'), status: 'pending', source: src('LMS', 'MATH-7A-031', today('09:10')) },
    { id: 'f-3', studentId: 'stu-sara', kind: 'homework', title: 'Science revision', detail: 'States of matter flashcards', minutes: 20, due: t('2026-10-07', '08:00'), status: 'pending', source: src('LMS', 'SCI-7A-013', today('09:10')) },
    { id: 'f-4', studentId: 'stu-sara', kind: 'homework', title: 'English reading', detail: 'Chapter 4 · reading log', minutes: 15, due: t('2026-10-07', '08:00'), status: 'pending', source: src('LMS', 'ENG-7A-022', today('09:10')) },
    { id: 'f-5', studentId: 'stu-sara', kind: 'activity', title: 'Basketball', detail: '15:15–16:15 · Sports hall', status: 'confirmed', source: src('Platform', 'ACT-BB-0610', today('07:00')) },
    { id: 'f-6', studentId: 'stu-sara', kind: 'action', title: 'Museum visit consent', detail: 'Trip on 15 Oct · consent requested by 10 Oct · AED 150 via payment portal', due: t('2026-10-10', '23:59'), status: 'action-needed', source: src('Platform', 'TRIP-7-MUSEUM', t('2026-10-02', '12:00')) },
    { id: 'f-7', studentId: 'stu-adam', kind: 'attendance', title: 'Present', detail: 'Register confirmed 08:10', status: 'confirmed', source: src('SIS', 'REG-4B-0610-P1', today('08:10')) },
    { id: 'f-8', studentId: 'stu-adam', kind: 'homework', title: 'Reading journal', detail: 'Two pages about your favourite book · due tomorrow', minutes: 15, due: t('2026-10-07', '08:00'), status: 'pending', source: src('LMS', 'ENG-4B-011', today('09:10')) },
    { id: 'f-9', studentId: 'stu-adam', kind: 'activity', title: 'Pickup 14:30', detail: 'Primary dismissal · Gate 2', status: 'confirmed', source: src('Platform', 'DISMISS-4B', today('07:00')) },
  ];

  const drafts: ReportDraft[] = [
    {
      id: 'd-sara', studentId: 'stu-sara', classId: '7A', subject: 'Mathematics', period: 'Term 1', teacherId: 'st-nadia', state: 'edited',
      versions: [
        { version: 1, text: 'Sara simplifies fractions accurately. Converting unlike denominators is a practice focus.', editedBy: 'Teacher Copilot', at: today('08:52') },
        { version: 2, text: 'Sara confidently simplifies fractions and explains her method. Converting unlike denominators remains a practice focus. Three 15-minute exercises are recommended before the next checkpoint.', editedBy: 'Nadia Farooq', at: today('09:05') },
      ],
      evidence: [
        { id: 'e-1', label: 'Fractions quiz', date: t('2026-10-02', '10:20'), value: '7/10', source: src('LMS', 'QZ-7A-FRAC-01', t('2026-10-02', '15:00')) },
        { id: 'e-2', label: 'Classwork', date: t('2026-10-05', '10:20'), value: 'Denominator conversion · teacher marked', source: src('LMS', 'CW-7A-0510', t('2026-10-05', '16:00')) },
        { id: 'e-3', label: 'Teacher note', date: t('2026-10-05', '11:30'), value: 'Responds well to worked examples', source: src('Platform', 'NOTE-7A-118', t('2026-10-05', '11:30')) },
      ],
    },
    {
      id: 'd-lina', studentId: 'stu-lina', classId: '7A', subject: 'Mathematics', period: 'Term 1', teacherId: 'st-nadia', state: 'published', publishedAt: t('2026-10-05', '14:10'), publishedVersion: 1,
      versions: [{ version: 1, text: 'Lina works carefully and checks her answers. She is ready to extend her fraction work to mixed numbers.', editedBy: 'Nadia Farooq', at: t('2026-10-05', '14:02') }],
      evidence: [{ id: 'e-4', label: 'Fractions quiz', date: t('2026-10-02', '10:20'), value: '9/10', source: src('LMS', 'QZ-7A-FRAC-01', t('2026-10-02', '15:00')) }],
    },
    {
      id: 'd-yusuf', studentId: 'stu-yusuf', classId: '7A', subject: 'Mathematics', period: 'Term 1', teacherId: 'st-nadia', state: 'missing-evidence',
      versions: [], evidence: [],
    },
    {
      id: 'd-hamdan', studentId: 'stu-hamdan', classId: '7A', subject: 'Mathematics', period: 'Term 1', teacherId: 'st-nadia', state: 'draft',
      versions: [{ version: 1, text: 'Hamdan participates readily in class discussion. Showing each step of his working will help him secure fraction methods.', editedBy: 'Teacher Copilot', at: today('08:52') }],
      evidence: [
        { id: 'e-5', label: 'Fractions quiz', date: t('2026-10-02', '10:20'), value: '6/10', source: src('LMS', 'QZ-7A-FRAC-01', t('2026-10-02', '15:00')) },
        { id: 'e-6', label: 'Teacher note', date: t('2026-10-01', '12:00'), value: 'Contributes well orally; working often omitted', source: src('Platform', 'NOTE-7A-104', t('2026-10-01', '12:00')) },
      ],
    },
    {
      id: 'd-zara', studentId: 'stu-zara', classId: '7A', subject: 'Mathematics', period: 'Term 1', teacherId: 'st-nadia', state: 'draft',
      versions: [{ version: 1, text: 'Zara has made a strong start to the term and completes extension tasks independently.', editedBy: 'Teacher Copilot', at: today('08:52') }],
      evidence: [{ id: 'e-7', label: 'Fractions quiz', date: t('2026-10-02', '10:20'), value: '10/10', source: src('LMS', 'QZ-7A-FRAC-01', t('2026-10-02', '15:00')) }],
    },
    {
      id: 'd-ibrahim', studentId: 'stu-ibrahim', classId: '7A', subject: 'Mathematics', period: 'Term 1', teacherId: 'st-nadia', state: 'approved',
      versions: [{ version: 1, text: 'Ibrahim is building confidence with fractions and asks helpful questions when unsure.', editedBy: 'Nadia Farooq', at: t('2026-10-05', '13:40') }],
      evidence: [{ id: 'e-8', label: 'Fractions quiz', date: t('2026-10-02', '10:20'), value: '7/10', source: src('LMS', 'QZ-7A-FRAC-01', t('2026-10-02', '15:00')) }],
    },
    {
      id: 'd-noor', studentId: 'stu-noor', classId: '7A', subject: 'Mathematics', period: 'Term 1', teacherId: 'st-nadia', state: 'published', publishedAt: t('2026-10-05', '14:12'), publishedVersion: 1,
      versions: [{ version: 1, text: 'Noor explains her reasoning clearly and supports classmates during paired work.', editedBy: 'Nadia Farooq', at: t('2026-10-05', '14:05') }],
      evidence: [{ id: 'e-9', label: 'Fractions quiz', date: t('2026-10-02', '10:20'), value: '8/10', source: src('LMS', 'QZ-7A-FRAC-01', t('2026-10-02', '15:00')) }],
    },
    {
      id: 'd-leo', studentId: 'stu-leo', classId: '7A', subject: 'Mathematics', period: 'Term 1', teacherId: 'st-nadia', state: 'draft',
      versions: [{ version: 1, text: 'Leo is settling well into Year 7 mathematics. Regular practice of times tables will support his fraction work.', editedBy: 'Teacher Copilot', at: today('08:52') }],
      evidence: [{ id: 'e-10', label: 'Baseline assessment', date: t('2026-09-10', '09:00'), value: '58%', source: src('LMS', 'BASE-7A-MATH', t('2026-09-10', '15:00')) }],
    },
    {
      id: 'd-hana', studentId: 'stu-hana', classId: '7A', subject: 'Mathematics', period: 'Term 1', teacherId: 'st-nadia', state: 'published', publishedAt: t('2026-10-05', '14:15'), publishedVersion: 1,
      versions: [{ version: 1, text: 'Hana is accurate and methodical. She is ready for more open-ended problem solving.', editedBy: 'Nadia Farooq', at: t('2026-10-05', '14:08') }],
      evidence: [{ id: 'e-11', label: 'Fractions quiz', date: t('2026-10-02', '10:20'), value: '9/10', source: src('LMS', 'QZ-7A-FRAC-01', t('2026-10-02', '15:00')) }],
    },
  ];

  const cases: SupportCase[] = [
    {
      id: 'SC-1042', studentId: 'stu-omar', ownerId: 'st-aisha', rule: 'S-02 · Attendance + missing tasks', status: 'acknowledged', openedAt: today('09:05'), reviewDue: t('2026-10-07', '15:00'),
      signals: [
        'Attendance 90% over the last 20 school days; 100% in the prior comparable period.',
        'Three assignments missing as of 09:00.',
        'Published assessment data is unchanged.',
      ],
      missingData: [],
      plan: [
        { text: 'Speak with Omar privately by 7 Oct.', done: false },
        { text: 'Confirm assignment barriers with subject teachers.', done: false },
        { text: 'Agree a manageable catch-up plan.', done: false },
        { text: 'Review progress on 13 Oct.', done: false },
      ],
      events: [
        { at: today('09:05'), label: 'Case created by rule S-02', by: 'Support rules' },
        { at: today('09:20'), label: 'Acknowledged', by: 'Aisha Rahman', note: 'Next review 7 Oct' },
      ],
    },
    {
      id: 'SC-1043', studentId: 'stu-yusuf', ownerId: 'st-daniel', rule: 'S-01 · Missing tasks', status: 'open', openedAt: t('2026-10-05', '09:05'), reviewDue: t('2026-10-08', '15:00'),
      signals: ['Two assignments missing in Mathematics and Science.', 'Attendance unchanged at 98%.'],
      missingData: [],
      plan: [],
      events: [{ at: t('2026-10-05', '09:05'), label: 'Case created by rule S-01', by: 'Support rules' }],
    },
    {
      id: 'SC-1044', studentId: 'stu-maya', ownerId: 'st-aisha', rule: 'S-02 · Attendance + missing tasks', status: 'insufficient-data', openedAt: today('09:05'), reviewDue: t('2026-10-09', '15:00'),
      signals: ['One assignment missing in Geography.'],
      missingData: ['Year 9C period 1 register pending — rule evaluation paused.'],
      plan: [],
      events: [{ at: today('09:05'), label: 'Rule paused: incomplete register', by: 'Support rules' }],
    },
  ];

  const requests: FamilyRequest[] = [
    {
      id: 'REQ-081', type: 'question', guardianId: 'g-rania', studentId: 'stu-lina', subject: 'Uniform shop opening hours during half term', details: { Question: 'Is the uniform shop open during the October half term?' },
      status: 'awaiting-approval', submittedAt: t('2026-10-05', '18:42'), assignedTo: 'st-layla', steps: [{ label: 'Office reply', done: false }],
      messages: [{ at: t('2026-10-05', '18:42'), from: 'guardian', author: 'Rania Hassan', text: 'Is the uniform shop open during the October half term?' }],
    },
    {
      id: 'REQ-082', type: 'absence-explanation', guardianId: 'g-khalid', studentId: 'stu-omar', subject: 'Absence explanation · Medical appointment', details: { Date: '6 October 2026', Reason: 'Medical appointment', Attachment: 'Restricted to attendance staff' },
      status: 'in-progress', submittedAt: today('08:05'), assignedTo: 'st-layla', steps: [{ label: 'Attendance officer review', done: false }, { label: 'Register amended if accepted', done: false }],
      messages: [{ at: today('08:05'), from: 'guardian', author: 'Khalid Khan', text: 'Omar has a medical appointment this morning and will arrive after break.' }],
    },
  ];

  const circulars: Circular[] = [
    {
      id: 'CIR-0214', title: 'Year 7 Sports Day circular', issued: t('2026-10-02', '12:00'), validUntil: t('2026-10-15', '23:59'), yearGroups: [7], approved: true,
      keywords: ['sports day', 'sport day', 'pe kit', 'kit', 'water', 'bottle', 'wear', 'bring', 'sports'],
      answer: 'Students should wear their house PE kit and bring a labelled water bottle. Sports day runs on 15 October, 08:00–12:30.',
    },
    {
      id: 'CIR-0209', title: 'Year 7 Museum visit letter', issued: t('2026-10-01', '12:00'), validUntil: t('2026-10-15', '23:59'), yearGroups: [7], approved: true,
      keywords: ['museum', 'trip', 'visit', 'consent', 'cost', 'pay', 'payment'],
      answer: 'The Year 7 museum visit is on 15 October. Consent is requested by 10 October and the trip cost is AED 150, paid through the payment portal.',
    },
    {
      id: 'CIR-0198', title: 'Term 1 calendar', issued: t('2026-08-20', '12:00'), validUntil: t('2026-12-18', '23:59'), yearGroups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], approved: true,
      keywords: ['half term', 'holiday', 'break', 'term', 'calendar', 'closed', 'national day', 'end of term'],
      answer: 'October half term runs from 19 to 23 October. Term 1 ends on 11 December. The school is closed for National Day on 2–3 December.',
    },
    {
      id: 'CIR-0201', title: 'Uniform and appearance policy', issued: t('2026-08-20', '12:00'), validUntil: t('2027-07-01', '23:59'), yearGroups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], approved: true,
      keywords: ['uniform', 'shoes', 'hijab', 'blazer', 'jewellery', 'jewelry', 'hair'],
      answer: 'Students wear the full school uniform with black school shoes. House PE kit is worn only on PE days and sports events. Plain navy or white hijabs are permitted.',
    },
    {
      id: 'CIR-0205', title: 'Lunch and canteen arrangements', issued: t('2026-08-28', '12:00'), validUntil: t('2026-12-18', '23:59'), yearGroups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], approved: true,
      keywords: ['lunch', 'canteen', 'food', 'nut', 'snack', 'allergy', 'menu'],
      answer: 'The canteen serves lunch from 12:20 to 13:00. The school is nut-aware: please do not send products containing nuts. Menus are published on Fridays.',
    },
    {
      id: 'CIR-0122', title: 'Swimming gala 2025', issued: t('2025-11-02', '12:00'), validUntil: t('2025-11-20', '23:59'), yearGroups: [7, 8, 9], approved: true,
      keywords: ['swimming', 'gala', 'swim'],
      answer: 'The 2025 swimming gala took place at the school pool for Years 7–9; swimmers brought their own goggles and towel.',
    },
  ];

  const assignments: Assignment[] = [
    {
      id: 'SCI-7A-014', classId: '7A', subject: 'Science', title: 'Science observation report', minutes: 40, due: t('2026-10-08', '18:00'), acceptsSubmission: true,
      instructions: ['Describe one change of state.', 'Include your observations and a labelled diagram.', 'Use the teacher’s rubric before submitting.'],
      source: src('LMS', 'SCI-7A-014', today('09:10')),
    },
    {
      id: 'MATH-7A-031', classId: '7A', subject: 'Mathematics', title: 'Equivalent fractions worksheet', minutes: 25, due: t('2026-10-07', '08:00'), acceptsSubmission: false,
      instructions: ['Complete questions 1–12 on worksheet 4.', 'Show your working for questions 8–12.'],
      source: src('LMS', 'MATH-7A-031', today('09:10')),
    },
    {
      id: 'ENG-7A-022', classId: '7A', subject: 'English', title: 'Reading log · Chapter 4', minutes: 15, due: t('2026-10-07', '08:00'), acceptsSubmission: false,
      instructions: ['Read chapter 4.', 'Write three sentences about how the main character changes.'],
      source: src('LMS', 'ENG-7A-022', today('09:10')),
    },
  ];

  const passports: LearningPassport[] = [
    {
      studentId: 'stu-sara', subject: 'Mathematics',
      objectives: [
        { id: 'o-1', label: 'Simplifying fractions', mastery: 'secure', sources: 3 },
        { id: 'o-2', label: 'Equivalent fractions', mastery: 'developing', sources: 2 },
        { id: 'o-3', label: 'Unlike denominators', mastery: 'practice', sources: 2 },
        { id: 'o-4', label: 'Geometry', mastery: 'insufficient', sources: 1 },
      ],
      practice: ['Monday · 15 min worked examples (page 14)', 'Wednesday · 15 min denominator conversion', 'Friday · teacher checkpoint'],
      nextCheckpoint: t('2026-10-09', '10:20'),
      latest: 'Fractions quiz: 7/10 on 2 Oct',
      approvedBy: 'Nadia Farooq',
      approvedAt: today('08:45'),
    },
  ];

  const concerns: ConcernReport[] = [
    {
      id: 'SG-026', studentId: 'stu-hamdan', category: 'Online behaviour', description: 'A learner reported repeated unkind messages after school.', whenWhere: '5 October · After school · Messages sent online',
      contactPreference: 'Private check-in during break', attachments: 2, receivedAt: today('09:15'), status: 'check-in-scheduled', studentStatus: 'A staff member is reviewing your concern.',
      dutyLeadId: 'st-aisha', backupId: 'st-daniel', primaryDelivery: 'delivered',
      events: [
        { at: today('09:15'), label: 'Report stored · restricted evidence', by: 'System' },
        { at: today('09:16'), label: 'Duty staff notified · delivered', by: 'System' },
        { at: today('09:22'), label: 'Acknowledged', by: 'Aisha Rahman' },
        { at: today('09:30'), label: 'Private check-in scheduled for 13:30', by: 'Aisha Rahman' },
      ],
    },
  ];

  const registers: Register[] = [
    { id: 'REG-7A', classId: '7A', period: 'Period 1', recorded: 28, total: 28, status: 'complete', updatedAt: today('08:15') },
    { id: 'REG-8B', classId: '8B', period: 'Period 1', recorded: 22, total: 30, status: 'pending', updatedAt: today('08:20') },
    { id: 'REG-9C', classId: '9C', period: 'Period 1', recorded: 21, total: 29, status: 'pending', updatedAt: today('08:12') },
    { id: 'REG-4B', classId: '4B', period: 'Registration', recorded: 24, total: 24, status: 'complete', updatedAt: today('08:10') },
  ];

  const explanations: AbsenceExplanation[] = [
    { id: 'AE-311', studentId: 'stu-omar', guardianId: 'g-khalid', reason: 'Medical appointment', date: DEMO_DATE, receivedAt: today('08:05'), status: 'awaiting-review', hasAttachment: true },
    { id: 'AE-309', studentId: 'stu-lina', guardianId: 'g-rania', reason: 'Family travel (authorised request)', date: '2026-10-01', receivedAt: t('2026-09-29', '19:20'), status: 'awaiting-review', hasAttachment: false },
  ];

  const incidents: Incident[] = [
    { id: 'BI-208', at: t('2026-10-05', '12:35'), location: 'Corridor B', kind: 'concern', description: 'Pushing during lunch transition; resolved by duty staff.', verified: true, recordedBy: 'Daniel Reed', version: 1 },
    { id: 'BI-211', at: today('12:40'), location: 'Corridor B', kind: 'concern', description: 'Crowding at stairwell; reported by a student, not yet verified.', verified: false, recordedBy: 'Nadia Farooq', version: 1 },
    { id: 'BI-212', at: today('13:00'), location: 'Sports hall', kind: 'positive', description: 'Year 8 students organised equipment and helped younger players.', verified: true, recordedBy: 'Daniel Reed', version: 1 },
    { id: 'BI-204', at: t('2026-10-01', '12:38'), location: 'Corridor B', kind: 'concern', description: 'Verbal disagreement during lunch transition.', verified: true, recordedBy: 'Aisha Rahman', version: 2 },
    { id: 'BI-199', at: t('2026-09-29', '10:05'), location: 'Library', kind: 'positive', description: 'Reading ambassadors supported a Year 4 visit.', verified: true, recordedBy: 'Layla Haddad', version: 1 },
  ];

  const homework: HomeworkItem[] = [
    { id: 'HW-1', yearGroup: 9, subject: 'Mathematics', title: 'Linear equations practice', minutes: 40, evening: '2026-10-05', due: '2026-10-06', status: 'published' },
    { id: 'HW-2', yearGroup: 9, subject: 'Geography', title: 'River landforms notes', minutes: 35, evening: '2026-10-05', due: '2026-10-06', status: 'published' },
    { id: 'HW-3', yearGroup: 9, subject: 'English', title: 'Persuasive paragraph', minutes: 45, evening: '2026-10-06', due: '2026-10-07', status: 'published' },
    { id: 'HW-4', yearGroup: 9, subject: 'French', title: 'Vocabulary quiz prep', minutes: 30, evening: '2026-10-06', due: '2026-10-07', status: 'published' },
    { id: 'HW-5', yearGroup: 9, subject: 'English', title: 'Poetry annotation', minutes: 45, evening: '2026-10-07', due: '2026-10-08', status: 'published' },
    { id: 'HW-6', yearGroup: 9, subject: 'Mathematics', title: 'Simultaneous equations', minutes: 40, evening: '2026-10-07', due: '2026-10-08', status: 'published' },
    { id: 'HW-7', yearGroup: 9, subject: 'Arabic', title: 'Reading comprehension', minutes: 30, evening: '2026-10-07', due: '2026-10-08', status: 'published' },
    { id: 'HW-8', yearGroup: 9, subject: 'History', title: 'Source analysis', minutes: 35, evening: '2026-10-08', due: '2026-10-09', status: 'published' },
    { id: 'HW-9', yearGroup: 9, subject: 'Computing', title: 'Algorithm flowchart', minutes: 25, evening: '2026-10-08', due: '2026-10-09', status: 'published' },
    { id: 'HW-10', yearGroup: 9, subject: 'Art', title: 'Observational sketch', minutes: 40, evening: '2026-10-09', due: '2026-10-12', status: 'published' },
    { id: 'HW-11', yearGroup: 9, subject: 'Science', title: 'Particle model practice', minutes: 45, evening: '2026-10-07', due: '2026-10-08', status: 'proposed' },
  ];

  const activities: Activity[] = [
    { id: 'ACT-BB', name: 'Basketball', yearGroups: 'Years 7–9', schedule: 'Tue and Thu · 15:15–16:15', location: 'Sports hall', coachId: 'st-daniel', capacity: 20, booked: Array.from({ length: 18 }, (_, i) => `stu-x${i}`).concat(['stu-omar']), waiting: [], consentRequired: true },
    { id: 'ACT-ROB', name: 'Robotics', yearGroups: 'Years 6–9', schedule: 'Wed · 15:15–16:30', location: 'Lab D2', coachId: 'st-karim', capacity: 16, booked: Array.from({ length: 16 }, (_, i) => `stu-r${i}`), waiting: Array.from({ length: 8 }, (_, i) => `stu-w${i}`), consentRequired: true },
    { id: 'ACT-SWM', name: 'Swimming', yearGroups: 'Years 7–9', schedule: 'Mon · 15:15–16:15', location: 'School pool', coachId: 'st-daniel', capacity: 18, booked: Array.from({ length: 12 }, (_, i) => `stu-s${i}`), waiting: [], consentRequired: true },
    { id: 'ACT-CHS', name: 'Chess club', yearGroups: 'Years 4–9', schedule: 'Thu · 15:15–16:00', location: 'Library', coachId: 'st-nadia', capacity: 24, booked: Array.from({ length: 15 }, (_, i) => `stu-c${i}`), waiting: [], consentRequired: false },
  ];

  const routes: BusRoute[] = [
    { id: 'B12', label: 'Route B12', service: 'Afternoon service', lastLocationAt: today('16:32'), etaFrom: '16:40', etaTo: '16:48', boarding: { 'stu-sara': today('16:18') } },
  ];

  const connectors: Connector[] = [
    { id: 'c-sis', system: 'SIS', name: 'Student information system', scope: 'Rosters, guardians and attendance', mode: 'Scheduled API import · every 15 min', status: 'healthy', lastSuccess: today('09:15'), records: 2140 },
    { id: 'c-lms', system: 'LMS', name: 'Learning management system', scope: 'Assignments, submissions and assessments', mode: 'API + webhooks', status: 'healthy', lastSuccess: today('09:10'), records: 428 },
    { id: 'c-tr', system: 'Transport', name: 'Transport provider', scope: 'Route telemetry and boarding scans', mode: 'Not enabled for MVP', status: 'not-enabled', lastSuccess: today('07:00'), records: 0 },
  ];

  const quarantine: QuarantinedRow[] = [
    { id: 'Q-1', sourceId: 'SIS-2038', issue: 'Student source ID has no approved canonical mapping.', rows: 2, status: 'quarantined' },
  ];

  const notifications: Notification[] = [
    { id: 'n-1', audience: { kind: 'guardian', id: 'g-fatima' }, title: 'Museum visit consent requested', body: 'Year 7 trip on 15 Oct. Please respond by 10 Oct.', at: t('2026-10-02', '12:05'), read: false, link: '/today' },
    { id: 'n-2', audience: { kind: 'guardian', id: 'g-fatima' }, title: 'Sara is marked present', body: 'Register confirmed at 08:15.', at: today('08:16'), read: true, link: '/today' },
    { id: 'n-3', audience: { kind: 'staff', id: 'st-aisha' }, title: 'New restricted concern', body: 'SG-026 requires duty review. Details are only visible in the safeguarding workspace.', at: today('09:16'), read: true, link: '/safeguarding' },
    { id: 'n-4', audience: { kind: 'staff', id: 'st-nadia' }, title: '5 report drafts ready for review', body: 'Mathematics · Year 7A · Term 1.', at: today('08:53'), read: false, link: '/copilot' },
    { id: 'n-5', audience: { kind: 'staff', id: 'st-layla' }, title: 'Absence explanation received', body: 'Omar Khan · Year 8B · awaiting review.', at: today('08:05'), read: false, link: '/attendance' },
  ];

  const audit: AuditEvent[] = [
    { id: 'A-1001', at: today('08:52'), actor: 'Teacher Copilot', action: 'Generated drafts (5) from authorised records', target: 'Mathematics · 7A · Term 1', outcome: 'allowed' },
    { id: 'A-1002', at: today('09:05'), actor: 'Support rules', action: 'Created case from rule S-02', target: 'SC-1042', outcome: 'allowed' },
    { id: 'A-1003', at: today('09:15'), actor: 'SIS connector', action: 'Import completed · 1 register incomplete', target: 'Attendance', outcome: 'allowed' },
    { id: 'A-1004', at: today('09:16'), actor: 'System', action: 'Restricted concern stored and routed to duty lead', target: 'SG-026', outcome: 'allowed' },
    { id: 'A-1005', at: today('09:20'), actor: 'Aisha Rahman', action: 'Acknowledged support case', target: 'SC-1042', outcome: 'allowed' },
  ];

  return {
    version: 3,
    staff, students, guardians, relationships, classes, feed, drafts, cases, requests, circulars, assignments,
    submissions: [], passports, concerns, registers, explanations, incidents, homework, activities, routes,
    connectors, quarantine, notifications, audit,
    preferences: {
      'g-fatima': { language: 'en', quietStart: '20:00', quietEnd: '07:00', digest: '18:00', homework: true, circulars: true, activities: true },
    },
    consents: {
      'TRIP-7-MUSEUM:stu-sara': { key: 'TRIP-7-MUSEUM', studentId: 'stu-sara', label: 'Museum visit · 15 Oct', given: false },
    },
    counters: { REQ: 83, SG: 26, SUB: 720, BI: 212, A: 1005, N: 5, SC: 1044, AE: 311, HW: 11 },
    demo: { lmsOutage: false, staleBus: false, failPrimaryDelivery: false },
  };
}
