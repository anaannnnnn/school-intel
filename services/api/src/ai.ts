// Demo AI engine. In production these functions call the school's approved
// model through the AI gateway (grounded on class materials, logged, with
// teacher review). The static demo cannot run a model, so this module gives
// deterministic, explainable stand-ins with the same inputs and outputs.
// Nothing here talks to the network.

import type { Attempt, Doubt, ExamEvent, MarkSuggestion, Material, Question, RubricPoint, Topic } from '@school-intel/contracts';

export const AI_LABEL = 'Study helper';
export const AI_DISCLOSURE = 'Demo AI: a rules-based stand-in for the school’s approved model. It suggests; teachers decide.';

const STOP = new Set(
  'a an and are as at be but by can do does for from how i if in is it its me my of on or so that the then this to was what when where which who why will with you your just get got still dont don’t cant can’t why’s whats what’s there their they them we our'.split(' '),
);

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ/%°.\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function stem(w: string) {
  return w.replace(/(ing|ed|es|s)$/, '');
}

export function sentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((p) => p.split(/(?<=[.!?])\s+(?=[A-Z0-9"“‘(])/))
    .map((s) => s.trim())
    .filter(Boolean);
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ---------- Objective marking ----------

function normalise(v: string) {
  return v.toLowerCase().replace(/[\s°%]/g, '').replace(/^x=/, '').replace(/,/g, '');
}

function fraction(v: string): [number, number] | null {
  const m = /^(-?\d+)\/(\d+)$/.exec(v);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

export interface ObjectiveResult {
  correct: boolean;
  awarded: number;
  note?: string;
}

/** Auto-marks multiple choice and numeric answers. Fractions must be in simplest form. */
export function markObjective(q: Question, answer: string): ObjectiveResult {
  if (q.type === 'mcq') {
    const correct = answer === q.answer;
    return { correct, awarded: correct ? q.marks : 0 };
  }
  const given = normalise(answer);
  const expected = normalise(q.answer);
  if (!given) return { correct: false, awarded: 0 };
  if (given === expected) return { correct: true, awarded: q.marks };
  const fe = fraction(expected);
  const fg = fraction(given);
  if (fe && fg && fg[1] !== 0 && fg[0] * fe[1] === fe[0] * fg[1]) {
    return { correct: false, awarded: 0, note: 'Equivalent value, but not in its simplest form.' };
  }
  const ne = Number(expected);
  const ng = Number(given);
  if (!Number.isNaN(ne) && !Number.isNaN(ng) && Math.abs(ne - ng) < 1e-9) return { correct: true, awarded: q.marks };
  return { correct: false, awarded: 0 };
}

// ---------- Rubric marking for written answers ----------

export interface RubricResult {
  suggestions: MarkSuggestion[];
  confidence: 'high' | 'medium' | 'low';
  feedback: string;
}

/**
 * Suggests marks per rubric criterion with the sentence used as evidence.
 * The teacher confirms or changes every mark before anything is released.
 */
export function suggestRubricMarks(text: string, rubric: RubricPoint[], minWords = 0): RubricResult {
  const sents = sentences(text);
  const lower = text.toLowerCase();
  const words = wordCount(text);
  const suggestions: MarkSuggestion[] = rubric.map((c) => {
    const hits = c.keywords.filter((k) => lower.includes(k.toLowerCase()));
    let best = '';
    let bestScore = 0;
    for (const s of sents) {
      const score = c.keywords.filter((k) => s.toLowerCase().includes(k.toLowerCase())).length;
      if (score > bestScore) {
        best = s;
        bestScore = score;
      }
    }
    const suggested = hits.length === 0 ? 0 : hits.length === 1 ? Math.ceil(c.marks / 2) : c.marks;
    const rationale =
      hits.length === 0
        ? 'No sentence meets this criterion.'
        : `Uses ${hits.slice(0, 3).map((h) => `“${h.trim()}”`).join(', ')}${hits.length === 1 && c.marks > 1 ? '; only partly developed' : ''}.`;
    return { criterionId: c.id, criterion: c.criterion, max: c.marks, suggested, evidence: best, rationale };
  });

  const partial = suggestions.filter((s) => s.suggested > 0 && s.suggested < s.max).length;
  let confidence: RubricResult['confidence'] = 'high';
  if (minWords && words < minWords * 0.6) confidence = 'low';
  else if (partial >= 2 || (minWords && words < minWords)) confidence = 'medium';

  const strong = suggestions.filter((s) => s.suggested === s.max).map((s) => s.criterion.split(':')[0].toLowerCase());
  const weakest = [...suggestions].sort((a, b) => a.suggested / a.max - b.suggested / b.max)[0];
  const parts: string[] = [];
  if (strong.length) parts.push(`Strengths: ${strong.join(', ')}.`);
  if (weakest && weakest.suggested < weakest.max) parts.push(`Next step: ${nextStep(weakest.criterion)}`);
  if (minWords && words < minWords) parts.push(`Aim for at least ${minWords} words (you wrote ${words}).`);
  if (!parts.length) parts.push('Every criterion is covered. Check spelling and punctuation before you finish.');
  return { suggestions, confidence, feedback: parts.join(' ') };
}

function nextStep(criterion: string) {
  const c = criterion.toLowerCase();
  if (c.startsWith('point')) return 'open with one clear sentence that states your opinion.';
  if (c.startsWith('evidence')) return 'add a fact, statistic or example that supports your point.';
  if (c.startsWith('explain')) return 'explain why your evidence matters, using “this means” or “as a result”.';
  if (c.startsWith('link')) return 'finish by linking back to your opinion, for example “In conclusion…”.';
  if (c.includes('spacing')) return 'describe how close the particles are and how they are arranged.';
  if (c.includes('movement')) return 'say how the particles move in each state.';
  if (c.includes('energy')) return 'link heating to the particles gaining energy.';
  return `develop this part: ${criterion.toLowerCase()}.`;
}

// ---------- Doubt solving (hints, not answers) ----------

export interface DoubtHelp {
  text: string;
  steps: string[];
  sources: string[];
  topicId?: string;
  grounded: boolean;
}

const ANSWER_SEEKING = /(just (tell|give)|what('?s| is) the answer|do (it|my homework) for me|write (it|my)|answer for me)/i;

/** Finds the class material that best matches the doubt and turns it into guided hints. */
export function helpWithDoubt(question: string, materials: Material[], topics: Topic[], subjectId?: string): DoubtHelp {
  const pool = materials.filter((m) => m.status === 'published' && (!subjectId || m.subjectId === subjectId));
  const q = tokens(question).map(stem);
  const scored = pool
    .map((m) => {
      const topic = topics.find((tp) => tp.id === m.topicId);
      const hay = tokens(`${m.title} ${topic?.name ?? ''} ${m.body}`).map(stem);
      const set = new Set(hay);
      const score = q.reduce((n, w) => n + (set.has(w) ? (w.length > 4 || /\d/.test(w) ? 2 : 1) : 0), 0);
      return { m, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top || top.score < 2) {
    return {
      text: 'I could not find this in your class materials, so I would rather not guess. You can send the question to your teacher.',
      steps: [],
      sources: [],
      grounded: false,
    };
  }

  const ranked = sentences(top.m.body)
    .map((s, i) => {
      const set = new Set(tokens(s).map(stem));
      return { s, i, score: q.filter((w) => set.has(w)).length };
    })
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, 3)
    .sort((a, b) => a.i - b.i)
    .map((x) => hintify(x.s));

  const opener = ANSWER_SEEKING.test(question)
    ? 'I can’t give you the final answer, but I can walk you through it so you can get there yourself.'
    : `Let’s work through this using “${top.m.title}”.`;
  return {
    text: opener,
    steps: [...ranked, 'Now try the next step yourself. If you are still unsure, send this to your teacher.'],
    sources: [top.m.title],
    topicId: top.m.topicId,
    grounded: true,
  };
}

/** Turns a worked-example sentence into a hint by holding back the final result. */
function hintify(s: string) {
  return s
    .replace(/\s*=\s*(-?\d+(\/\d+)?(\.\d+)?%?)\.?$/, ' = ?')
    .replace(/(Answers?:)\s.+$/, '$1 check with your teacher after you try.');
}

// ---------- Question generation ----------

function seeded(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 2 ** 32;
  };
}

function shuffle<T>(arr: T[], r: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Draft = Omit<Question, 'id'>;

/** Draft questions for a topic. Drafts stay hidden from students until a teacher approves them. */
export function generateQuestions(topic: Topic, materials: Material[], count: number, seed: string): Draft[] {
  const r = seeded(`${topic.id}:${seed}`);
  const base = { subjectId: topic.subjectId, topicId: topic.id, marks: 1, status: 'draft' as const, aiGenerated: true };
  const out: Draft[] = [];
  const pick = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

  for (let i = 0; i < count; i++) {
    switch (topic.id) {
      case 'tp-eqf': {
        const n = pick(1, 5), d = pick(n + 1, 9), k = pick(2, 5);
        out.push({ ...base, type: 'numeric', prompt: `Complete: ${n}/${d} = ?/${d * k}`, answer: String(n * k), explanation: `${d} × ${k} = ${d * k}, so ${n} × ${k} = ${n * k}.`, difficulty: 1 });
        break;
      }
      case 'tp-simp': {
        const n = pick(1, 6), d = pick(n + 1, 9), k = pick(2, 6);
        const g = gcd(n, d);
        out.push({ ...base, type: 'numeric', prompt: `Simplify ${n * k}/${d * k}.`, answer: `${n / g}/${d / g}`, explanation: `Divide top and bottom by ${k * g}.`, difficulty: 2 });
        break;
      }
      case 'tp-unlike': {
        const a = pick(2, 6), b = pick(2, 7) + (r() < 0.5 ? 1 : 0);
        const den = (a * b) / gcd(a, b);
        const num = den / a + den / b;
        const g = gcd(num, den);
        out.push({ ...base, type: 'numeric', prompt: `Work out 1/${a} + 1/${b}. Give your answer in its simplest form.`, answer: `${num / g}/${den / g}`, explanation: `Common denominator ${den}: ${den / a}/${den} + ${den / b}/${den} = ${num}/${den}.`, difficulty: 2 });
        break;
      }
      case 'tp-dec': {
        const opts = [[1, 4], [1, 5], [3, 5], [2, 5], [7, 10], [3, 20]][pick(0, 5)];
        out.push({ ...base, type: 'numeric', prompt: `Write ${opts[0]}/${opts[1]} as a percentage. Enter the number only.`, answer: String((opts[0] / opts[1]) * 100), explanation: `${opts[0]} ÷ ${opts[1]} × 100.`, difficulty: 1 });
        break;
      }
      case 'tp-ang': {
        const a = pick(25, 155);
        out.push({ ...base, type: 'numeric', prompt: `Two angles on a straight line are ${a}° and x°. Find x.`, answer: String(180 - a), explanation: `180 − ${a} = ${180 - a}.`, difficulty: 1 });
        break;
      }
      default:
        out.push(clozeQuestion(base, materials.filter((m) => m.topicId === topic.id && m.status === 'published'), r, i));
    }
  }
  return out;
}

const TERM = /\b(solids?|liquids?|gas(es)?|particles?|energy|melting|freezing|condensation|evaporation|boiling|volume|shape|vibrate|evidence|point|explain|link|opinion|conclusion|apostrophe|nucleus|cell|membrane)\b/i;

function clozeQuestion(base: Omit<Draft, 'type' | 'prompt' | 'answer' | 'explanation' | 'difficulty' | 'options'>, mats: Material[], r: () => number, i: number): Draft {
  const all = mats.flatMap((m) => sentences(m.body)).filter((s) => TERM.test(s) && s.length < 160);
  if (!all.length) {
    return { ...base, type: 'short', prompt: 'Summarise the key idea of this topic in two sentences.', answer: 'Teacher to add a model answer.', explanation: 'Generated without enough material; review carefully.', difficulty: 2 };
  }
  const s = all[(i + Math.floor(r() * all.length)) % all.length];
  const word = (s.match(TERM)?.[0] ?? '').toLowerCase();
  const pool = ['solid', 'liquid', 'gas', 'energy', 'condensation', 'melting', 'evidence', 'explain', 'conclusion', 'volume', 'shape', 'vibrate'].filter((w) => w !== word);
  const options = shuffle([word, ...shuffle(pool, r).slice(0, 3)], r);
  return {
    ...base,
    type: 'mcq',
    prompt: `Fill the gap: “${s.replace(new RegExp(`\\b${word}\\b`, 'i'), '_____')}”`,
    options,
    answer: String(options.indexOf(word)),
    explanation: `From the class notes: “${s}”`,
    difficulty: 1,
  };
}

// ---------- Material helpers ----------

export function revisionCards(m: Material): string {
  const cards = m.body
    .split(/\n+/)
    .map((p) => sentences(p)[0])
    .filter(Boolean)
    .slice(0, 6);
  return cards.map((c, i) => `Card ${i + 1}: ${c}`).join('\n\n');
}

/** Shorter sentences and a glossary line, for students who need a simpler reading level. */
export function simplify(m: Material): string {
  const simple = sentences(m.body)
    .slice(0, 6)
    .map((s) => s.replace(/\b(However|Therefore|In addition),?\s*/g, '').replace(/,? which /g, '. This '))
    .map((s) => (s.length > 120 ? `${s.slice(0, s.lastIndexOf(' ', 110))}…` : s));
  return `${simple.join('\n\n')}\n\nKey words: ${[...new Set(m.body.match(TERM) ?? [])].slice(0, 5).join(', ') || m.title}.`;
}

// ---------- Papers, plans and insight ----------

export interface Blueprint {
  subjectId: string;
  topicIds: string[];
  count: number;
  includeWritten: boolean;
}

/** Picks approved questions that cover the blueprint evenly, easiest first. */
export function buildPaper(bp: Blueprint, bank: Question[], seed: string): string[] {
  const r = seeded(seed);
  const approved = bank.filter((q) => q.status === 'approved' && q.subjectId === bp.subjectId && bp.topicIds.includes(q.topicId) && (bp.includeWritten || q.type !== 'short'));
  const byTopic = bp.topicIds.map((tp) => shuffle(approved.filter((q) => q.topicId === tp), r));
  const out: Question[] = [];
  let round = 0;
  while (out.length < bp.count && byTopic.some((l) => l.length > round)) {
    for (const list of byTopic) if (list[round] && out.length < bp.count) out.push(list[round]);
    round++;
  }
  return out.sort((a, b) => a.difficulty - b.difficulty).map((q) => q.id);
}

export interface TopicScore {
  topicId: string;
  correct: number;
  total: number;
  pct: number;
}

export function topicScores(attempts: Attempt[], bank: Question[]): TopicScore[] {
  const map = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    if (a.status === 'in-progress') continue;
    for (const it of a.items) {
      const q = bank.find((x) => x.id === it.questionId);
      if (!q || it.awarded === undefined) continue;
      const m = map.get(q.topicId) ?? { correct: 0, total: 0 };
      m.correct += it.awarded;
      m.total += it.max;
      map.set(q.topicId, m);
    }
  }
  return [...map.entries()].map(([topicId, v]) => ({ topicId, ...v, pct: v.total ? Math.round((v.correct / v.total) * 100) : 0 }));
}

export interface PlanTask {
  id: string;
  date: string;
  examId: string;
  topicId: string;
  kind: 'read' | 'practise' | 'past-paper';
  label: string;
  minutes: number;
}

/** Spreads revision before each exam, weakest topics first, about 30 minutes a day. */
export function studyPlan(exams: ExamEvent[], scores: TopicScore[], topics: Topic[], from: string): PlanTask[] {
  const tasks: PlanTask[] = [];
  const addDays = (d: string, n: number) => {
    const x = new Date(`${d}T12:00:00Z`);
    x.setUTCDate(x.getUTCDate() + n);
    return x.toISOString().slice(0, 10);
  };
  const used = new Map<string, number>();
  for (const ex of [...exams].sort((a, b) => a.date.localeCompare(b.date))) {
    const examDay = ex.date.slice(0, 10);
    if (examDay <= from) continue;
    const ordered = [...ex.topicIds].sort((a, b) => (scores.find((s) => s.topicId === a)?.pct ?? 60) - (scores.find((s) => s.topicId === b)?.pct ?? 60));
    let day = from;
    ordered.forEach((tp, i) => {
      const name = topics.find((x) => x.id === tp)?.name ?? tp;
      const weak = (scores.find((s) => s.topicId === tp)?.pct ?? 60) < 65;
      while ((used.get(day) ?? 0) >= 40 && day < examDay) day = addDays(day, 1);
      if (day >= examDay) return;
      tasks.push({ id: `${ex.id}-${tp}-r`, date: day, examId: ex.id, topicId: tp, kind: 'read', label: `Re-read notes: ${name}`, minutes: 10 });
      tasks.push({ id: `${ex.id}-${tp}-p`, date: day, examId: ex.id, topicId: tp, kind: 'practise', label: `${weak ? 'Focus practice' : 'Quick practice'}: ${name}`, minutes: weak ? 20 : 10 });
      used.set(day, (used.get(day) ?? 0) + (weak ? 30 : 20));
      if (i % 2 === 1) day = addDays(day, 1);
    });
    const eve = addDays(examDay, -1);
    if (eve > from) tasks.push({ id: `${ex.id}-pp`, date: eve, examId: ex.id, topicId: ex.topicIds[0], kind: 'past-paper', label: `Timed past paper: ${ex.title}`, minutes: 25 });
  }
  return tasks.sort((a, b) => a.date.localeCompare(b.date));
}

export interface ItemInsight {
  questionId: string;
  pct: number;
  commonWrong?: string;
}

export function itemAnalysis(attempts: Attempt[], questionIds: string[]): ItemInsight[] {
  return questionIds.map((qid) => {
    const items = attempts.flatMap((a) => a.items.filter((i) => i.questionId === qid && i.awarded !== undefined));
    const got = items.reduce((n, i) => n + (i.awarded ?? 0), 0);
    const max = items.reduce((n, i) => n + i.max, 0);
    const wrong = items.filter((i) => !i.correct && i.answer && i.answer !== '—').map((i) => i.answer);
    const freq = new Map<string, number>();
    wrong.forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1));
    const commonWrong = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return { questionId: qid, pct: max ? Math.round((got / max) * 100) : 0, commonWrong };
  });
}

export function doubtThemes(doubts: Doubt[], topics: Topic[]): Array<{ topicId: string; name: string; count: number; escalated: number }> {
  const map = new Map<string, { count: number; escalated: number }>();
  for (const d of doubts) {
    if (!d.topicId) continue;
    const m = map.get(d.topicId) ?? { count: 0, escalated: 0 };
    m.count++;
    if (d.status === 'escalated') m.escalated++;
    map.set(d.topicId, m);
  }
  return [...map.entries()]
    .map(([topicId, v]) => ({ topicId, name: topics.find((t) => t.id === topicId)?.name ?? topicId, ...v }))
    .sort((a, b) => b.count - a.count);
}
