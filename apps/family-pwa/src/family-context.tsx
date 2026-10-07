import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Actor, Student } from '@school-intel/contracts';
import { family } from '@school-intel/api';

interface FamilyCtx {
  actor: Actor;
  isParent: boolean;
  name: string;
  firstName: string;
  children: Student[];
  child: Student | undefined;
  setChildId: (id: string) => void;
}

const Ctx = createContext<FamilyCtx | null>(null);

const KEY = 'school-intel:family:child';

export function FamilyProvider({ actor, children: node }: { actor: Actor; children: ReactNode }) {
  const profile = family.familyProfile(actor);
  const [childId, setChildIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY) ?? '';
    } catch {
      return '';
    }
  });
  // Links are re-checked on every render: a revoked child disappears immediately.
  const child = profile.children.find((c) => c.id === childId) ?? profile.children[0];
  const setChildId = (id: string) => {
    setChildIdState(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  };
  return (
    <Ctx.Provider value={{ actor, isParent: actor.kind === 'guardian', name: profile.name, firstName: profile.firstName, children: profile.children, child, setChildId }}>
      {node}
    </Ctx.Provider>
  );
}

export function useFamily() {
  const v = useContext(Ctx);
  if (!v) throw new Error('FamilyProvider missing');
  return v;
}
