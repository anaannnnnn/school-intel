// Fictional learning data for Year 7A at Horizon Learning School.
// Past papers are school-authored practice papers, so the school owns the rights.

import type {
  Assessment,
  Attempt,
  AttendanceDay,
  BehaviourPoint,
  Doubt,
  ExamEvent,
  LessonRegister,
  Material,
  PastPaper,
  Period,
  Presence,
  Question,
  RubricPoint,
  StaffMember,
  Subject,
  Topic,
  WrittenSubmission,
  WrittenTask,
} from '@school-intel/contracts';

const t = (date: string, time: string) => `${date}T${time}:00+04:00`;
const D = '2026-10-06';

export const CLASS_7A = ['stu-sara', 'stu-lina', 'stu-yusuf', 'stu-hamdan', 'stu-zara', 'stu-ibrahim', 'stu-noor', 'stu-leo', 'stu-hana'];

export const extraStaff: StaffMember[] = [
  { id: 'st-priya', name: 'Priya Menon', title: 'Science teacher · Year 7', initials: 'PM', roles: ['teacher'], classIds: ['7A'], email: 'priya.menon@horizon.example' },
  { id: 'st-james', name: 'James Carter', title: 'English teacher · Year 7', initials: 'JC', roles: ['teacher'], classIds: ['7A'], email: 'james.carter@horizon.example' },
  { id: 'st-huda', name: 'Huda Al Mansoori', title: 'Arabic teacher · Years 6–8', initials: 'HM', roles: ['teacher'], classIds: ['7A'], email: 'huda.almansoori@horizon.example' },
];

export const subjects: Subject[] = [
  { id: 'sub-math', name: 'Mathematics', short: 'Maths', classId: '7A', teacherId: 'st-nadia', hue: 248 },
  { id: 'sub-sci', name: 'Science', short: 'Science', classId: '7A', teacherId: 'st-priya', hue: 162 },
  { id: 'sub-eng', name: 'English', short: 'English', classId: '7A', teacherId: 'st-james', hue: 18 },
  { id: 'sub-ara', name: 'Arabic', short: 'Arabic', classId: '7A', teacherId: 'st-huda', hue: 38 },
];

export const topics: Topic[] = [
  { id: 'tp-eqf', subjectId: 'sub-math', name: 'Equivalent fractions', order: 1 },
  { id: 'tp-simp', subjectId: 'sub-math', name: 'Simplifying fractions', order: 2 },
  { id: 'tp-unlike', subjectId: 'sub-math', name: 'Adding unlike denominators', order: 3 },
  { id: 'tp-dec', subjectId: 'sub-math', name: 'Decimals and percentages', order: 4 },
  { id: 'tp-ang', subjectId: 'sub-math', name: 'Angles', order: 5 },
  { id: 'tp-som', subjectId: 'sub-sci', name: 'States of matter', order: 1 },
  { id: 'tp-part', subjectId: 'sub-sci', name: 'The particle model', order: 2 },
  { id: 'tp-chg', subjectId: 'sub-sci', name: 'Changes of state', order: 3 },
  { id: 'tp-cell', subjectId: 'sub-sci', name: 'Cells', order: 4 },
  { id: 'tp-pers', subjectId: 'sub-eng', name: 'Persuasive writing', order: 1 },
  { id: 'tp-read', subjectId: 'sub-eng', name: 'Reading for inference', order: 2 },
  { id: 'tp-punc', subjectId: 'sub-eng', name: 'Punctuation', order: 3 },
  { id: 'tp-vocab', subjectId: 'sub-ara', name: 'School vocabulary', order: 1 },
  { id: 'tp-arread', subjectId: 'sub-ara', name: 'Reading short texts', order: 2 },
];

