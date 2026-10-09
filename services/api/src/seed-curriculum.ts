// Real syllabus structure for Grades 9 to 13, with fictional people.
//
// Subjects, chapters and topics come from the published CBSE/NCERT, CISCE
// (ICSE and ISC) and Cambridge International (IGCSE, O Level, AS and A Level)
// syllabuses: see curriculum/catalogue.json and docs/curriculum-data.md for
// sources and licences. Only codes, chapter numbers and titles are used; no
// textbook text, past papers or mark schemes are copied.
//
// Every student, guardian and teacher below is invented. Do not replace with
// real records.

import type {
  Account,
  Guardian,
  GuardianRelationship,
  Material,
  Period,
  SchoolClass,
  StaffMember,
  Student,
  Subject,
  Topic,
} from '@school-intel/contracts';
import catalogueJson from './curriculum/catalogue.json';
import notesJson from './curriculum/notes.json';

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
export type Programme = 'cbse' | 'icse' | 'isc' | 'igcse' | 'olevel' | 'as' | 'al';

export const catalogue = catalogueJson as unknown as CatalogueCourse[];

/** Study notes written for a topic. Keyed by `topicKey`; see docs/curriculum-data.md. */
export interface TopicNote {
  minutes: number;
  paragraphs: string[];
}
const notes = notesJson as unknown as Record<string, TopicNote>;

export const PROGRAMME_LABEL: Record<Programme, string> = {
  cbse: 'CBSE',
  icse: 'ICSE',
  isc: 'ISC',
  igcse: 'Cambridge IGCSE',
  olevel: 'Cambridge O Level',
  as: 'Cambridge AS Level',
  al: 'Cambridge A Level',
};

/** Teachers are shared by every class of a family and stage. */
type Family = 'cbse' | 'cisce' | 'cie-sec' | 'cie-adv';
const FAMILY_LABEL: Record<Family, string> = { cbse: 'CBSE', cisce: 'ICSE and ISC', 'cie-sec': 'IGCSE and O Level', 'cie-adv': 'AS and A Level' };

interface ClassSpec {
  id: string;
  key: string; // used in login IDs
  p: Programme;
  grade: number;
  stream?: string;
  family: Family;
  stage: 'lower' | 'upper';
  subjects: string[];
  /** Cambridge secondary courses run over two years: which half of the topics. */
  half?: 'first' | 'second';
}

