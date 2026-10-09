// The committed school database (apps/public/data/school.db) must match the seed it is built from, and
// its logins must accept the documented initial passcode. Regenerate with `npm run db:build`.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { verifyPasscode } from './passcode';
import { createSeed } from './seed';

const FILE = new URL('../../../apps/public/data/school.db', import.meta.url).pathname;
const INITIAL_PASSCODE = 'Horizon-2026';

describe('school.db', () => {
  it('is committed to the repository', () => {
    expect(existsSync(FILE)).toBe(true);
  });

  it('is up to date with the seed (run `npm run db:build` after changing seed data)', () => {
    const db = new DatabaseSync(FILE, { readOnly: true });
    const seed = createSeed();
    const version = createHash('sha256').update(JSON.stringify(seed)).digest('hex').slice(0, 16);
    const row = db.prepare("SELECT value FROM meta WHERE key = 'data_version'").get() as { value: string };
    const doc = JSON.parse((db.prepare("SELECT document FROM school_document WHERE id = 'horizon'").get() as { document: string }).document);
    db.close();
    expect(row.value).toBe(version);
    expect(doc.dataVersion).toBe(version);
    expect(doc.students.length).toBe(seed.students.length);
  });

  it('stores hashed passcodes that accept the initial passcode and nothing else', async () => {
    const db = new DatabaseSync(FILE, { readOnly: true });
    const row = db.prepare("SELECT password_hash FROM accounts WHERE login_id = 'tch.nadia'").get() as { password_hash: string };
    const all = db.prepare('SELECT password_hash FROM accounts').all() as { password_hash: string }[];
    db.close();
    expect(row.password_hash.startsWith('scrypt$')).toBe(true);
    expect(JSON.stringify(all)).not.toContain(INITIAL_PASSCODE);
    expect(await verifyPasscode(INITIAL_PASSCODE, row.password_hash)).toBe(true);
    expect(await verifyPasscode('wrong-passcode', row.password_hash)).toBe(false);
  });
});