export const materials: Material[] = [
  {
    id: 'MAT-101', subjectId: 'sub-math', topicId: 'tp-eqf', kind: 'notes', title: 'Equivalent fractions', minutes: 8, status: 'published', aiGenerated: false, createdBy: 'st-nadia', updatedAt: t('2026-09-28', '14:00'),
    body: 'Equivalent fractions name the same amount. 1/2, 2/4 and 4/8 all cover half of a whole.\n\nTo make an equivalent fraction, multiply or divide the numerator and the denominator by the same number. 3/5 × 2/2 = 6/10.\n\nCheck two fractions by cross-multiplying: 2/3 and 8/12 are equivalent because 2 × 12 = 24 and 3 × 8 = 24.\n\nCommon mistake: adding the same number to the top and bottom. 1/2 is not equal to 2/3.',
  },
  {
    id: 'MAT-102', subjectId: 'sub-math', topicId: 'tp-simp', kind: 'worksheet', title: 'Simplifying fractions: worked examples', minutes: 15, status: 'published', aiGenerated: false, createdBy: 'st-nadia', updatedAt: t('2026-10-01', '13:30'),
    body: 'A fraction is in its simplest form when the numerator and denominator have no common factor except 1.\n\nStep 1: find the highest common factor (HCF) of the numerator and denominator. For 18/24 the HCF is 6.\n\nStep 2: divide both by the HCF. 18 ÷ 6 = 3 and 24 ÷ 6 = 4, so 18/24 = 3/4.\n\nTry these: 12/16, 15/45, 20/35. Answers: 3/4, 1/3, 4/7.',
  },
  {
    id: 'MAT-103', subjectId: 'sub-math', topicId: 'tp-unlike', kind: 'notes', title: 'Adding fractions with unlike denominators', minutes: 10, status: 'published', aiGenerated: false, createdBy: 'st-nadia', updatedAt: t('2026-10-05', '12:10'),
    body: 'You can only add fractions when the denominators are the same.\n\nStep 1: find a common denominator, ideally the lowest common multiple (LCM). For 1/4 + 1/6 the LCM of 4 and 6 is 12.\n\nStep 2: convert each fraction. 1/4 = 3/12 and 1/6 = 2/12.\n\nStep 3: add the numerators and keep the denominator. 3/12 + 2/12 = 5/12. Simplify if you can.',
  },
  {
    id: 'MAT-104', subjectId: 'sub-math', topicId: 'tp-eqf', kind: 'video', title: 'Fractions on a number line (6 min video)', minutes: 6, status: 'published', aiGenerated: false, createdBy: 'st-nadia', updatedAt: t('2026-09-25', '09:00'),
    body: 'Video summary: a number line from 0 to 1 is split into equal parts. Halves, quarters and eighths line up at the same points, which shows why 1/2 = 2/4 = 4/8.\n\nPause at 3:10 and place 3/4 and 6/8 on your own number line.',
  },
  {
    id: 'MAT-105', subjectId: 'sub-math', topicId: 'tp-eqf', kind: 'notes', title: 'Revision cards: equivalent fractions', minutes: 4, status: 'draft', aiGenerated: true, createdBy: 'st-nadia', updatedAt: t(D, '08:40'),
    body: 'Card 1: Equivalent fractions name the same amount.\n\nCard 2: Multiply or divide top and bottom by the same number.\n\nCard 3: Cross-multiply to check: a/b = c/d when a × d = b × c.\n\nCard 4: Never add the same number to top and bottom.',
  },
  {
    id: 'MAT-201', subjectId: 'sub-sci', topicId: 'tp-som', kind: 'notes', title: 'States of matter', minutes: 8, status: 'published', aiGenerated: false, createdBy: 'st-priya', updatedAt: t('2026-09-29', '15:00'),
    body: 'Matter exists as solids, liquids and gases.\n\nSolids have a fixed shape and volume. Liquids have a fixed volume but take the shape of their container. Gases fill any container and can be compressed.\n\nThe state depends on how strongly particles are held together and how much energy they have.',
  },
  {
    id: 'MAT-202', subjectId: 'sub-sci', topicId: 'tp-part', kind: 'slides', title: 'The particle model', minutes: 12, status: 'published', aiGenerated: false, createdBy: 'st-priya', updatedAt: t('2026-10-02', '11:00'),
    body: 'All matter is made of tiny particles that are always moving.\n\nIn a solid, particles are close together in a regular pattern and vibrate in place. In a liquid, particles are close together but can move past each other. In a gas, particles are far apart and move quickly in all directions.\n\nHeating gives particles more energy, so they move faster and spread out.',
  },
  {
    id: 'MAT-203', subjectId: 'sub-sci', topicId: 'tp-chg', kind: 'notes', title: 'Changes of state', minutes: 9, status: 'published', aiGenerated: false, createdBy: 'st-priya', updatedAt: t('2026-10-05', '14:20'),
    body: 'Melting: solid to liquid. Freezing: liquid to solid. Evaporation and boiling: liquid to gas. Condensation: gas to liquid.\n\nDuring a change of state the temperature stays the same, because the energy is used to break or form bonds between particles.\n\nWater melts at 0 °C and boils at 100 °C at sea level.',
  },
  {
    id: 'MAT-301', subjectId: 'sub-eng', topicId: 'tp-pers', kind: 'notes', title: 'Writing a persuasive paragraph (PEEL)', minutes: 10, status: 'published', aiGenerated: false, createdBy: 'st-james', updatedAt: t('2026-10-01', '10:00'),
    body: 'Use PEEL to build a persuasive paragraph.\n\nPoint: state your opinion clearly, for example "I believe the school day should start later."\n\nEvidence: support it with a fact, statistic or example, for example "a study found that teenagers need 8 to 10 hours of sleep."\n\nExplain: show why the evidence matters, using phrases like "this means" or "as a result".\n\nLink: end by connecting back to your point, for example "In conclusion, a later start would help students learn."',
  },
  {
    id: 'MAT-401', subjectId: 'sub-ara', topicId: 'tp-vocab', kind: 'notes', title: 'مفردات المدرسة · School vocabulary', minutes: 7, status: 'published', aiGenerated: false, createdBy: 'st-huda', updatedAt: t('2026-09-30', '12:00'),
    body: 'مدرسة (madrasa): school. معلم / معلمة (mu‘allim / mu‘allima): teacher. طالب / طالبة (ṭālib / ṭāliba): student.\n\nفصل (faṣl): classroom. كتاب (kitāb): book. قلم (qalam): pen.\n\nPractise: say each word aloud, then write one sentence: أنا طالب في المدرسة. (I am a student at the school.)',
  },
];

