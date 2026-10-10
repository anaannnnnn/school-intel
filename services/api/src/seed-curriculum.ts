// CBSE-only school data for Classes 1 to 12, with fictional people.
//
// Every class has several sections (A to D for Classes 1 to 5, A to E for Classes 6 to 10, and by stream for
// Classes 11 and 12) of 22 or more students. Subjects, chapters, study materials and quizzes belong to a cohort
// (one per class, or per stream in Classes 11 and 12) and are shared by every section of that cohort. See cohort.ts.
//
// Chapter titles come from the NCERT books that CBSE prescribes (catalogue.json for Classes 9 to 12, cbse/primary.ts
// for the rest). Only titles are used; no textbook text, past papers or mark schemes are copied.
// Every student, guardian and teacher below is invented.

import type {
  Account,
  Assessment,
  AttendanceDay,
  BehaviourPoint,
  ExamEvent,
  Guardian,
  GuardianRelationship,
  Material,
  PastPaper,
  Period,
  Presence,
  Question,
  ScoreEntry,
  SchoolClass,
  StaffMember,
  Student,
  Subject,
  Topic,
} from '@school-intel/contracts';
import catalogueJson from './curriculum/catalogue.json';
import { EXTRA_CHAPTERS } from './cbse/primary';
import { notesBody, revisionBody, samplePaperBody, textbookBody, worksheetBody, type ChapterCtx } from './cbse/content';
import { accountsQuestions, factQuestions, mathQuestions, reflectionQuestion, rngFrom, type RawQ } from './cbse/questions';

export interface CatalogueTopic {
  no: number;
  title: string;
  url?: string;
  flag?: string;
  parts?: string[];
}
export interface CatalogueCourse {
  p: Programme;
  g: number;
  s: string;
  code: string | null;
  src: string;
  t: CatalogueTopic[];
}
export type Programme = 'cbse';

export const catalogue = (catalogueJson as unknown as CatalogueCourse[]).filter((c) => c.p === 'cbse');

export const PROGRAMME_LABEL: Record<Programme, string> = { cbse: 'CBSE' };

export const START_DATE = '2026-08-24';

export interface CohortSpec {
  id: string;
  grade: number;
  stream?: 'Science' | 'Commerce' | 'Humanities';
  subjects: string[];
  sections: string[];
}

const SCIENCE = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'English Core'];
const COMMERCE = ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'Informatics Practices', 'English Core'];
const HUMANITIES = ['History', 'Political Science', 'Geography', 'Psychology', 'Economics', 'English Core'];

const CORE: Record<number, string[]> = {
  1: ['English', 'Mathematics', 'Hindi', 'Environmental Awareness'],
  2: ['English', 'Mathematics', 'Hindi', 'Environmental Awareness'],
  3: ['English', 'Mathematics', 'Hindi', 'EVS'],
  4: ['English', 'Mathematics', 'Hindi', 'EVS'],
  5: ['English', 'Mathematics', 'Hindi', 'EVS'],
  6: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer Science'],
  7: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer Science'],
  8: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer Science'],
  9: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
  10: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
};

