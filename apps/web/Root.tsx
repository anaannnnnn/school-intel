import { Suspense, lazy, useEffect, useRef } from 'react';
import { getDb, setSession, useSession } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { Gate } from './gate/Gate';
import { rememberedRole } from './gate/roles';

const FamilyApp = lazy(() => import('../family-pwa/src/entry'));
const StaffApp = lazy(() => import('../staff-web/src/entry'));

type Surface = 'family' | 'staff';

/** A saved session is only honoured if that person still exists in the school database. */
function valid(actor: Actor | null, surface: Surface): actor is Actor {
  if (!actor) return false;
  const d = getDb();
  if (surface === 'staff') return actor.kind === 'staff' && d.staff.some((s) => s.id === actor.id);
  if (actor.kind === 'student') return d.students.some((s) => s.id === actor.id);
  return actor.kind === 'guardian' && d.guardians.some((g) => g.id === actor.id);
}

export function Boot({ label = 'Opening your workspace' }: { label?: string }) {
  return (
    <div className="boot" role="status" aria-live="polite">
      <span className="boot-mark" aria-hidden><i /><i /><i /></span>
      <p>{label}…</p>
    </div>
  );
}

export function Root() {
  const family = useSession('family');
  const staff = useSession('staff');

  const familyOk = valid(family, 'family');
  const staffOk = valid(staff, 'staff');

  // Clear sessions that point at people who are no longer in the database.
  useEffect(() => {
    if (family && !familyOk) setSession('family', null);
    if (staff && !staffOk) setSession('staff', null);
  }, [family, staff, familyOk, staffOk]);

  const surface: Surface | null = familyOk && staffOk ? (rememberedRole() === 'teacher' ? 'staff' : 'family') : familyOk ? 'family' : staffOk ? 'staff' : null;

  // Signing out reloads the page. The two workspaces use different design kits, and a reload is the
  // simplest way to guarantee neither kit's styles linger when someone signs in as another role.
  const opened = useRef(false);
  useEffect(() => {
    if (surface) opened.current = true;
    else if (opened.current) {
      history.replaceState(null, '', location.pathname + location.search);
      location.reload();
    }
  }, [surface]);

  if (!surface) return opened.current ? <Boot label="Signing you out" /> : <Gate />;
  return <Suspense fallback={<Boot />}>{surface === 'family' ? <FamilyApp /> : <StaffApp />}</Suspense>;
}
