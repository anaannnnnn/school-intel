// Reads the school database file (SQLite) in the browser, using sql.js (SQLite compiled to WebAssembly),
// and installs it in the store. The file is served as a static asset, so any host that can serve files
// can host the app: there is no server to run.
//
// Tables used: school_document (the whole school as one JSON document), accounts (logins), meta.
// The other tables and views in the file are for people and tools that want to query the data.

import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import type { SqlJsStatic } from 'sql.js';
import type { Db } from './db-types';
import { installDatabase, type AccountRow } from './store';

export const DATABASE_URL = './data/school.db';

/** WebAssembly is fastest. Some hosts and previews forbid it, so fall back to the plain-JavaScript build. */
async function sqlEngine(): Promise<SqlJsStatic> {
  try {
    const { default: init } = await import('sql.js/dist/sql-wasm-browser.js');
    return await init({ locateFile: () => wasmUrl });
  } catch {
    const { default: init } = await import('sql.js/dist/sql-asm.js');
    return await init();
  }
}

/** A page can point at another copy of the file: <meta name="school-database" content="data/school.db.txt">. */
function configuredUrl(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="school-database"]')?.content || DATABASE_URL;
}

/** Hosts that only serve text files can serve the database as base64 text (name it school.db.txt). */
async function readBytes(res: Response, url: string): Promise<Uint8Array> {
  if (!/\.txt$/i.test(url)) return new Uint8Array(await res.arrayBuffer());
  const bin = atob((await res.text()).replace(/\s+/g, ''));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function loadSchoolDatabase(url: string = configuredUrl()): Promise<void> {
  const [SQL, res] = await Promise.all([sqlEngine(), fetch(url, { cache: 'no-cache' })]);
  if (!res.ok) throw new Error(`The school database could not be loaded (${res.status}).`);
  const file = new SQL.Database(await readBytes(res, url));
  try {
    const doc = file.exec("select document from school_document where id = 'horizon'")[0]?.values[0]?.[0];
    if (typeof doc !== 'string') throw new Error('The school database has no school record.');
    const rows = file.exec('select login_id, role, person_id, name, grp, label, password_hash from accounts')[0]?.values ?? [];
    const accounts: AccountRow[] = rows.map(([loginId, role, personId, , grp, label, hash]) => ({
      loginId: String(loginId),
      kind: role === 'student' ? 'student' : role === 'parent' ? 'guardian' : 'staff',
      id: String(personId),
      label: String(label),
      group: String(grp ?? ''),
      passwordHash: String(hash),
    }));
    installDatabase(JSON.parse(doc) as Db, accounts);
  } finally {
    file.close();
  }
}