const mcq = (id: string, subjectId: string, topicId: string, prompt: string, options: string[], answer: number, explanation: string, difficulty: 1 | 2 | 3 = 1, extra: Partial<Question> = {}): Question => ({
  id, subjectId, topicId, type: 'mcq', prompt, options, answer: String(answer), explanation, marks: 1, difficulty, status: 'approved', aiGenerated: false, ...extra,
});
const num = (id: string, subjectId: string, topicId: string, prompt: string, answer: string, explanation: string, difficulty: 1 | 2 | 3 = 2, extra: Partial<Question> = {}): Question => ({
  id, subjectId, topicId, type: 'numeric', prompt, answer, explanation, marks: 1, difficulty, status: 'approved', aiGenerated: false, ...extra,
});

const rubricParticles: RubricPoint[] = [
  { id: 'r1', criterion: 'Describes particle spacing in a solid and a liquid', marks: 2, keywords: ['close', 'regular', 'pattern', 'apart'] },
  { id: 'r2', criterion: 'Explains particle movement', marks: 2, keywords: ['vibrate', 'move', 'slide', 'past each other', 'fixed position'] },
  { id: 'r3', criterion: 'Links heating to energy', marks: 1, keywords: ['energy', 'heat', 'faster'] },
];

export const questions: Question[] = [
  mcq('Q-101', 'sub-math', 'tp-eqf', 'Which fraction is equivalent to 3/4?', ['6/8', '4/5', '3/8', '9/16'], 0, '3/4 × 2/2 = 6/8.'),
  mcq('Q-102', 'sub-math', 'tp-eqf', 'Which pair of fractions is NOT equivalent?', ['1/2 and 5/10', '2/3 and 8/12', '3/5 and 4/6', '4/8 and 1/2'], 2, '3 × 6 = 18 but 5 × 4 = 20, so 3/5 ≠ 4/6.', 2),
  num('Q-103', 'sub-math', 'tp-eqf', 'Complete: 2/5 = ?/20', '8', '5 × 4 = 20, so 2 × 4 = 8.', 1),
  mcq('Q-104', 'sub-math', 'tp-eqf', 'Sara says 1/2 = 2/3 because she added 1 to the top and bottom. What is wrong?', ['Nothing, she is right', 'You must multiply or divide, not add', 'You must subtract instead', 'Only the denominator changes'], 1, 'Equivalent fractions come from multiplying or dividing top and bottom by the same number.', 2),
  num('Q-105', 'sub-math', 'tp-simp', 'Simplify 18/24. Write your answer as a fraction, e.g. 3/4.', '3/4', 'HCF of 18 and 24 is 6; 18 ÷ 6 = 3, 24 ÷ 6 = 4.'),
  num('Q-106', 'sub-math', 'tp-simp', 'Simplify 15/45.', '1/3', 'HCF is 15; 15/45 = 1/3.'),
  mcq('Q-107', 'sub-math', 'tp-simp', 'What is the highest common factor of 20 and 35?', ['5', '7', '10', '4'], 0, 'Factors of 20: 1, 2, 4, 5, 10, 20. Factors of 35: 1, 5, 7, 35. HCF = 5.', 1),
  num('Q-108', 'sub-math', 'tp-unlike', 'Work out 1/4 + 1/6. Give your answer in its simplest form.', '5/12', 'LCM of 4 and 6 is 12; 3/12 + 2/12 = 5/12.', 2),
  num('Q-109', 'sub-math', 'tp-unlike', 'Work out 2/3 + 1/5.', '13/15', '10/15 + 3/15 = 13/15.', 2),
  mcq('Q-110', 'sub-math', 'tp-unlike', 'What is the lowest common denominator of 3/8 and 1/6?', ['48', '24', '14', '12'], 1, 'LCM of 8 and 6 is 24.', 2),
  num('Q-111', 'sub-math', 'tp-dec', 'Write 3/4 as a percentage. Enter the number only.', '75', '3 ÷ 4 = 0.75 = 75%.', 1),
  mcq('Q-112', 'sub-math', 'tp-ang', 'Angles on a straight line add up to…', ['90°', '180°', '270°', '360°'], 1, 'A straight line is a half turn: 180°.', 1),
  num('Q-113', 'sub-math', 'tp-ang', 'Two angles on a straight line are 65° and x°. Find x.', '115', '180 − 65 = 115.', 1),
  mcq('Q-201', 'sub-sci', 'tp-som', 'Which state of matter has a fixed volume but no fixed shape?', ['Solid', 'Liquid', 'Gas', 'None'], 1, 'Liquids keep their volume but take the shape of their container.'),
  mcq('Q-202', 'sub-sci', 'tp-som', 'Which state can be compressed easily?', ['Solid', 'Liquid', 'Gas'], 2, 'Gas particles are far apart, so they can be pushed closer together.'),
  mcq('Q-203', 'sub-sci', 'tp-part', 'In a solid, particles…', ['move freely in all directions', 'vibrate about fixed positions', 'slide past each other', 'do not move at all'], 1, 'Solid particles are held in a regular pattern and vibrate in place.', 2),
  mcq('Q-204', 'sub-sci', 'tp-part', 'What happens to particles when a substance is heated?', ['They get bigger', 'They gain energy and move faster', 'They stop moving', 'They lose mass'], 1, 'Heating transfers energy, so particles move faster; they do not grow.', 2),
  mcq('Q-205', 'sub-sci', 'tp-chg', 'What is the change from gas to liquid called?', ['Evaporation', 'Melting', 'Condensation', 'Freezing'], 2, 'Condensation is gas becoming liquid, like steam on a cold mirror.'),
  num('Q-206', 'sub-sci', 'tp-chg', 'At what temperature (°C) does pure water boil at sea level?', '100', 'Water boils at 100 °C at sea level.', 1),
  {
    id: 'Q-207', subjectId: 'sub-sci', topicId: 'tp-part', type: 'short', prompt: 'Use the particle model to explain the difference between a solid and a liquid. (5 marks)', answer: 'In a solid, particles are close together in a regular pattern and vibrate about fixed positions. In a liquid, particles are still close together but are not in a pattern and can move past each other. Heating gives particles more energy so they move faster.', explanation: 'Mention spacing, arrangement, movement and energy.', marks: 5, difficulty: 3, status: 'approved', aiGenerated: false, rubric: rubricParticles,
  },
  mcq('Q-301', 'sub-eng', 'tp-pers', 'In PEEL, what does the second E stand for?', ['Example', 'Explain', 'Evidence', 'Ending'], 1, 'Point, Evidence, Explain, Link.'),
  mcq('Q-302', 'sub-eng', 'tp-punc', 'Which sentence uses an apostrophe correctly?', ["The dog's bowl is empty.", "The dogs' bowl's are empty.", "Its' a sunny day.", "The cat's are asleep."], 0, "One dog owns the bowl: dog's."),
  mcq('Q-401', 'sub-ara', 'tp-vocab', 'What does «معلم» mean?', ['Book', 'Teacher', 'School', 'Pen'], 1, 'معلم (mu‘allim) means teacher.'),
  mcq('Q-402', 'sub-ara', 'tp-vocab', 'Which word means "school"?', ['فصل', 'قلم', 'مدرسة', 'كتاب'], 2, 'مدرسة (madrasa) means school.'),
  // Past-paper questions (school-authored end-of-term paper, June 2025)
  num('PP-M1', 'sub-math', 'tp-eqf', 'Write two fractions that are equivalent to 4/6. Enter the simplest one.', '2/3', '4/6 ÷ 2/2 = 2/3.', 2, { paperId: 'PAPER-M-2025' }),
  num('PP-M2', 'sub-math', 'tp-unlike', 'Work out 3/4 + 1/8.', '7/8', '6/8 + 1/8 = 7/8.', 2, { paperId: 'PAPER-M-2025' }),
  num('PP-M3', 'sub-math', 'tp-simp', 'Simplify 24/36.', '2/3', 'HCF is 12.', 2, { paperId: 'PAPER-M-2025' }),
  mcq('PP-M4', 'sub-math', 'tp-dec', 'Which is the largest? 0.6, 5/8, 62%, 3/5', ['0.6', '5/8', '62%', '3/5'], 1, '5/8 = 0.625, the largest.', 3, { paperId: 'PAPER-M-2025' }),
  num('PP-M5', 'sub-math', 'tp-ang', 'Angles around a point are 120°, 95° and x°. Find x.', '145', '360 − 120 − 95 = 145.', 2, { paperId: 'PAPER-M-2025' }),
  mcq('PP-S1', 'sub-sci', 'tp-chg', 'Ice cream left in the sun turns to liquid. This is…', ['Condensation', 'Melting', 'Boiling', 'Freezing'], 1, 'Solid to liquid is melting.', 1, { paperId: 'PAPER-S-2025' }),
  mcq('PP-S2', 'sub-sci', 'tp-part', 'Why does a gas fill its container?', ['Its particles are large', 'Its particles move quickly in all directions', 'Its particles are heavy', 'It has no particles'], 1, 'Gas particles move fast and spread out.', 2, { paperId: 'PAPER-S-2025' }),
  mcq('PP-S3', 'sub-sci', 'tp-som', 'Which property do solids and liquids share?', ['Fixed shape', 'Fixed volume', 'Easily compressed', 'Fill any container'], 1, 'Both keep their volume.', 2, { paperId: 'PAPER-S-2025' }),
  // AI-generated drafts awaiting teacher review
  mcq('Q-AI-1', 'sub-math', 'tp-eqf', 'Which fraction is equivalent to 5/6?', ['10/12', '6/7', '5/12', '25/36'], 0, '5/6 × 2/2 = 10/12.', 1, { status: 'draft', aiGenerated: true }),
  num('Q-AI-2', 'sub-math', 'tp-eqf', 'Complete: 3/7 = 12/?', '28', '3 × 4 = 12, so 7 × 4 = 28.', 2, { status: 'draft', aiGenerated: true }),
];