const CBSE_LO = ['Mathematics', 'Science', 'Social Science', 'English'];
const CBSE_SCI = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'English Core'];
const CBSE_COM = ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'Informatics Practices', 'English Core'];
const ICSE = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History and Civics', 'Geography', 'Computer Applications'];
const ISC_SCI = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'];
const ISC_COM = ['Accountancy', 'Commerce', 'Economics', 'Business Studies', 'Mathematics'];
const IGCSE = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Business Studies', 'Economics'];
const OLEVEL = ['Mathematics (Syllabus D)', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Accounting', 'Economics'];
const ADV_SCI = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
const ADV_BUS = ['Business', 'Economics', 'Accounting', 'Mathematics'];

export const CLASS_SPECS: ClassSpec[] = [
  { id: '9CB', key: 'cbse9', p: 'cbse', grade: 9, family: 'cbse', stage: 'lower', subjects: CBSE_LO },
  { id: '10CB', key: 'cbse10', p: 'cbse', grade: 10, family: 'cbse', stage: 'lower', subjects: CBSE_LO },
  { id: '11CBS', key: 'cbse11s', p: 'cbse', grade: 11, stream: 'Science', family: 'cbse', stage: 'upper', subjects: CBSE_SCI },
  { id: '11CBC', key: 'cbse11c', p: 'cbse', grade: 11, stream: 'Commerce', family: 'cbse', stage: 'upper', subjects: CBSE_COM },
  { id: '12CBS', key: 'cbse12s', p: 'cbse', grade: 12, stream: 'Science', family: 'cbse', stage: 'upper', subjects: CBSE_SCI },
  { id: '12CBC', key: 'cbse12c', p: 'cbse', grade: 12, stream: 'Commerce', family: 'cbse', stage: 'upper', subjects: CBSE_COM },
  { id: '9IC', key: 'icse9', p: 'icse', grade: 9, family: 'cisce', stage: 'lower', subjects: ICSE },
  { id: '10IC', key: 'icse10', p: 'icse', grade: 10, family: 'cisce', stage: 'lower', subjects: ICSE },
  { id: '11ISS', key: 'isc11s', p: 'isc', grade: 11, stream: 'Science', family: 'cisce', stage: 'upper', subjects: ISC_SCI },
  { id: '11ISC', key: 'isc11c', p: 'isc', grade: 11, stream: 'Commerce', family: 'cisce', stage: 'upper', subjects: ISC_COM },
  { id: '12ISS', key: 'isc12s', p: 'isc', grade: 12, stream: 'Science', family: 'cisce', stage: 'upper', subjects: ISC_SCI },
  { id: '12ISC', key: 'isc12c', p: 'isc', grade: 12, stream: 'Commerce', family: 'cisce', stage: 'upper', subjects: ISC_COM },
  { id: '10IG', key: 'igcse10', p: 'igcse', grade: 10, family: 'cie-sec', stage: 'lower', subjects: IGCSE, half: 'first' },
  { id: '11IG', key: 'igcse11', p: 'igcse', grade: 11, family: 'cie-sec', stage: 'lower', subjects: IGCSE, half: 'second' },
  { id: '10OL', key: 'ol10', p: 'olevel', grade: 10, family: 'cie-sec', stage: 'lower', subjects: OLEVEL, half: 'first' },
  { id: '11OL', key: 'ol11', p: 'olevel', grade: 11, family: 'cie-sec', stage: 'lower', subjects: OLEVEL, half: 'second' },
  { id: '12ASS', key: 'as12s', p: 'as', grade: 12, stream: 'Science', family: 'cie-adv', stage: 'upper', subjects: ADV_SCI },
  { id: '12ASB', key: 'as12b', p: 'as', grade: 12, stream: 'Business', family: 'cie-adv', stage: 'upper', subjects: ADV_BUS },
  { id: '13ALS', key: 'al13s', p: 'al', grade: 13, stream: 'Science', family: 'cie-adv', stage: 'upper', subjects: ADV_SCI },
  { id: '13ALB', key: 'al13b', p: 'al', grade: 13, stream: 'Business', family: 'cie-adv', stage: 'upper', subjects: ADV_BUS },
];

const STUDENTS_PER_CLASS = 4;

function stageLabel(spec: ClassSpec): string {
  if (spec.family === 'cbse' || spec.family === 'cisce') return spec.stage === 'lower' ? 'Classes 9–10' : 'Classes 11–12';
  return spec.family === 'cie-sec' ? 'Years 10–11' : 'Years 12–13';
}

const FIRST = ['Aaliyah', 'Rayan', 'Meera', 'Arjun', 'Fatima', 'Zayd', 'Ananya', 'Kabir', 'Layla', 'Omar', 'Diya', 'Hamza', 'Ishaan', 'Mariam', 'Yusuf', 'Sana', 'Rohan', 'Noor', 'Tariq', 'Priya', 'Ibrahim', 'Aarav', 'Hana', 'Khalid', 'Zoya', 'Nikhil', 'Salma', 'Dev', 'Amira', 'Sameer', 'Leena', 'Faisal'];
const LAST = ['Siddiqui', 'Nair', 'Hashmi', 'Kapoor', 'Al Suwaidi', 'Menon', 'Rahman', 'Iyer', 'Qureshi', 'Joshi', 'Haddad', 'Bhatia', 'Farouk', 'Pillai', 'Mansoor', 'Desai', 'Sheikh', 'Varma', 'Khoury', 'Reddy', 'Nasser', 'Gupta', 'Ansari', 'Thomas'];

const slug = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const hueOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const t = (date: string, time: string) => `${date}T${time}:00+04:00`;

/** A fixed, invented name for the n-th person. First and last names step at different rates so pairs rarely repeat. */
function personName(n: number): string {
  return `${FIRST[(n * 7 + 3) % FIRST.length]} ${LAST[(n * 5 + Math.floor(n / FIRST.length)) % LAST.length]}`;
}

export function findCourse(p: Programme, grade: number, subject: string): CatalogueCourse | undefined {
  return catalogue.find((c) => c.p === p && c.g === grade && c.s === subject);
}

/** Topics a class studies. Two-year Cambridge courses are split over the two years. */
export function classTopics(spec: ClassSpec, course: CatalogueCourse): CatalogueTopic[] {
  // IGCSE and O Level share one list; the catalogue stores it under both years.
  let list = course.t;
  if (spec.p === 'as') list = list.filter((x) => !x.flag || x.flag.startsWith('AS'));
  if (spec.half) {
    const cut = Math.ceil(list.length / 2);
    list = spec.half === 'first' ? list.slice(0, cut) : list.slice(cut);
  }
  return list;
}

const WEEK: Array<[string, string]> = [
  ['07:45', '08:35'],
  ['08:40', '09:30'],
  ['09:35', '10:15'],
  ['10:20', '11:10'],
  ['11:15', '12:05'],
  ['12:40', '13:30'],
];

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
}

