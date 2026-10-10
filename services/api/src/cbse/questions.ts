// CBSE question banks: parametric mathematics items, a hand-written fact bank and chapter reflection questions.
// All questions are original practice items (aiGenerated) and every fact is general knowledge, not copied text.

import type { Question, RubricPoint } from '@school-intel/contracts';

type Rng = () => number;

export function rngFrom(seed: string): Rng {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

export interface RawQ {
  prompt: string;
  type: 'mcq' | 'numeric';
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: 1 | 2 | 3;
}

const mcq = (prompt: string, options: string[], correct: number, explanation: string, difficulty: 1 | 2 | 3 = 1): RawQ => ({ prompt, type: 'mcq', options, answer: String(correct), explanation, difficulty });
const num = (prompt: string, answer: string, explanation: string, difficulty: 1 | 2 | 3 = 1): RawQ => ({ prompt, type: 'numeric', answer, explanation, difficulty });

/** Twelve grade-appropriate mathematics items. Deterministic for a given grade and salt. */
export function mathQuestions(grade: number, salt: string): RawQ[] {
  const r = rngFrom(`m${grade}${salt}`);
  const out: RawQ[] = [];
  for (let i = 0; i < 12; i++) {
    if (grade <= 2) {
      const a = int(r, 3, grade === 1 ? 9 : 49), b = int(r, 2, grade === 1 ? 9 : 40);
      out.push(i % 2 ? num(`What is ${a + b} − ${b}?`, String(a), `${a + b} − ${b} = ${a}.`) : num(`What is ${a} + ${b}?`, String(a + b), `${a} + ${b} = ${a + b}.`));
    } else if (grade <= 5) {
      const a = int(r, 2, 12), b = int(r, 3, 15), k = i % 4;
      if (k === 0) out.push(num(`What is ${a} × ${b}?`, String(a * b), `${a} groups of ${b} make ${a * b}.`));
      else if (k === 1) out.push(num(`${a * b} sweets are shared equally among ${a} children. How many does each child get?`, String(b), `${a * b} ÷ ${a} = ${b}.`));
      else if (k === 2) out.push(num(`A rectangle is ${a + 3} cm long and ${a} cm wide. What is its perimeter in cm?`, String(2 * (2 * a + 3)), `Perimeter = 2 × (length + width) = 2 × ${2 * a + 3}.`, 2));
      else out.push(mcq(`Which is the largest number?`, [String(a * 100 + b), String(a * 100 + b + 10), String(a * 100 + b - 10), String(a * 100 + b + 1)], 1, `Compare the tens digits: ${a * 100 + b + 10} is largest.`));
    } else if (grade <= 8) {
      const k = i % 4;
      if (k === 0) { const p = [10, 20, 25, 40, 50][int(r, 0, 4)], n = int(r, 2, 20) * 20; out.push(num(`What is ${p}% of ${n}?`, String((n * p) / 100), `${p}/100 × ${n} = ${(n * p) / 100}.`, 2)); }
      else if (k === 1) { const x = int(r, 2, 15), a = int(r, 2, 9), b = int(r, 1, 20); out.push(num(`Solve for x: ${a}x + ${b} = ${a * x + b}.`, String(x), `Subtract ${b}, then divide by ${a}: x = ${x}.`, 2)); }
      else if (k === 2) { const b = int(r, 4, 20) * 2, h = int(r, 3, 15); out.push(num(`Find the area (in cm²) of a triangle with base ${b} cm and height ${h} cm.`, String((b * h) / 2), `Area = ½ × ${b} × ${h} = ${(b * h) / 2}.`, 2)); }
      else { const a = int(r, 20, 60), b = int(r, 20, 60), c = int(r, 20, 60); const s = a + b + c; out.push(num(`The marks in three tests are ${a}, ${b} and ${c}. What is the total?`, String(s), `${a} + ${b} + ${c} = ${s}.`)); }
    } else if (grade <= 10) {
      const k = i % 4;
      if (k === 0) { const x = int(r, 2, 12), a = int(r, 2, 8), b = int(r, 1, 15); out.push(num(`Solve for x: ${a}x − ${b} = ${a * x - b}.`, String(x), `Add ${b}, divide by ${a}: x = ${x}.`, 2)); }
      else if (k === 1) { const p = int(r, 1, 6), q = int(r, 1, 6); out.push(num(`Find the sum of the roots of x² − ${p + q}x + ${p * q} = 0.`, String(p + q), `For ax² + bx + c = 0 the sum of roots is −b/a = ${p + q}.`, 2)); }
      else if (k === 2) { const t = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10]][int(r, 0, 3)]; out.push(num(`A right triangle has legs ${t[0]} and ${t[1]}. Find the hypotenuse.`, String(t[2]), `√(${t[0]}² + ${t[1]}²) = ${t[2]}.`, 2)); }
      else { const n = int(r, 5, 20); out.push(num(`Find the sum of the first ${n} natural numbers.`, String((n * (n + 1)) / 2), `Sum = n(n+1)/2 = ${(n * (n + 1)) / 2}.`, 3)); }
    } else {
      const k = i % 4;
      if (k === 0) { const n = int(r, 2, 6), x = int(r, 1, 4); out.push(num(`If f(x) = x^${n}, find f′(${x}).`, String(n * x ** (n - 1)), `f′(x) = ${n}x^${n - 1}, so f′(${x}) = ${n * x ** (n - 1)}.`, 3)); }
      else if (k === 1) { const n = int(r, 4, 9), c = int(r, 2, 3); const f = (m: number): number => (m <= 1 ? 1 : m * f(m - 1)); out.push(num(`Find ${n}C${c}.`, String(f(n) / (f(c) * f(n - c))), `${n}C${c} = ${n}! / (${c}! × ${n - c}!).`, 2)); }
      else if (k === 2) { const a = int(r, 2, 9), b = int(r, 2, 9); out.push(num(`Find the value of lim (x→${a}) of (x² − ${a * a}) / (x − ${a}).`, String(2 * a), `Factor: (x−${a})(x+${a})/(x−${a}) = x + ${a} → ${2 * a}.`, 3 + 0 * b as 3)); }
      else { const a = int(r, 2, 5), b = int(r, 2, 5); out.push(num(`Find the determinant of the matrix [[${a}, ${b}], [${b}, ${a + 1}]].`, String(a * (a + 1) - b * b), `ad − bc = ${a}(${a + 1}) − ${b}·${b}.`, 2)); }
    }
  }
  void gcd;
  return out;
}