export const pastPapers: PastPaper[] = [
  { id: 'PAPER-M-2025', board: 'Horizon end-of-term paper', subjectId: 'sub-math', year: 2025, session: 'June', title: 'Year 7 Mathematics · Paper 1', questionIds: ['PP-M1', 'PP-M2', 'PP-M3', 'PP-M4', 'PP-M5'], licence: 'School-authored · free to use within Horizon' },
  { id: 'PAPER-S-2025', board: 'Horizon end-of-term paper', subjectId: 'sub-sci', year: 2025, session: 'June', title: 'Year 7 Science · Paper 1', questionIds: ['PP-S1', 'PP-S2', 'PP-S3'], licence: 'School-authored · free to use within Horizon' },
  { id: 'PAPER-M-2024', board: 'Horizon end-of-term paper', subjectId: 'sub-math', year: 2024, session: 'December', title: 'Year 7 Mathematics · Mid-year', questionIds: ['Q-101', 'Q-105', 'Q-108', 'Q-112', 'Q-113'], licence: 'School-authored · free to use within Horizon' },
];

export const assessments: Assessment[] = [
  { id: 'AS-BASE', kind: 'test', title: 'Fractions baseline test', subjectId: 'sub-math', classId: '7A', questionIds: ['Q-101', 'Q-102', 'Q-103', 'Q-105', 'Q-106', 'Q-108', 'Q-110', 'Q-111'], durationMin: 25, opensAt: t('2026-09-21', '10:20'), closesAt: t('2026-09-21', '11:00'), status: 'closed', resultsReleased: true, createdBy: 'st-nadia' },
  { id: 'AS-QZ1', kind: 'quiz', title: 'Equivalent fractions check', subjectId: 'sub-math', classId: '7A', questionIds: ['Q-101', 'Q-102', 'Q-103', 'Q-104'], opensAt: t('2026-10-05', '11:10'), status: 'open', resultsReleased: true, createdBy: 'st-nadia' },
  { id: 'AS-QZ2', kind: 'quiz', title: 'States of matter quick quiz', subjectId: 'sub-sci', classId: '7A', questionIds: ['Q-201', 'Q-202', 'Q-205', 'Q-206'], opensAt: t('2026-10-02', '12:00'), status: 'open', resultsReleased: true, createdBy: 'st-priya' },
  { id: 'AS-QZ3', kind: 'quiz', title: 'Arabic vocabulary practice', subjectId: 'sub-ara', classId: '7A', questionIds: ['Q-401', 'Q-402'], opensAt: t('2026-10-01', '09:00'), status: 'open', resultsReleased: true, createdBy: 'st-huda' },
  { id: 'AS-SCI-T1', kind: 'test', title: 'Particles unit test', subjectId: 'sub-sci', classId: '7A', questionIds: ['Q-203', 'Q-204', 'Q-205', 'Q-207'], durationMin: 20, opensAt: t(D, '07:30'), closesAt: t(D, '23:59'), status: 'open', resultsReleased: false, createdBy: 'st-priya' },
  { id: 'AS-MATH-CP', kind: 'test', title: 'Fractions checkpoint', subjectId: 'sub-math', classId: '7A', questionIds: ['Q-103', 'Q-105', 'Q-107', 'Q-108', 'Q-109', 'PP-M2'], durationMin: 30, opensAt: t('2026-10-09', '10:20'), closesAt: t('2026-10-09', '11:00'), status: 'scheduled', resultsReleased: false, createdBy: 'st-nadia' },
];