export function classLabel(spec: ClassSpec): string {
  const unit = spec.p === 'cbse' || spec.p === 'icse' || spec.p === 'isc' ? 'Class' : 'Year';
  return `${unit} ${spec.grade}${spec.stream ? ` ${spec.stream}` : ''} · ${PROGRAMME_LABEL[spec.p]}`;
}

/** Two-year Cambridge courses share one topic list across Year 10 and 11, so they share notes too. */
export function topicKey(spec: ClassSpec, course: CatalogueCourse, tp: CatalogueTopic): string {
  const span = spec.p === 'igcse' || spec.p === 'olevel' ? 'y10-11' : String(spec.grade);
  return `${spec.p}|${span}|${course.s}|${tp.no}|${tp.title}`;
}

/** Every distinct topic the seeded classes study, for writing notes. */
export function topicTasks() {
  const seen = new Map<string, { key: string; board: string; programme: Programme; level: string; subject: string; code: string | null; no: number; title: string; flag?: string; parts?: string[] }>();
  for (const spec of CLASS_SPECS) {
    for (const name of spec.subjects) {
      const course = findCourse(spec.p, spec.p === 'igcse' || spec.p === 'olevel' ? 10 : spec.grade, name)!;
      for (const tp of classTopics(spec, course)) {
        const key = topicKey(spec, course, tp);
        if (seen.has(key)) continue;
        const level = spec.p === 'igcse' ? 'IGCSE (Years 10-11)' : spec.p === 'olevel' ? 'O Level (Years 10-11)' : spec.p === 'as' ? 'AS Level (Year 12)' : spec.p === 'al' ? 'A Level (Year 13)' : `${PROGRAMME_LABEL[spec.p]} Class ${spec.grade}`;
        seen.set(key, { key, board: PROGRAMME_LABEL[spec.p], programme: spec.p, level, subject: course.s.replace(/\(.*\)/, '').trim(), code: course.code, no: tp.no, title: tp.title, flag: tp.flag, parts: tp.parts });
      }
    }
  }
  return [...seen.values()];
}

function materialBody(spec: ClassSpec, course: CatalogueCourse, topic: CatalogueTopic): string {
  const board = PROGRAMME_LABEL[spec.p];
  const ref = `${board}${course.code ? ` ${course.code}` : ''} · ${course.s} · ${topic.flag ? `${topic.flag} · ` : ''}${spec.p === 'cbse' ? 'chapter' : 'topic'} ${topic.no}`;
  const q = encodeURIComponent(`${topic.title} ${course.s.replace(/\(.*\)/, '').trim()}`);
  const note = notes[topicKey(spec, course, topic)];
  const paras: string[] = note ? [...note.paragraphs, 'Written as a study aid for this syllabus topic (AI-drafted original text). Your teacher should check it against your class notes and the official syllabus.'] : [];
  paras.push(`Syllabus reference: ${ref}.`);
  if (topic.parts?.length) paras.push(`The syllabus lists these sub-topics under "${topic.title}":\n${topic.parts.map((x) => `• ${x}`).join('\n')}`);
  paras.push(`Official source (chapter list and syllabus): ${topic.url ?? course.src}`);
  paras.push(`Free reading: Wikipedia https://en.wikipedia.org/w/index.php?search=${q} · Wikibooks https://en.wikibooks.org/w/index.php?search=${q}. Both are CC BY-SA, so check the page against your syllabus before relying on it.`);
  if (!note) paras.push('Your teacher will add class notes, worksheets and questions for this topic. This guide only points to the official syllabus and open resources.');
  return paras.join('\n\n');
}

