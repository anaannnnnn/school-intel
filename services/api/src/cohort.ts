// Classes are split into sections (7A, 7B, ...). Subjects, materials and quizzes belong to a cohort (G7) that
// every section of the class shares; the timetable, registers and homework belong to a section.

import type { Db } from './db-types';
import { getDb } from './store';

const cache = new WeakMap<Db, Map<string, string>>();

function map(d: Db): Map<string, string> {
  let m = cache.get(d);
  if (!m) {
    m = new Map(d.classes.map((c) => [c.id, c.cohort ?? c.id]));
    cache.set(d, m);
  }
  return m;
}

/** The cohort a section belongs to. A class without a cohort is its own cohort. */
export const cohortOf = (classId: string, d: Db = getDb()): string => map(d).get(classId) ?? classId;

/** True when something scoped to `scopeId` (a section or a cohort) applies to a student in `studentClassId`. */
export const inClass = (scopeId: string, studentClassId: string, d: Db = getDb()): boolean => scopeId === studentClassId || scopeId === cohortOf(studentClassId, d);

/** Every section id in a cohort (or the id itself for an unsplit class). */
export const sectionsOf = (scopeId: string, d: Db = getDb()): string[] => {
  const list = d.classes.filter((c) => (c.cohort ?? c.id) === scopeId || c.id === scopeId).map((c) => c.id);
  return list.length ? list : [scopeId];
};