// Deterministic pseudo-random so every reset produces the same class history.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const ability: Record<string, number> = { 'stu-sara': 0.7, 'stu-lina': 0.9, 'stu-yusuf': 0.45, 'stu-hamdan': 0.6, 'stu-zara': 0.95, 'stu-ibrahim': 0.68, 'stu-noor': 0.82, 'stu-leo': 0.55, 'stu-hana': 0.88 };

export function seededAttempts(): Attempt[] {
  const r = rng(42);
  const out: Attempt[] = [];
  const base = assessments.find((a) => a.id === 'AS-BASE')!;
  CLASS_7A.forEach((sid, i) => {
    const items = base.questionIds.map((qid) => {
      const q = questions.find((x) => x.id === qid)!;
      // Sara is secure on simplifying but weaker on unlike denominators (matches her passport).
      const roll = r() < ability[sid];
      const correct = sid === 'stu-sara' ? !['Q-102', 'Q-108', 'Q-110'].includes(qid) : roll;
      return { questionId: qid, answer: correct ? q.answer : '—', max: q.marks, awarded: correct ? q.marks : 0, correct, status: 'auto' as const };
    });
    out.push({ id: `AT-B${i + 1}`, assessmentId: 'AS-BASE', studentId: sid, startedAt: t('2026-09-21', '10:22'), submittedAt: t('2026-09-21', '10:46'), items, status: 'released' });
  });
  // A few quiz attempts so class analytics are not empty.
  ['stu-lina', 'stu-zara', 'stu-noor', 'stu-leo'].forEach((sid, i) => {
    const qz = assessments.find((a) => a.id === 'AS-QZ2')!;
    const items = qz.questionIds.map((qid) => {
      const q = questions.find((x) => x.id === qid)!;
      const correct = r() < ability[sid];
      return { questionId: qid, answer: correct ? q.answer : '—', max: q.marks, awarded: correct ? 1 : 0, correct, status: 'auto' as const };
    });
    out.push({ id: `AT-Q${i + 1}`, assessmentId: 'AS-QZ2', studentId: sid, startedAt: t('2026-10-03', '17:00'), submittedAt: t('2026-10-03', '17:06'), items, status: 'released' });
  });
  return out;
}