export function createCurriculumSeed(): CurriculumSeed {
  const out: CurriculumSeed = { classes: [], staff: [], students: [], guardians: [], relationships: [], subjects: [], topics: [], materials: [], periods: [], accounts: [] };

  // One teacher per family, stage and subject.
  const teacherFor = new Map<string, StaffMember>();
  let person = 100;
  const teacher = (spec: ClassSpec, subject: string): StaffMember => {
    const subjectKey = slug(subject);
    const k = `${spec.family}|${spec.stage}|${subjectKey}`;
    let s = teacherFor.get(k);
    if (!s) {
      const name = personName(person++);
      const stage = stageLabel(spec);
      const [first, ...rest] = name.split(' ');
      s = {
        id: `st-${spec.family}-${spec.stage}-${subjectKey}`,
        name,
        title: `${subject.replace(/\(.*\)/, '').trim()} teacher · ${FAMILY_LABEL[spec.family]} ${stage}`,
        initials: initials(name),
        roles: ['teacher'],
        classIds: [],
        email: `${first}.${rest.join('').replace(/\s/g, '')}.${spec.family}.${subjectKey}@horizon.example`.toLowerCase(),
      };
      teacherFor.set(k, s);
      out.staff.push(s);
      out.accounts.push({ loginId: `tch.${spec.family}.${subjectKey}.${spec.stage}`, kind: 'staff', id: s.id, label: `${s.name} · ${s.title}`, group: `${FAMILY_LABEL[spec.family]} · ${stageLabel(spec)}` });
    }
    if (!s.classIds.includes(spec.id)) s.classIds.push(spec.id);
    return s;
  };

  let studentNo = 0;
  for (const spec of CLASS_SPECS) {
    const subjectRows: Subject[] = [];
    for (const name of spec.subjects) {
      const course = findCourse(spec.p, spec.p === 'igcse' || spec.p === 'olevel' ? 10 : spec.grade, name);
      if (!course) throw new Error(`Catalogue has no ${spec.p} grade ${spec.grade} ${name}`);
      const tch = teacher(spec, name);
      const sid = `sub-${spec.id.toLowerCase()}-${slug(name)}`;
      const short = name.replace(/\(.*\)/, '').trim();
      subjectRows.push({ id: sid, name: short, short: short.length > 16 ? short.split(' ')[0] : short, classId: spec.id, teacherId: tch.id, hue: hueOf(name) });
      classTopics(spec, course).forEach((tp, i) => {
        const tid = `tp-${spec.id.toLowerCase()}-${slug(name)}-${i + 1}`;
        out.topics.push({ id: tid, subjectId: sid, name: tp.title, order: i + 1 });
        const note = notes[topicKey(spec, course, tp)];
        out.materials.push({
          id: `MAT-C-${spec.id}-${slug(name)}-${i + 1}`,
          subjectId: sid,
          topicId: tid,
          title: note ? `${tp.title}: study notes` : `${tp.title}: syllabus guide`,
          kind: 'notes',
          body: materialBody(spec, course, tp),
          minutes: note?.minutes ?? 5,
          status: 'published',
          aiGenerated: !!note,
          createdBy: tch.id,
          updatedAt: t('2026-09-01', '09:00'),
        });
      });
    }
    out.subjects.push(...subjectRows);

    // Class tutor: the first subject teacher.
    const tutor = teacherFor.get(`${spec.family}|${spec.stage}|${slug(spec.subjects[0])}`)!;
    out.classes.push({ id: spec.id, label: classLabel(spec), yearGroup: spec.grade, tutorId: tutor.id });

    // Timetable: five days, six lessons, subjects rotated.
    for (let day = 1; day <= 5; day++) {
      WEEK.forEach(([start, end], i) => {
        const subj = subjectRows[(i + day - 1) % subjectRows.length];
        out.periods.push({ id: `P-${spec.id}-${day}-${i + 1}`, classId: spec.id, subjectId: subj.id, day, start, end, room: `${spec.grade}${String.fromCharCode(65 + (i % 4))}${10 + i}` });
      });
    }

    // Students and one guardian each.
    for (let n = 1; n <= STUDENTS_PER_CLASS; n++) {
      studentNo++;
      const nn = String(n).padStart(2, '0');
      const name = personName(studentNo);
      const [first, ...rest] = name.split(' ');
      const sid = `stu-${spec.id.toLowerCase()}-${nn}`;
      out.students.push({ id: sid, sisId: `SIS-${spec.grade}${String(studentNo).padStart(3, '0')}`, name, firstName: first, classId: spec.id, yearGroup: spec.grade, initials: initials(name) });
      out.accounts.push({ loginId: `stu.${spec.key}.${nn}`, kind: 'student', id: sid, label: `${name} · ${classLabel(spec)}`, group: classLabel(spec) });
      const gname = `${personName(studentNo + 400).split(' ')[0]} ${rest.join(' ')}`;
      const gid = `g-${spec.id.toLowerCase()}-${nn}`;
      out.guardians.push({ id: gid, name: gname, firstName: gname.split(' ')[0], email: `${gname.toLowerCase().replace(/\s/g, '.')}.${spec.key}${nn}@family.example`, phone: `+971 50 ${String(1000 + studentNo).padStart(4, '0')} ${String(2000 + n).padStart(4, '0')}` });
      out.relationships.push({ guardianId: gid, studentId: sid, status: 'verified', relationship: n % 2 ? 'Mother' : 'Father', verifiedAt: t('2026-08-24', '10:02') });
      out.accounts.push({ loginId: `par.${spec.key}.${nn}`, kind: 'guardian', id: gid, label: `${gname}, parent of ${name} · ${classLabel(spec)}`, group: classLabel(spec) });
    }
  }
  return out;
}
