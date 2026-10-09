// Reads the school database file (SQLite) in the browser, using sql.js (SQLite compiled to WebAssembly),
// and installs it in the store. The file is served as a static asset, so any host that can serve files
// can host the app: there is no server to run.
//
// Tables used: school_document (the whole school as one JSON document), accounts (logins), meta.
// The other tables and views in the file are for people and tools that want to query the data.

import initSqlJs from 'sql.js/dist/sql-wasm-browser.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import type { Db } from './db-types';
import { installDatabase, type AccountRow } from './store';

export const DATABASE_URL = './data/school.db';

export async function loadSchoolDatabase(url: string = DATABASE_URL): Promise<void> {
  const [SQL, res] = await Promise.all([initSqlJs({ locateFile: () => wasmUrl }), fetch(url, { cache: 'no-cache' })]);
  if (!res.ok) throw new Error(`The school database could not be loaded (${res.status}).`);
  const file = new SQL.Database(new Uint8Array(await res.arrayBuffer()));
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