export const writtenTasks: WrittenTask[] = [
  {
    id: 'WT-ENG-1', classId: '7A', subjectId: 'sub-eng', topicId: 'tp-pers', title: 'Persuasive paragraph: should school start later?', due: t('2026-10-08', '18:00'), minWords: 80,
    prompt: 'Write one persuasive paragraph (80–150 words) arguing whether Dubai schools should start later in the morning. Use the PEEL structure.',
    rubric: [
      { id: 'p', criterion: 'Point: clear opinion', marks: 2, keywords: ['should', 'believe', 'think', 'argue', 'opinion'] },
      { id: 'e', criterion: 'Evidence: fact, statistic or example', marks: 3, keywords: ['because', 'for example', 'study', 'research', 'hours', '%', 'survey'] },
      { id: 'x', criterion: 'Explain: why the evidence matters', marks: 3, keywords: ['this means', 'therefore', 'as a result', 'so ', 'which'] },
      { id: 'l', criterion: 'Link and conclusion', marks: 2, keywords: ['in conclusion', 'overall', 'to conclude', 'clearly', 'that is why'] },
    ],
  },
];

export const seededWritten: Array<Omit<WrittenSubmission, 'suggestions' | 'confidence' | 'aiFeedback'>> = [
  { id: 'WS-1', taskId: 'WT-ENG-1', studentId: 'stu-lina', submittedAt: t('2026-10-05', '19:40'), status: 'ai-suggested', text: 'I believe Dubai schools should start later in the morning. A study found that teenagers need 8 to 10 hours of sleep, but many students wake up at 6am to catch the bus. This means they arrive tired and find it hard to concentrate in the first lessons. As a result, their learning suffers even when teachers plan great lessons. In conclusion, starting school at 8:30 would help students be healthier and learn more.' },
  { id: 'WS-2', taskId: 'WT-ENG-1', studentId: 'stu-leo', submittedAt: t('2026-10-05', '21:05'), status: 'ai-suggested', text: 'Schools should start later. Students are tired. I am always tired in the morning and so are my friends. Later is better.' },
  { id: 'WS-3', taskId: 'WT-ENG-1', studentId: 'stu-zara', submittedAt: t('2026-10-06', '07:15'), status: 'ai-suggested', text: 'I think schools should not start later. For example, in summer the afternoons are very hot, so finishing later would mean walking home in more heat. Therefore an early start keeps students safer and lets families use the cooler evening. Some students also have clubs after school. Overall, the current time works best for Dubai.' },
];

