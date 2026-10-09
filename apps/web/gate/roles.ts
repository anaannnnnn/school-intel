import { auth } from '@school-intel/api';

export type Role = auth.Role;

export interface RoleInfo {
  id: Role;
  title: string;
  /** Short line on the welcome card. */
  blurb: string;
  /** Heading on the sign-in side panel. */
  promise: string;
  points: string[];
  surface: 'family' | 'staff';
  idHint: string;
}

export const ROLES: RoleInfo[] = [
  {
    id: 'student',
    title: 'Student',
    blurb: 'Your timetable, notes, quizzes, tests and a study helper that gives hints.',
    promise: 'Pick up right where you left off.',
    points: ['Today’s lessons and what is due', 'Notes, revision cards and past papers', 'Quizzes and timed tests with instant feedback'],
    surface: 'family',
    idHint: 'For example stu.sara or stu.cbse9.01',
  },
  {
    id: 'parent',
    title: 'Parent or guardian',
    blurb: 'See how your child is doing, and send the school a request in a few taps.',
    promise: 'Stay close to your child’s school day.',
    points: ['Attendance, grades and merits at a glance', 'Requests, permissions and confidential help', 'Calm updates, no noise'],
    surface: 'family',
    idHint: 'For example par.fatima or par.cbse9.01',
  },
  {
    id: 'teacher',
    title: 'Teacher or staff',
    blurb: 'Registers, materials, marking and student support, in one workspace.',
    promise: 'Your classes, marking and records, ready.',
    points: ['Lessons and registers with family alerts', 'AI suggests marks, you confirm every one', 'Role-based access with a full audit log'],
    surface: 'staff',
    idHint: 'For example tch.nadia or tch.cbse.physics.upper',
  },
];

export const roleInfo = (r: Role) => ROLES.find((x) => x.id === r)!;

const KEY = 'school-intel:role';

export function rememberedRole(): Role | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'student' || v === 'parent' || v === 'teacher' ? v : null;
  } catch {
    return null;
  }
}

export function rememberRole(r: Role | null) {
  try {
    if (r) localStorage.setItem(KEY, r);
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: the gate simply asks again next time */
  }
}
