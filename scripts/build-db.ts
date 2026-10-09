// Builds the school database file the apps read at start-up: apps/public/data/school.db (SQLite).
//
//   npm run db:build
//
// The file holds the whole school as one JSON document (school_document), the logins (accounts, with
// scrypt-hashed passcodes), the syllabus catalogue (courses), and read-only views for browsing the data
// with any SQLite tool. The build is deterministic: the same inputs give the same file.
//
// Initial passcode for every seeded login: SCHOOL_INITIAL_PASSCODE, or the default below. These are
// sample accounts; give people their own passcodes before using real records.

import { createHash } from 'node:crypto';
import { mkdirSync, renameSync, rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPasscode } from '../services/api/src/passcode';
import { createSeedWithAccounts } from '../services/api/src/seed';
import { catalogue, PROGRAMME_LABEL } from '../services/api/src/seed-curriculum';
import { DEMO_DATE, SCHOOL } from '../services/api/src/constants';

export const DEFAULT_PASSCODE = 'Horizon-2026';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'apps/public/data/school.db');

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

export function buildDatabase(file: string, passcode = process.env.SCHOOL_INITIAL_PASSCODE || DEFAULT_PASSCODE) {
  const { doc, accounts } = createSeedWithAccounts();
  doc.dataVersion = sha(JSON.stringify(doc)).slice(0, 16);

  rmSync(file, { force: true });
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = DELETE; PRAGMA page_size = 4096;');
  db.exec(`
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE school_document (id TEXT PRIMARY KEY, document TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE accounts (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('student','parent','teacher','admin')),
      person_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      login_id TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      grp TEXT,
      label TEXT NOT NULL
    );
    CREATE TABLE courses (
      id TEXT PRIMARY KEY,
      programme TEXT NOT NULL,
      board TEXT NOT NULL,
      grade INTEGER NOT NULL,
      subject TEXT NOT NULL,
      code TEXT,
      source_url TEXT NOT NULL,
      topics TEXT NOT NULL
    );
  `);

  const put = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)');
  for (const [k, v] of [
    ['schema_version', '1'],
    ['data_version', doc.dataVersion],
    ['school_id', SCHOOL.id],
    ['school_name', SCHOOL.name],
    ['school_date', DEMO_DATE],
  ]) put.run(k, v!);

  db.prepare('INSERT INTO school_document (id, document, updated_at) VALUES (?, ?, ?)').run(SCHOOL.id, JSON.stringify(doc), `${DEMO_DATE} 10:45:00`);

  const staffRole = new Map(doc.staff.map((s) => [s.id, s.roles.includes('teacher') ? 'teacher' : 'admin']));
  const email = (a: (typeof accounts)[number]) => {
    if (a.kind === 'staff') return doc.staff.find((s) => s.id === a.id)?.email ?? null;
    if (a.kind === 'guardian') return doc.guardians.find((g) => g.id === a.id)?.email ?? null;
    const n = doc.students.find((s) => s.id === a.id)?.name;
    return n ? `${n.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, '.')}@student.horizon.example` : null;
  };
  const acc = db.prepare('INSERT INTO accounts (id, role, person_id, name, email, login_id, password_hash, grp, label) VALUES (?,?,?,?,?,?,?,?,?)');
  db.exec('BEGIN');
  for (const a of accounts) {
    const role = a.kind === 'student' ? 'student' : a.kind === 'guardian' ? 'parent' : staffRole.get(a.id)!;
    const salt = sha(`school-intel:${a.loginId}`).slice(0, 32);
    acc.run(`acc-${a.loginId}`, role, a.id, a.label.split(' · ')[0].split(', parent of')[0], email(a), a.loginId, hashPasscode(passcode, salt), a.group, a.label);
  }
  const course = db.prepare('INSERT INTO courses (id, programme, board, grade, subject, code, source_url, topics) VALUES (?,?,?,?,?,?,?,?)');
  for (const c of catalogue) course.run(`${c.p}-${c.g}-${c.s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, c.p, PROGRAMME_LABEL[c.p], c.g, c.s, c.code, c.src, JSON.stringify(c.t));
  db.exec('COMMIT');

  // Read-only views over the JSON document, for browsing with any SQLite tool.
  const view = (name: string, path: string, cols: string[]) =>
    db.exec(`CREATE VIEW ${name} AS SELECT ${cols.map((c) => `json_extract(j.value, '$.${c}') AS "${c}"`).join(', ')} FROM school_document d, json_each(d.document, '$.${path}') j`);
  view('classes', 'classes', ['id', 'label', 'yearGroup', 'tutorId']);
  view('students', 'students', ['id', 'sisId', 'name', 'classId', 'yearGroup']);
  view('staff', 'staff', ['id', 'name', 'title', 'email']);
  view('guardians', 'guardians', ['id', 'name', 'email', 'phone']);
  view('subjects', 'subjects', ['id', 'name', 'classId', 'teacherId']);
  view('topics', 'topics', ['id', 'subjectId', 'name', 'order']);
  view('materials', 'materials', ['id', 'subjectId', 'topicId', 'title', 'kind', 'minutes', 'status', 'aiGenerated', 'body']);
  view('questions', 'questions', ['id', 'subjectId', 'topicId', 'type', 'prompt', 'marks', 'difficulty']);

  db.exec('VACUUM');
  db.close();
  return { dataVersion: doc.dataVersion, accounts: accounts.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const tmp = `${out}.tmp`;
  const r = buildDatabase(tmp);
  renameSync(tmp, out);
  console.log(`Wrote ${out} (data version ${r.dataVersion}, ${r.accounts} logins)`);
}