export const doubts: Doubt[] = [
  {
    id: 'DB-201', studentId: 'stu-sara', subjectId: 'sub-math', topicId: 'tp-unlike', question: 'Why can’t I just add the tops and bottoms when I add 1/4 + 1/6?', status: 'ai-answered', createdAt: t('2026-10-05', '18:22'),
    messages: [
      { from: 'student', author: 'Sara Ahmed', text: 'Why can’t I just add the tops and bottoms when I add 1/4 + 1/6?', at: t('2026-10-05', '18:22') },
      { from: 'ai', author: 'Study helper', text: 'Good question. Fractions can only be added when the pieces are the same size.', steps: ['Quarters and sixths are different-sized pieces, so you need a common denominator first.', 'Find the lowest common multiple of 4 and 6. What is the first number both go into?', 'Change both fractions to twelfths, then add only the numerators.'], sources: ['Adding fractions with unlike denominators'], at: t('2026-10-05', '18:22') },
    ],
  },
  {
    id: 'DB-202', studentId: 'stu-leo', subjectId: 'sub-sci', topicId: 'tp-chg', question: 'Why does the temperature stop going up when water is boiling?', status: 'escalated', createdAt: t('2026-10-05', '20:10'),
    messages: [
      { from: 'student', author: 'Leo Martins', text: 'Why does the temperature stop going up when water is boiling?', at: t('2026-10-05', '20:10') },
      { from: 'ai', author: 'Study helper', text: 'During a change of state the energy goes into separating particles, not into making them faster.', steps: ['Look at the notes on changes of state, paragraph 2.', 'Think about what the heat energy is being used for while the water turns to steam.'], sources: ['Changes of state'], at: t('2026-10-05', '20:10') },
      { from: 'student', author: 'Leo Martins', text: 'I still don’t get where the energy goes. Can my teacher explain?', at: t('2026-10-05', '20:14') },
    ],
  },
  {
    id: 'DB-203', studentId: 'stu-yusuf', subjectId: 'sub-math', topicId: 'tp-simp', question: 'How do I find the HCF of 24 and 36 quickly?', status: 'escalated', createdAt: t(D, '07:05'),
    messages: [
      { from: 'student', author: 'Yusuf Ali', text: 'How do I find the HCF of 24 and 36 quickly?', at: t(D, '07:05') },
      { from: 'ai', author: 'Study helper', text: 'List the factors of the smaller number, then test them on the larger one.', steps: ['Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24.', 'Which of these also divide 36?', 'The biggest one that works is the HCF.'], sources: ['Simplifying fractions: worked examples'], at: t(D, '07:05') },
      { from: 'student', author: 'Yusuf Ali', text: 'Is there a faster way for big numbers?', at: t(D, '07:08') },
    ],
  },
];

export const examEvents: ExamEvent[] = [
  { id: 'EX-1', classId: '7A', subjectId: 'sub-math', title: 'Fractions checkpoint', date: t('2026-10-09', '10:20'), topicIds: ['tp-eqf', 'tp-simp', 'tp-unlike'] },
  { id: 'EX-2', classId: '7A', subjectId: 'sub-sci', title: 'Matter end-of-unit test', date: t('2026-10-14', '08:40'), topicIds: ['tp-som', 'tp-part', 'tp-chg'] },
  { id: 'EX-3', classId: '7A', subjectId: 'sub-eng', title: 'Persuasive writing assessment', date: t('2026-10-20', '07:45'), topicIds: ['tp-pers', 'tp-punc'] },
  { id: 'EX-4', classId: '7A', subjectId: 'sub-ara', title: 'Arabic vocabulary quiz', date: t('2026-10-22', '09:35'), topicIds: ['tp-vocab'] },
];