export const COHORTS: CohortSpec[] = (() => {
  const out: CohortSpec[] = [];
  for (let g = 1; g <= 10; g++) out.push({ id: `G${g}`, grade: g, subjects: CORE[g], sections: g <= 5 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'] });
  for (const g of [11, 12]) {
    out.push({ id: `G${g}-Science`, grade: g, stream: 'Science', subjects: SCIENCE, sections: ['A', 'B'] });
    out.push({ id: `G${g}-Commerce`, grade: g, stream: 'Commerce', subjects: COMMERCE, sections: ['C', 'D'] });
    out.push({ id: `G${g}-Humanities`, grade: g, stream: 'Humanities', subjects: HUMANITIES, sections: ['E', 'F'] });
  }
  return out;
})();

/** Chapters of one subject in one class. */
export function chaptersOf(grade: number, subject: string): CatalogueTopic[] {
  const course = catalogue.find((c) => c.g === grade && c.s === subject);
  if (course && course.t.length) return course.t;
  const extra = EXTRA_CHAPTERS[grade]?.[subject];
  if (extra) return extra.map((title, i) => ({ no: i + 1, title }));
  throw new Error(`No CBSE chapters for Class ${grade} ${subject}`);
}

export function findCourse(p: Programme, grade: number, subject: string): CatalogueCourse | undefined {
  return catalogue.find((c) => c.p === p && c.g === grade && c.s === subject);
}

const FEMALE = ['Aaradhya', 'Ananya', 'Diya', 'Meera', 'Ishita', 'Kavya', 'Saanvi', 'Riya', 'Navya', 'Anika', 'Myra', 'Tara', 'Prisha', 'Aditi', 'Pooja', 'Sneha', 'Zoya', 'Fatima', 'Sana', 'Mariam', 'Noor', 'Aisha', 'Hana', 'Leena', 'Simran', 'Harleen', 'Tanvi', 'Isha', 'Nandini', 'Radhika', 'Shreya', 'Vidya', 'Amira', 'Lakshmi', 'Gauri', 'Pallavi'];
const MALE = ['Aarav', 'Arjun', 'Vivaan', 'Kabir', 'Rohan', 'Ishaan', 'Reyansh', 'Aditya', 'Dhruv', 'Kunal', 'Nikhil', 'Rayan', 'Zayd', 'Hamza', 'Yusuf', 'Omar', 'Ibrahim', 'Tariq', 'Sameer', 'Dev', 'Karan', 'Manav', 'Rishi', 'Siddharth', 'Varun', 'Yash', 'Faisal', 'Khalid', 'Advait', 'Harsh', 'Parth', 'Tejas', 'Vihaan', 'Neel', 'Ayaan', 'Lakshya'];
const LAST = ['Sharma', 'Nair', 'Iyer', 'Kapoor', 'Menon', 'Reddy', 'Gupta', 'Verma', 'Joshi', 'Pillai', 'Bhatia', 'Desai', 'Khan', 'Siddiqui', 'Ansari', 'Qureshi', 'Rahman', 'Sheikh', 'Singh', 'Gill', 'Mehta', 'Shah', 'Patel', 'Rao', 'Banerjee', 'Chatterjee', 'Das', 'Thomas', 'Mathew', 'George', 'Fernandes', 'Dsouza', 'Kulkarni', 'Deshmukh', 'Agarwal', 'Malhotra', 'Bose', 'Naidu'];
const HOUSES = ['Aravali', 'Nilgiri', 'Himalaya', 'Vindhya'];
const BLOOD = ['O+', 'A+', 'B+', 'AB+', 'O−', 'A−', 'B−'];
const ROUTES = ['Route 1 · Al Nahda', 'Route 2 · Karama', 'Route 3 · Bur Dubai', 'Route 4 · Mirdif', 'Self / parent drop'];

const slug = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const hueOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const t = (date: string, time: string) => `${date}T${time}:00+04:00`;
const hash = (s: string) => [...s].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381);
const isFemale = (first: string) => FEMALE.includes(first);

const WEEK: Array<[string, string]> = [
  ['08:00', '08:45'],
  ['08:50', '09:35'],
  ['09:40', '10:25'],
  ['10:45', '11:30'],
  ['11:35', '12:20'],
  ['12:50', '13:35'],
];

/** Weekdays from the start of term up to the day before the pinned school date. */
export function termDays(until = '2026-10-05'): string[] {
  const out: string[] = [];
  for (let d = new Date(`${START_DATE}T00:00:00Z`); d <= new Date(`${until}T00:00:00Z`); d = new Date(d.getTime() + 86400000)) {
    const w = d.getUTCDay();
    if (w !== 0 && w !== 6) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export interface LegacySubject {
  subjectId: string;
  teacherId: string;
  topicCount: number;
}

export interface CurriculumOptions {
  /** Hand-written students (the original demo scenario). They get a section, roll number and so on. */
  existingStudents: Student[];
  /** Existing subjects to extend with chapters instead of creating new ones, keyed by cohort then subject name. */
  legacy: Record<string, Record<string, LegacySubject>>;
  /** Hand-set class tutors, keyed by section id. */
  tutors: Record<string, string>;
  /** Students who already have attendance history. */
  hasAttendance: Set<string>;
}

export interface CurriculumSeed {
  classes: SchoolClass[];
  staff: StaffMember[];
  students: Student[];
  guardians: Guardian[];
  relationships: GuardianRelationship[];
  subjects: Subject[];
  topics: Topic[];
  materials: Material[];
  periods: Period[];
  accounts: Account[];
  questions: Question[];
  pastPapers: PastPaper[];
  assessments: Assessment[];
  examEvents: ExamEvent[];
  attendanceHistory: Record<string, AttendanceDay[]>;
  behaviourPoints: BehaviourPoint[];
  scorecards: Record<string, ScoreEntry[]>;
  /** Teacher id to the cohorts they teach, for extending hand-written staff. */
  teaches: Record<string, string[]>;
}

export const cohortLabel = (c: CohortSpec) => `Class ${c.grade}${c.stream ? ` ${c.stream}` : ''}`;
export const sectionLabel = (c: CohortSpec, sec: string) => `Class ${c.grade}${sec}${c.stream ? ` · ${c.stream}` : ''}`;
export const stageOf = (grade: number) => (grade <= 5 ? 'Primary' : grade <= 8 ? 'Middle' : grade <= 10 ? 'Secondary' : 'Senior secondary');

const ATTENDANCE_PROFILES = [0.99, 0.97, 0.95, 0.93, 0.9, 0.86, 0.8];

export function cohortSections(cohortId: string): string[] {
  const c = COHORTS.find((x) => x.id === cohortId);
  return c ? c.sections.map((s) => `${c.grade}${s}`) : [];
}

export function createCurriculumSeed(opts: CurriculumOptions): CurriculumSeed {
  const out: CurriculumSeed = {
    classes: [], staff: [], students: [], guardians: [], relationships: [], subjects: [], topics: [], materials: [], periods: [], accounts: [],
    questions: [], pastPapers: [], assessments: [], examEvents: [], attendanceHistory: {}, behaviourPoints: [], scorecards: {}, teaches: {},
  };
  const days = termDays();
  let teacherNo = 0;
  let behaviourNo = 0;

  const teacherName = (n: number) => {
    const pool = n % 2 === 0 ? FEMALE : MALE;
    return `${pool[(n * 7 + 3) % pool.length]} ${LAST[(n * 11 + Math.floor(n / 5)) % LAST.length]}`;
  };

  const subjectTeacher = new Map<string, string>();

  for (const cohort of COHORTS) {
    for (const name of cohort.subjects) {
      const chapters = chaptersOf(cohort.grade, name);
      const legacy = opts.legacy[cohort.id]?.[name];
      const key = `${cohort.id.toLowerCase()}-${slug(name)}`;
      let sid: string;
      let teacherId: string;
      let order0 = 0;
      if (legacy) {
        sid = legacy.subjectId;
        teacherId = legacy.teacherId;
        order0 = legacy.topicCount;
      } else {
        sid = `sub-${key}`;
        const tname = teacherName(teacherNo++);
        const [first, ...rest] = tname.split(' ');
        teacherId = `st-${key}`;
        const title = `${name} teacher · ${cohortLabel(cohort)}`;
        out.staff.push({ id: teacherId, name: tname, title, initials: initials(tname), roles: ['teacher'], classIds: [], email: `${first}.${rest.join('')}.${key}@horizon.example`.toLowerCase() });
        out.accounts.push({ loginId: `tch.${slug(name)}.${cohort.id.toLowerCase().replace('-', '')}`, kind: 'staff', id: teacherId, label: `${tname} · ${title}`, group: `Teachers · ${stageOf(cohort.grade)}` });
        out.subjects.push({ id: sid, name, short: name.length > 16 ? name.split(' ')[0] : name, classId: cohort.id, teacherId, hue: hueOf(name) });
      }
      subjectTeacher.set(`${cohort.id}|${name}`, teacherId);
      (out.teaches[teacherId] ??= []).push(cohort.id);

      const topicIds: string[] = [];
      chapters.forEach((ch, i) => {
        const ctx: ChapterCtx = { grade: cohort.grade, subject: name, no: ch.no, title: ch.title, parts: ch.parts, total: chapters.length, stream: cohort.stream };
        const tid = `tp-${key}-${i + 1}`;
        topicIds.push(tid);
        out.topics.push({ id: tid, subjectId: sid, name: ch.title, order: order0 + i + 1 });
        const kinds: Array<[Material['kind'], string, { body: string; minutes: number }]> = [
          ['notes', 'study notes', notesBody(ctx)],
          ['revision', 'revision cards', revisionBody(ctx)],
          ['worksheet', 'practice worksheet', worksheetBody(ctx)],
          ['textbook', 'NCERT textbook guide', textbookBody(ctx)],
        ];
        for (const [kind, label, c] of kinds) {
          out.materials.push({
            id: `MAT-${key}-${i + 1}-${kind}`, subjectId: sid, topicId: tid, title: `${ch.title}: ${label}`, kind, body: c.body, minutes: c.minutes,
            status: 'published', aiGenerated: kind !== 'textbook', createdBy: teacherId, updatedAt: t('2026-09-01', '09:00'),
          });
        }
        const refl = reflectionQuestion(ch.title, name, `Q-${key}-${i + 1}`);
        out.questions.push({ id: `Q-${key}-${i + 1}-s`, subjectId: sid, topicId: tid, difficulty: 2, status: 'approved', aiGenerated: true, ...refl });
      });

      const last = topicIds[topicIds.length - 1];
      const titles = chapters.map((c) => c.title);
      for (let v = 0; v < 2; v++) {
        const sp = samplePaperBody(cohort.grade, name, titles, v);
        out.materials.push({ id: `MAT-${key}-sp${v + 1}`, subjectId: sid, topicId: last, title: `CBSE-pattern sample paper ${v + 1}`, kind: 'sample-paper', body: sp.body, minutes: sp.minutes, status: 'published', aiGenerated: true, createdBy: teacherId, updatedAt: t('2026-09-10', '09:00') });
      }

      const raw: RawQ[] = /^mathematics$/i.test(name) ? mathQuestions(cohort.grade, key) : /accountancy|business/i.test(name) ? accountsQuestions(key) : [];
      raw.push(...factQuestions(name, cohort.grade));
      const quizIds: string[] = [];
      raw.forEach((rq, i) => {
        const id = `Q-${key}-${i + 1}`;
        out.questions.push({ id, subjectId: sid, topicId: topicIds[i % topicIds.length], type: rq.type, prompt: rq.prompt, options: rq.options, answer: rq.answer, explanation: rq.explanation, marks: rq.difficulty, difficulty: rq.difficulty, status: 'approved', aiGenerated: true });
        quizIds.push(id);
      });
      if (quizIds.length >= 5) {
        const paperId = `PAPER-${key}`;
        const set = new Set(quizIds.slice(0, 5));
        const picked = out.questions.filter((q) => set.has(q.id));
        picked.forEach((q) => (q.paperId = paperId));
        out.pastPapers.push({ id: paperId, board: 'CBSE', subjectId: sid, year: 2026, session: 'Practice set', title: `Class ${cohort.grade} ${name}: practice set`, questionIds: picked.map((q) => q.id), licence: 'Original practice questions written for this school; not an official CBSE paper.' });
      }
      const shortIds = [`Q-${key}-1-s`, `Q-${key}-2-s`].filter((id) => out.questions.some((q) => q.id === id));
      if (quizIds.length >= 3) {
        const qs = quizIds.slice(0, 8);
        const base = { subjectId: sid, classId: cohort.id, resultsReleased: false, createdBy: teacherId };
        out.assessments.push({ ...base, id: `AS-${key}-q1`, kind: 'quiz', title: `Quick quiz: ${chapters[0].title}`, questionIds: qs, durationMin: 15, opensAt: t('2026-10-01', '08:00'), closesAt: t('2026-10-31', '23:59'), status: 'open' });
        out.assessments.push({ ...base, id: `AS-${key}-t1`, kind: 'test', title: `Periodic Test 3: ${name}`, questionIds: [...qs.slice(0, 6), ...shortIds], durationMin: 40, opensAt: t('2026-10-14', '09:00'), status: 'scheduled' });
        out.examEvents.push({ id: `EX-${key}`, classId: cohort.id, subjectId: sid, title: `Periodic Test 3 · ${name}`, date: t(`2026-10-${String(14 + (hash(name) % 5)).padStart(2, '0')}`, '09:00'), topicIds: topicIds.slice(0, 3) });
      }
    }

    const cohortSubjects = cohort.subjects.map((n) => ({
      name: n,
      id: out.subjects.find((s) => s.classId === cohort.id && s.name === n)?.id ?? opts.legacy[cohort.id]?.[n]?.subjectId ?? '',
    }));

    cohort.sections.forEach((sec, si) => {
      const classId = `${cohort.grade}${sec}`;
      const tutorId = opts.tutors[classId] ?? subjectTeacher.get(`${cohort.id}|${cohort.subjects[si % cohort.subjects.length]}`)!;
      const room = `${cohort.grade}${sec}-${100 + cohort.grade * 2 + si}`;
      out.classes.push({ id: classId, label: sectionLabel(cohort, sec), yearGroup: cohort.grade, tutorId, cohort: cohort.id, section: sec, stream: cohort.stream, room });

      if (classId !== '7A') {
        for (let day = 1; day <= 5; day++) {
          WEEK.forEach(([start, end], i) => {
            const subj = cohortSubjects[(i + day - 1 + si) % cohortSubjects.length];
            out.periods.push({ id: `P-${classId}-${day}-${i + 1}`, classId, subjectId: subj.id, day, start, end, room });
          });
        }
      }

      const roster: Student[] = opts.existingStudents.filter((s) => s.classId === classId);
      const target = 22 + (hash(classId) % 4);
      for (let n = 1; roster.length < target; n++) {
        const nn = String(n).padStart(2, '0');
        const female = (n + si) % 2 === 0;
        const h = hash(`${classId}-${n}`);
        const pool = female ? FEMALE : MALE;
        const first = pool[h % pool.length];
        const last = LAST[(h >> 5) % LAST.length];
        const name = `${first} ${last}`;
        const sid = `stu-${classId.toLowerCase()}-${nn}`;
        const stu: Student = { id: sid, sisId: `SIS-${classId}${nn}`, name, firstName: first, classId, yearGroup: cohort.grade, initials: initials(name), gender: female ? 'F' : 'M' };
        roster.push(stu);
        out.students.push(stu);
        out.accounts.push({ loginId: `stu.${classId.toLowerCase()}.${nn}`, kind: 'student', id: sid, label: `${name} · ${sectionLabel(cohort, sec)}`, group: sectionLabel(cohort, sec) });
        const gfirst = (female ? MALE : FEMALE)[(h >> 3) % 36];
        const gname = `${gfirst} ${last}`;
        const gid = `g-${classId.toLowerCase()}-${nn}`;
        out.guardians.push({ id: gid, name: gname, firstName: gfirst, email: `${gfirst}.${last}.${classId}${nn}@family.example`.toLowerCase(), phone: `+971 50 ${String(1000 + (h % 9000))} ${String(1000 + ((h >> 7) % 9000))}` });
        out.relationships.push({ guardianId: gid, studentId: sid, status: 'verified', relationship: isFemale(gfirst) ? 'Mother' : 'Father', verifiedAt: t('2026-08-24', '10:02') });
        out.accounts.push({ loginId: `par.${classId.toLowerCase()}.${nn}`, kind: 'guardian', id: gid, label: `${gname}, parent of ${name} · ${sectionLabel(cohort, sec)}`, group: sectionLabel(cohort, sec) });
      }

      roster.forEach((stu, idx) => {
        const h = hash(stu.id);
        stu.section = sec;
        stu.rollNo = idx + 1;
        stu.gender = stu.gender ?? (isFemale(stu.firstName) ? 'F' : 'M');
        stu.dob = `${2026 - cohort.grade - 5}-${String(1 + (h % 12)).padStart(2, '0')}-${String(1 + ((h >> 4) % 28)).padStart(2, '0')}`;
        stu.house = HOUSES[h % HOUSES.length];
        stu.bloodGroup = BLOOD[(h >> 2) % BLOOD.length];
        stu.busRoute = ROUTES[(h >> 3) % ROUTES.length];

        if (!opts.hasAttendance.has(stu.id)) {
          const r = rngFrom(`att-${stu.id}`);
          const rate = ATTENDANCE_PROFILES[h % ATTENDANCE_PROFILES.length];
          out.attendanceHistory[stu.id] = days.map((date): AttendanceDay => {
            let status: Presence = 'present';
            if (r() > rate) status = r() < 0.35 ? 'excused' : 'absent';
            else if (r() < 0.04) status = 'late';
            return { date, status };
          });
        }

        const rs = rngFrom(`score-${stu.id}`);
        const ability = 0.45 + rs() * 0.5;
        const scores: ScoreEntry[] = [];
        for (const subj of cohortSubjects) {
          for (const exam of ['Periodic Test 1', 'Periodic Test 2']) {
            scores.push({ subjectId: subj.id, exam, marks: Math.max(3, Math.min(20, Math.round((ability + (rs() - 0.5) * 0.2) * 20))), max: 20 });
          }
        }
        out.scorecards[stu.id] = scores;

        if (h % 11 === 0) {
          behaviourNo++;
          const merit = h % 22 !== 0;
          out.behaviourPoints.push({
            id: `BP-G${behaviourNo}`, studentId: stu.id, kind: merit ? 'merit' : 'demerit',
            category: merit ? ['Helping others', 'Academic effort', 'Leadership', 'Sports'][h % 4] : ['Late to class', 'Homework not done'][h % 2],
            points: merit ? 2 : 1, note: merit ? 'Recognised by the class teacher.' : 'Spoken to by the class teacher.', by: tutorId, at: t(days[h % days.length], '10:30'), parentNotified: true,
          });
        }
      });
    });
  }

  for (const s of out.staff) {
    const cohorts = out.teaches[s.id] ?? [];
    s.classIds = [...new Set([...cohorts, ...cohorts.flatMap(cohortSections)])];
  }
  return out;
}
