// Original study material generators for CBSE chapters.
// Nothing here reproduces textbook text: each item is a study scaffold anchored to an NCERT chapter title.

import { NCERT_SITE, SUBJECT_FOCUS, subjectFamily } from './primary';

export interface ChapterCtx {
  grade: number;
  subject: string;
  no: number;
  title: string;
  parts?: string[];
  total: number;
  stream?: string;
}

const searchLink = (c: ChapterCtx) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`NCERT Class ${c.grade} ${c.subject} ${c.title}`)}`;
const diksha = 'https://diksha.gov.in/';
const ePathshala = 'https://epathshala.nic.in/';

const stageWord = (g: number) => (g <= 2 ? 'foundational stage' : g <= 5 ? 'preparatory stage' : g <= 8 ? 'middle stage' : g <= 10 ? 'secondary stage' : 'senior secondary stage');

function focusPoints(c: ChapterCtx): string[] {
  if (c.parts?.length) return c.parts.slice(0, 8);
  return SUBJECT_FOCUS[subjectFamily(c.subject)].slice(0, 5);
}

export function notesBody(c: ChapterCtx): { body: string; minutes: number } {
  const pts = focusPoints(c);
  const fam = subjectFamily(c.subject);
  const paras = [
    `Chapter ${c.no} of ${c.total}: ${c.title}. Class ${c.grade} ${c.subject} (CBSE, ${stageWord(c.grade)}).`,
    `Why this chapter matters: it builds the ${fam === 'Mathematics' ? 'problem-solving' : fam === 'English' || fam === 'Hindi' ? 'reading and writing' : 'conceptual understanding'} skills that CBSE tests through competency-focused questions in Class ${c.grade}.`,
    `What to learn:\n${pts.map((p) => `• ${p}`).join('\n')}`,
    `How to study it:\n• Read the chapter once without stopping, then again with a pencil.\n• Write the key terms in your notebook in your own words.\n• Attempt every in-text question before looking at an answer.\n• Close the book and explain the chapter aloud in two minutes.`,
    c.grade >= 9 ? `CBSE exam focus: expect a mix of objective, short-answer, long-answer and case-based questions. Practise writing answers that state the point, give the working or evidence, and end with a conclusion.` : `Class focus: your teacher will check understanding through oral questions, activities and short written work. Neatness and clear explanation earn marks.`,
    `Self-check:\n1. State the central idea of "${c.title}" in one sentence.\n2. Name three terms or ideas from this chapter and explain each in your own words.\n3. Give one example from daily life connected to this chapter.\n4. What was the hardest part? Write one question to ask your teacher.`,
    `Textbook: read this chapter in the NCERT ${c.subject} book for Class ${c.grade} (free at ${NCERT_SITE}). Chapter names follow the NCERT edition; check the current edition for numbering.`,
  ];
  return { body: paras.join('\n\n'), minutes: 8 + Math.min(8, pts.length) };
}

export function revisionBody(c: ChapterCtx): { body: string; minutes: number } {
  const pts = focusPoints(c);
  const cards = pts.map((p, i) => `Card ${i + 1}\nFront: ${p[0].toUpperCase()}${p.slice(1)}: what do you remember?\nBack: write it from memory, then compare with your notes and textbook.`);
  return { body: [`Revision cards: ${c.title} (Class ${c.grade} ${c.subject}). Cover the back of each card and answer aloud.`, ...cards, `Rule of three: revise today, after three days, and after one week.`].join('\n\n'), minutes: 5 };
}

export function worksheetBody(c: ChapterCtx): { body: string; minutes: number } {
  const pts = focusPoints(c);
  const qs = [
    `Section A: Objective (1 mark each)\n1. Fill in: the main topic of this chapter is ______.\n2. True or false: "${pts[0]}" is part of this chapter. Give a reason.\n3. Choose the best word that describes "${c.title}" and justify.`,
    `Section B: Short answer (2 marks each)\n4. Explain ${pts[1] ?? pts[0]} with an example.\n5. Write two differences or two similarities from this chapter.`,
    `Section C: Long answer (4 marks)\n6. Using what you learnt about ${pts[2] ?? pts[0]}, write a detailed answer of 80 to 100 words about "${c.title}".`,
    `Section D: Think and apply (3 marks)\n7. Describe a real situation in which "${pts[0]}" is useful. What would change if it were missing?`,
  ];
  return { body: [`Worksheet: ${c.title} · Class ${c.grade} ${c.subject} · 15 marks · 25 minutes`, ...qs, `Answer in your notebook. Your teacher will mark and give feedback.`].join('\n\n'), minutes: 25 };
}

export function textbookBody(c: ChapterCtx): { body: string; minutes: number } {
  return {
    body: [
      `NCERT textbook · Class ${c.grade} ${c.subject} · "${c.title}"`,
      `Free official sources:\n• NCERT textbooks (PDF): ${NCERT_SITE}\n• DIKSHA learning platform: ${diksha}\n• e-Pathshala: ${ePathshala}`,
      `Video lessons (search): ${searchLink(c)}`,
      `Reading plan: 1) Skim headings and pictures. 2) Read the chapter slowly. 3) Solve the exercises at the end. 4) Mark doubts with a sticky note.`,
      `Note: this app links to the official NCERT sources instead of copying the book, so you always use the current edition.`,
    ].join('\n\n'),
    minutes: 20,
  };
}

export interface SampleSection { name: string; marks: number; count: number }

export const SAMPLE_PATTERN_9_12: SampleSection[] = [
  { name: 'Section A: Multiple choice', marks: 1, count: 16 },
  { name: 'Section B: Very short answer', marks: 2, count: 6 },
  { name: 'Section C: Short answer', marks: 3, count: 7 },
  { name: 'Section D: Long answer', marks: 5, count: 3 },
  { name: 'Section E: Case-based', marks: 4, count: 3 },
];
export const SAMPLE_PATTERN_1_8: SampleSection[] = [
  { name: 'Section A: Objective', marks: 1, count: 10 },
  { name: 'Section B: Short answer', marks: 2, count: 5 },
  { name: 'Section C: Long answer', marks: 4, count: 3 },
];

export function samplePaperBody(grade: number, subject: string, titles: string[], variant: number): { body: string; minutes: number } {
  const pattern = grade >= 9 ? SAMPLE_PATTERN_9_12 : SAMPLE_PATTERN_1_8;
  const total = pattern.reduce((n, s) => n + s.marks * s.count, 0);
  const minutes = grade >= 9 ? 180 : 90;
  let q = 0;
  const pick = (i: number) => titles[(i * 3 + variant) % titles.length];
  const lines = pattern.map((s) => {
    const items: string[] = [];
    for (let i = 0; i < s.count; i++) {
      q++;
      const t = pick(q);
      const stem = s.marks === 1 ? `Choose the correct option about "${t}".` : s.marks === 2 ? `Define or state the key idea of "${t}".` : s.marks === 3 ? `Explain "${t}" with one example.` : s.marks === 4 ? `Read the case from daily life related to "${t}" and answer the questions that follow.` : `Write a detailed answer on "${t}".`;
      items.push(`${q}. (${s.marks} mark${s.marks > 1 ? 's' : ''}) ${stem}`);
    }
    return `${s.name} (${s.count} × ${s.marks} = ${s.count * s.marks})\n${items.join('\n')}`;
  });
  return {
    body: [
      `CBSE-pattern practice paper ${variant + 1} · Class ${grade} ${subject} · ${total} marks · ${minutes} minutes`,
      `General instructions: all questions are compulsory. Internal choices are given in long-answer questions. This is a practice paper written for revision; it is not an official CBSE paper. Official sample papers: https://cbseacademic.nic.in/SQP_CLASSX_2024-25.html`,
      ...lines,
      `Marking guidance: attempt Section A first, then B, C, D and E. Keep ten minutes for revision.`,
    ].join('\n\n'),
    minutes,
  };
}