/** Simple book-keeping items for Accountancy and Business Studies. */
export function accountsQuestions(salt: string): RawQ[] {
  const r = rngFrom(`a${salt}`);
  const out: RawQ[] = [];
  for (let i = 0; i < 8; i++) {
    const cost = int(r, 20, 90) * 100, gain = int(r, 5, 40) * 100;
    out.push(i % 2 ? num(`Goods bought for ₹${cost} were sold at a profit of ₹${gain}. What was the selling price in ₹?`, String(cost + gain), `Selling price = cost + profit = ${cost + gain}.`) : num(`Sales were ₹${cost + gain} and the cost of goods sold was ₹${cost}. What is the gross profit in ₹?`, String(gain), `Gross profit = sales − cost of goods sold = ${gain}.`, 2));
  }
  return out;
}

interface Fact { s: RegExp; g: [number, number]; q: string; o: string[]; a: number; e: string }
const f = (s: RegExp, g: [number, number], q: string, o: string[], a: number, e: string): Fact => ({ s, g, q, o, a, e });

const SCI = /science|physics|chemistry|biology|evs|environment/i;
const SOC = /social|history|geography|political|civics/i;
const ENG = /english/i;
const ECO = /economics|business|accountancy/i;
const CS = /computer|informatics/i;

const FACTS: Fact[] = [
  f(SCI, [1, 5], 'Which part of a plant takes in water from the soil?', ['Leaf', 'Root', 'Flower', 'Fruit'], 1, 'Roots absorb water and minerals from the soil.'),
  f(SCI, [1, 5], 'Which of these is a source of light?', ['Moon', 'Mirror', 'Sun', 'Book'], 2, 'The Sun makes its own light; the Moon only reflects it.'),
  f(SCI, [1, 5], 'How many legs does an insect have?', ['4', '6', '8', '10'], 1, 'All insects have six legs.'),
  f(SCI, [3, 8], 'Which gas do plants take in for photosynthesis?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], 2, 'Plants use carbon dioxide, water and light to make food.'),
  f(SCI, [3, 8], 'What is the boiling point of pure water at sea level (°C)?', ['50', '100', '150', '0'], 1, 'Water boils at 100 °C at sea level.'),
  f(SCI, [6, 8], 'Which organ pumps blood around the human body?', ['Lungs', 'Liver', 'Heart', 'Kidney'], 2, 'The heart is a muscular pump.'),
  f(SCI, [6, 8], 'A magnet attracts which of these?', ['Plastic comb', 'Iron nail', 'Wooden spoon', 'Rubber band'], 1, 'Iron is a magnetic material.'),
  f(SCI, [6, 8], 'The basic unit of life is the…', ['Atom', 'Cell', 'Organ', 'Tissue'], 1, 'All living things are made of cells.'),
  f(SCI, [7, 9], 'Which of these is an acid?', ['Lemon juice', 'Soap solution', 'Baking soda', 'Lime water'], 0, 'Lemon juice contains citric acid.'),
  f(SCI, [8, 10], 'The SI unit of force is the…', ['Joule', 'Newton', 'Watt', 'Pascal'], 1, 'Force is measured in newtons.'),
  f(SCI, [8, 10], 'Sound cannot travel through…', ['Water', 'Air', 'Steel', 'Vacuum'], 3, 'Sound needs a medium to travel.'),
  f(SCI, [9, 10], 'What is the SI unit of electric current?', ['Volt', 'Ohm', 'Ampere', 'Coulomb'], 2, 'Current is measured in amperes.'),
  f(SCI, [9, 10], 'The powerhouse of the cell is the…', ['Nucleus', 'Mitochondria', 'Ribosome', 'Vacuole'], 1, 'Mitochondria release energy from food.'),
  f(SCI, [9, 10], 'The chemical formula of water is…', ['CO₂', 'H₂O', 'O₂', 'NaCl'], 1, 'Two hydrogen atoms and one oxygen atom.'),
  f(SCI, [10, 10], 'Which lens is used to correct short-sightedness?', ['Convex', 'Concave', 'Bifocal', 'Plane'], 1, 'A concave lens diverges light for myopia.', ),
  f(/physics/i, [11, 12], 'The dimensional formula of velocity is…', ['[LT⁻¹]', '[LT⁻²]', '[ML T⁻¹]', '[L²T⁻¹]'], 0, 'Velocity is length per unit time.'),
  f(/physics/i, [11, 12], 'Which law states that every action has an equal and opposite reaction?', ['First law', 'Second law', 'Third law', "Ohm's law"], 2, "Newton's third law."),
  f(/physics/i, [11, 12], 'The SI unit of capacitance is the…', ['Farad', 'Henry', 'Tesla', 'Weber'], 0, 'Capacitance is measured in farads.'),
  f(/chemistry/i, [11, 12], 'The pH of a neutral solution at 25 °C is…', ['0', '7', '14', '1'], 1, 'Neutral solutions have pH 7.'),
  f(/chemistry/i, [11, 12], 'Avogadro’s number is approximately…', ['6.022 × 10²³', '3 × 10⁸', '9.8', '1.6 × 10⁻¹⁹'], 0, 'One mole contains 6.022 × 10²³ particles.'),
  f(/biology/i, [11, 12], 'DNA stands for…', ['Deoxyribonucleic acid', 'Dinucleic acid', 'Deoxyribose nucleic amine', 'Double nitrogen acid'], 0, 'DNA carries genetic information.'),
  f(/biology/i, [11, 12], 'The functional unit of the kidney is the…', ['Neuron', 'Nephron', 'Alveolus', 'Villus'], 1, 'Nephrons filter blood.'),
  f(SOC, [3, 8], 'What is the capital of India?', ['Mumbai', 'Kolkata', 'New Delhi', 'Chennai'], 2, 'New Delhi is the capital of India.'),
  f(SOC, [3, 8], 'Which is the longest river wholly in India’s heartland known as the holy Ganga’s source state?', ['Uttarakhand', 'Kerala', 'Goa', 'Assam'], 0, 'The Ganga begins as the Bhagirathi in Uttarakhand.'),
  f(SOC, [5, 8], 'How many states and union territories does India have in total (2024)?', ['28 and 8', '29 and 7', '25 and 9', '30 and 5'], 0, 'India has 28 states and 8 union territories.'),
  f(SOC, [6, 8], 'The Indus Valley Civilisation is also known as the…', ['Vedic Civilisation', 'Harappan Civilisation', 'Mauryan Empire', 'Gupta Age'], 1, 'Harappa was an important site.'),
  f(SOC, [6, 8], 'The imaginary line at 0° latitude is the…', ['Equator', 'Prime Meridian', 'Tropic of Cancer', 'Arctic Circle'], 0, 'The Equator divides the Earth into two hemispheres.'),
  f(SOC, [8, 10], 'Who was the first Prime Minister of independent India?', ['Sardar Patel', 'Jawaharlal Nehru', 'Dr B. R. Ambedkar', 'Rajendra Prasad'], 1, 'Jawaharlal Nehru took office in 1947.'),
  f(SOC, [9, 10], 'The Constitution of India came into effect on…', ['15 August 1947', '26 January 1950', '2 October 1949', '26 November 1949'], 1, 'Celebrated as Republic Day.'),
  f(SOC, [9, 10], 'The French Revolution began in the year…', ['1689', '1789', '1815', '1917'], 1, 'The Bastille fell on 14 July 1789.'),
  f(SOC, [9, 10], 'Which is the largest layer of the atmosphere by weather activity?', ['Troposphere', 'Stratosphere', 'Mesosphere', 'Exosphere'], 0, 'Weather occurs in the troposphere.'),
  f(/political|history/i, [11, 12], 'Fundamental Rights are in which part of the Constitution?', ['Part I', 'Part III', 'Part IV', 'Part V'], 1, 'Part III lists the Fundamental Rights.'),
  f(/geography/i, [11, 12], 'The Earth’s crust is made mostly of which two elements?', ['Oxygen and silicon', 'Iron and nickel', 'Carbon and hydrogen', 'Gold and silver'], 0, 'Oxygen and silicon dominate the crust.'),
  f(ENG, [1, 5], 'Which word is a noun?', ['run', 'happy', 'table', 'quickly'], 2, 'A noun names a thing.'),
  f(ENG, [1, 8], 'Choose the correct plural of "child".', ['childs', 'children', 'childes', 'childrens'], 1, '"Children" is an irregular plural.'),
  f(ENG, [3, 8], 'Which is an adjective in "The tall boy ran fast"?', ['boy', 'ran', 'tall', 'fast'], 2, 'Tall describes the boy.'),
  f(ENG, [6, 10], 'Which sentence is in the past tense?', ['She sings well.', 'She sang well.', 'She will sing well.', 'She is singing.'], 1, '"Sang" is the simple past.'),
  f(ENG, [6, 10], '"As brave as a lion" is an example of a…', ['Metaphor', 'Simile', 'Idiom', 'Proverb'], 1, 'A simile compares using "as" or "like".'),
  f(ENG, [9, 12], 'Choose the correct word: "Neither of the answers ___ correct."', ['are', 'is', 'were', 'be'], 1, '"Neither" takes a singular verb.'),
  f(ECO, [11, 12], 'Opportunity cost is the…', ['Money price', 'Next best alternative given up', 'Total cost', 'Fixed cost'], 1, 'It is the value of the best alternative forgone.'),
  f(ECO, [11, 12], 'GDP stands for…', ['Gross Domestic Product', 'General Domestic Price', 'Gross Demand Price', 'Great Domestic Product'], 0, 'GDP measures the value of goods and services produced.'),
  f(/accountancy/i, [11, 12], 'The accounting equation is…', ['Assets = Liabilities + Capital', 'Assets = Capital − Liabilities', 'Capital = Assets + Liabilities', 'Liabilities = Assets + Capital'], 0, 'Assets are funded by liabilities and capital.'),
  f(/business/i, [11, 12], 'Which is a function of management?', ['Planning', 'Typing', 'Painting', 'Lifting'], 0, 'Planning, organising, staffing, directing and controlling.'),
  f(CS, [6, 12], 'Which of these is an input device?', ['Monitor', 'Keyboard', 'Printer', 'Speaker'], 1, 'A keyboard sends data to the computer.'),
  f(CS, [6, 12], 'Which language is used to structure web pages?', ['HTML', 'SQL', 'Python', 'C'], 0, 'HTML defines page structure.'),
  f(CS, [8, 12], 'In Python, which symbol starts a comment?', ['//', '#', '--', '/*'], 1, 'Python uses # for comments.'),
  f(/hindi/i, [1, 10], '"आम" शब्द का बहुवचन क्या है?', ['आमें', 'आम', 'आमों', 'आमे'], 1, 'कुछ शब्दों में बहुवचन में रूप नहीं बदलता।'),
  f(/hindi/i, [3, 10], '"सूरज" का पर्यायवाची शब्द कौन-सा है?', ['चंद्र', 'दिनकर', 'सागर', 'पवन'], 1, 'दिनकर का अर्थ सूर्य है।'),
];

export function factQuestions(subject: string, grade: number): RawQ[] {
  return FACTS.filter((x) => x.s.test(subject) && grade >= x.g[0] && grade <= x.g[1]).map((x) => mcq(x.q, x.o, x.a, x.e, grade >= 9 ? 2 : 1));
}

const STOP = new Set(['the', 'and', 'of', 'in', 'to', 'a', 'is', 'for', 'from', 'with', 'on', 'at', 'an', 'what', 'how']);

/** A reflection question for a chapter, marked by keywords drawn from its title. */
export function reflectionQuestion(chapter: string, subject: string, idBase: string): Pick<Question, 'prompt' | 'rubric' | 'answer' | 'explanation' | 'marks' | 'type'> {
  const words = chapter.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)).slice(0, 4);
  const rubric: RubricPoint[] = [
    { id: `${idBase}-r1`, criterion: 'Explains the central idea of the chapter', marks: 2, keywords: words.length ? words : [chapter.toLowerCase()] },
    { id: `${idBase}-r2`, criterion: 'Gives an example or evidence', marks: 2, keywords: ['example', 'for instance', 'such as', 'because'] },
  ];
  return {
    type: 'short',
    prompt: `In your own words, explain the main idea of "${chapter}" (${subject}) and give one example.`,
    answer: `A good answer states the central idea of "${chapter}" and supports it with a clear example from the chapter or daily life.`,
    explanation: 'Awarded by the rubric: central idea (2 marks) and an example or evidence (2 marks).',
    marks: 4,
    rubric,
  };
}
