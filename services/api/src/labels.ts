import { getDb } from './store';

/** The name of a class as people read it: "Year 7A", "Class 9 · CBSE". */
export function className(classId: string): string {
  return getDb().classes.find((c) => c.id === classId)?.label ?? `Year ${classId}`;
}