const week: Array<[string, string, string, string]> = [
  ['07:45', '08:35', 'sub-eng', 'A112'],
  ['08:40', '09:30', 'sub-sci', 'Lab 2'],
  ['09:35', '10:15', 'sub-ara', 'A108'],
  ['10:20', '11:10', 'sub-math', 'B204'],
  ['11:15', '12:05', 'sub-sci', 'Lab 2'],
  ['12:40', '13:30', 'sub-math', 'B204'],
];

export const periods: Period[] = [1, 2, 3, 4, 5].flatMap((day) =>
  week.map(([start, end, subjectId, room], i) => {
    // Rotate the order a little each day so the timetable looks real.
    const [s2] = [week[(i + day) % week.length]];
    const sid = day === 2 ? subjectId : s2[2];
    return { id: `P-${day}-${i + 1}`, classId: '7A', subjectId: sid, day, start, end, room: day === 2 ? room : s2[3] };
  }),
);

export function seededRegisters(): LessonRegister[] {
  const today = periods.filter((p) => p.day === 2);
  return today.map((p, i) => {
    const done = i < 3; // first three lessons already registered
    const marks: Record<string, Presence> = {};
    CLASS_7A.forEach((s) => (marks[s] = 'present'));
    if (done) marks['stu-leo'] = i === 0 ? 'late' : 'present';
    return { id: `LR-${p.id}`, periodId: p.id, date: D, marks, status: done ? 'submitted' : 'open', takenBy: done ? 'st-nadia' : undefined, takenAt: done ? t(D, p.start) : undefined };
  });
}

export function seededAttendanceHistory(): Record<string, AttendanceDay[]> {
  const r = rng(7);
  const days: string[] = [];
  const d = new Date('2026-08-24T12:00:00+04:00');
  while (days.length < 31) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const profile: Record<string, number> = { 'stu-sara': 0.97, 'stu-adam': 0.98, 'stu-omar': 0.9, 'stu-lina': 0.99, 'stu-yusuf': 0.93, 'stu-hamdan': 0.96, 'stu-zara': 1, 'stu-ibrahim': 0.95, 'stu-noor': 0.97, 'stu-leo': 0.92, 'stu-hana': 0.98, 'stu-maya': 0.94 };
  const out: Record<string, AttendanceDay[]> = {};
  for (const [sid, p] of Object.entries(profile)) {
    out[sid] = days.filter((x) => x < D).map((date) => {
      const v = r();
      const status: Presence = v < p ? 'present' : v < p + (1 - p) / 2 ? 'late' : r() < 0.6 ? 'excused' : 'absent';
      return { date, status };
    });
  }
  return out;
}

export const behaviourPoints: BehaviourPoint[] = [
  { id: 'BP-1', studentId: 'stu-sara', kind: 'merit', category: 'Excellent work', points: 2, note: 'Clear explanation of simplifying fractions to the class.', by: 'Nadia Farooq', at: t('2026-10-05', '11:05'), parentNotified: true },
  { id: 'BP-2', studentId: 'stu-sara', kind: 'merit', category: 'Kindness', points: 1, note: 'Helped a new student find the science lab.', by: 'Priya Menon', at: t('2026-09-30', '09:40'), parentNotified: true },
  { id: 'BP-3', studentId: 'stu-leo', kind: 'demerit', category: 'Homework not submitted', points: 1, note: 'Reading log missing for the second week.', by: 'James Carter', at: t('2026-10-01', '08:30'), parentNotified: true },
  { id: 'BP-4', studentId: 'stu-zara', kind: 'merit', category: 'Leadership', points: 3, note: 'Organised the class recycling rota.', by: 'Nadia Farooq', at: t('2026-09-29', '13:00'), parentNotified: true },
  { id: 'BP-5', studentId: 'stu-hamdan', kind: 'merit', category: 'Participation', points: 1, note: 'Strong contributions in discussion.', by: 'Nadia Farooq', at: t('2026-10-02', '10:50'), parentNotified: true },
  { id: 'BP-6', studentId: 'stu-yusuf', kind: 'demerit', category: 'Late to lesson', points: 1, note: 'Arrived 10 minutes late without a note.', by: 'Huda Al Mansoori', at: t('2026-10-05', '09:45'), parentNotified: true },
  { id: 'BP-7', studentId: 'stu-noor', kind: 'merit', category: 'Excellent work', points: 2, note: 'Outstanding persuasive paragraph draft.', by: 'James Carter', at: t('2026-10-03', '12:00'), parentNotified: true },
  { id: 'BP-8', studentId: 'stu-hana', kind: 'merit', category: 'Effort', points: 1, note: 'Completed every practice quiz this week.', by: 'Nadia Farooq', at: t('2026-10-04', '15:00'), parentNotified: true },
];
