import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, LifeBuoy, ShieldCheck } from 'lucide-react';
import { auth, getDb, setSession } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { RoleArt } from './art';
import { ROLES, rememberRole, rememberedRole, roleInfo, type Role } from './roles';
import './gate.css';

type Route = { name: 'welcome' } | { name: 'signin'; role: Role };

/** `#/signin/student` opens a sign-in; `#/welcome` always shows the role choice; `#/` returns visitors to their remembered role. */
function parseHash(): Route {
  const m = /^#\/signin\/(student|parent|teacher)$/.exec(location.hash);
  if (m) return { name: 'signin', role: m[1] as Role };
  if (location.hash === '#/welcome') return { name: 'welcome' };
  const r = rememberedRole();
  return r ? { name: 'signin', role: r } : { name: 'welcome' };
}

const go = (hash: string) => {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
};

export function Gate() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [welcomed, setWelcomed] = useState<{ name: string; surface: 'family' | 'staff'; actor: Actor } | null>(null);

  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    document.title = route.name === 'signin' ? `${roleInfo(route.role).title} sign-in · Horizon Learning` : 'Welcome · Horizon Learning';
  }, [route]);

  const finish = useCallback((role: Role, actor: Actor) => {
    rememberRole(role);
    const d = getDb();
    const name = actor.kind === 'staff' ? d.staff.find((s) => s.id === actor.id)?.name : actor.kind === 'guardian' ? d.guardians.find((g) => g.id === actor.id)?.name : d.students.find((s) => s.id === actor.id)?.name;
    setWelcomed({ name: name ?? '', surface: roleInfo(role).surface, actor });
  }, []);

  // A short "welcome" moment, then hand over to the workspace.
  useEffect(() => {
    if (!welcomed) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setTimeout(() => {
      history.replaceState(null, '', location.pathname + location.search);
      setSession(welcomed.surface, welcomed.actor);
    }, reduce ? 250 : 1100);
    return () => window.clearTimeout(id);
  }, [welcomed]);

  return (
    <div className="gt" data-step={route.name} data-role={route.name === 'signin' ? route.role : undefined}>
      <Backdrop />
      <header className="gt-top">
        <a className="gt-brand" href="#/welcome" onClick={(e) => { e.preventDefault(); go('#/welcome'); }} aria-label="Horizon Learning School, start page">
          <span className="gt-mark" aria-hidden><i /><i /><i /></span>
          <span className="gt-brand-text"><strong>Horizon Learning</strong><small>School Intelligence</small></span>
        </a>
      </header>

      <main className="gt-main" id="main">
        {welcomed ? (
          <Welcomed name={welcomed.name} />
        ) : route.name === 'welcome' ? (
          <Welcome onPick={(r) => go(`#/signin/${r}`)} />
        ) : (
          <SignIn key={route.role} role={route.role} onDone={(a) => finish(route.role, a)} />
        )}
      </main>

      <footer className="gt-foot">
        <span>Horizon Learning School · Dubai</span>
        <span className="gt-dot" aria-hidden />
        <span>Study aids written by AI are always labelled</span>
        <span className="gt-dot" aria-hidden />
        <a href="#/welcome" onClick={(e) => { e.preventDefault(); go('#/welcome'); }}>Choose a different role</a>
      </footer>
    </div>
  );
}

function Backdrop() {
  return (
    <div className="gt-backdrop" aria-hidden>
      <span className="gt-blob gt-blob-a" />
      <span className="gt-blob gt-blob-b" />
      <span className="gt-blob gt-blob-c" />
      <svg className="gt-squiggle" viewBox="0 0 220 40" fill="none"><path d="M3 20c14-22 28 22 42 0s28 22 42 0 28 22 42 0 28 22 42 0 28 22 42 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
    </div>
  );
}

// ---------- Step 1: who are you? ----------

function Welcome({ onPick }: { onPick: (r: Role) => void }) {
  return (
    <section className="gt-welcome" aria-labelledby="gt-h">
      <div className="gt-hero">
        <p className="gt-kicker">Welcome</p>
        <h1 id="gt-h">
          Your school day,
          <br />
          <em>all in one place.</em>
        </h1>
        <p className="gt-lede">Tell us who you are and we will open the right door. It takes ten seconds, and we will remember it next time.</p>
      </div>
      <ul className="gt-roles" role="list" aria-label="Choose your role">
        {ROLES.map((r, i) => (
          <li key={r.id} style={{ ['--i' as string]: i }}>
            <button type="button" className="gt-role" data-role={r.id} onClick={() => onPick(r.id)}>
              <span className="gt-role-art"><RoleArt role={r.id} /></span>
              <span className="gt-role-body">
                <span className="gt-role-eyebrow">I am a</span>
                <strong>{r.title}</strong>
                <span className="gt-role-blurb">{r.blurb}</span>
              </span>
              <span className="gt-role-go" aria-hidden><ArrowRight size={18} /></span>
            </button>
          </li>
        ))}
      </ul>
      <p className="gt-trust"><ShieldCheck size={15} aria-hidden /> Each role only sees what it is allowed to see. Every sign-in is recorded.</p>
    </section>
  );
}

// ---------- Step 2: sign in ----------

const lastIdKey = (r: Role) => `school-intel:last-id:${r}`;
const readLast = (r: Role) => {
  try {
    return localStorage.getItem(lastIdKey(r)) ?? '';
  } catch {
    return '';
  }
};

function SignIn({ role, onDone }: { role: Role; onDone: (a: Actor) => void }) {
  const info = roleInfo(role);
  const [mode, setMode] = useState<'id' | 'invite'>('id');
  const [loginId, setLoginId] = useState(() => readLast(role));
  const [pass, setPass] = useState('');
  const [invite, setInvite] = useState('');
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState('');
  const [other, setOther] = useState<Role | null>(null);
  const [busy, setBusy] = useState(false);
  const passRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const returning = !!readLast(role);

  useEffect(() => {
    (returning && mode === 'id' ? passRef : idRef).current?.focus();
  }, [returning, mode]);

  const fail = (e: unknown) => {
    setBusy(false);
    setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    setOther(e instanceof auth.SignInError ? e.otherRole ?? null : null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setOther(null);
    setBusy(true);
    const run = async () => {
      try {
        if (mode === 'invite') {
          onDone(auth.verifyGuardianInvitation(invite));
        } else {
          const actor = await auth.signIn(loginId, pass, role);
          try {
            localStorage.setItem(lastIdKey(role), loginId.trim().toLowerCase());
          } catch {
            /* optional convenience */
          }
          onDone(actor);
        }
      } catch (err) {
        fail(err);
      }
    };
    void run();
  };

  // Only this device's remembered ID is greeted by name, so the form never reveals who owns other IDs.
  const who = returning && loginId.trim().toLowerCase() === readLast(role) ? auth.describeAccount(loginId) : undefined;

  return (
    <section className="gt-signin" aria-labelledby="gt-s">
      <aside className="gt-panel" data-role={role}>
        <button type="button" className="gt-back gt-back-light" onClick={() => go('#/welcome')}>
          <ArrowLeft size={16} aria-hidden /> Change role
        </button>
        <div className="gt-panel-art"><RoleArt role={role} size={190} /></div>
        <h2>{info.promise}</h2>
        <ul>
          {info.points.map((p) => (
            <li key={p}><Check size={15} aria-hidden /> {p}</li>
          ))}
        </ul>
      </aside>

      <div className="gt-card">
        <form onSubmit={submit} noValidate aria-describedby={error ? 'gt-err' : undefined}>
          <button type="button" className="gt-back gt-back-mobile" onClick={() => go('#/welcome')}>
            <ArrowLeft size={16} aria-hidden /> Change role
          </button>
          <p className="gt-kicker">{who ? 'Welcome back' : 'Sign in'}</p>
          <h2 id="gt-s">{info.title} sign-in</h2>
          <p className="gt-sub">
            {who ? <>Signing in as <strong>{who.name}</strong>. Not you? Clear the ID below.</> : <>Use the login ID the school gave you.</>}
          </p>

          {role === 'parent' && (
            <div className="gt-tabs" role="tablist" aria-label="How do you want to sign in?">
              <button type="button" role="tab" aria-selected={mode === 'id'} onClick={() => { setMode('id'); setError(''); }}>Login ID</button>
              <button type="button" role="tab" aria-selected={mode === 'invite'} onClick={() => { setMode('invite'); setError(''); }}>First time? Invitation code</button>
            </div>
          )}

          {mode === 'id' ? (
            <>
              <div className="gt-field">
                <label htmlFor="gt-id">Login ID</label>
                <input
                  id="gt-id"
                  ref={idRef}
                  value={loginId}
                  onChange={(e) => { setLoginId(e.target.value); setError(''); setOther(null); }}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Your login ID"
                  aria-invalid={!!error || undefined}
                />
              </div>
              <div className="gt-field">
                <label htmlFor="gt-pass">Passcode</label>
                <span className="gt-pass">
                  <input
                    id="gt-pass"
                    ref={passRef}
                    type={show ? 'text' : 'password'}
                    value={pass}
                    onChange={(e) => { setPass(e.target.value); setError(''); }}
                    onKeyUp={(e) => setCaps(e.getModifierState('CapsLock'))}
                    onBlur={() => setCaps(false)}
                    autoComplete="current-password"
                    aria-invalid={!!error || undefined}
                  />
                  <button type="button" className="gt-eye" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide passcode' : 'Show passcode'} aria-pressed={show}>
                    {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                  </button>
                </span>
                {caps && <small className="gt-warn">Caps Lock is on</small>}
              </div>
            </>
          ) : (
            <div className="gt-field">
              <label htmlFor="gt-code">Six-digit invitation code</label>
              <input
                id="gt-code"
                ref={idRef}
                value={invite}
                onChange={(e) => { setInvite(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="gt-otp-line"
                placeholder="000000"
                aria-invalid={!!error || undefined}
              />
              <small>Sent to your registered contact. It expires after 10 minutes.</small>
            </div>
          )}

          <div id="gt-err" role="alert" aria-live="assertive">
            {error && (
              <p className="gt-error">
                <AlertCircle size={16} aria-hidden /> <span>{error}</span>
                {other && (
                  <button type="button" onClick={() => go(`#/signin/${other}`)}>
                    Go to {roleInfo(other).title.toLowerCase()} sign-in
                  </button>
                )}
              </p>
            )}
          </div>

          <button type="submit" className="gt-primary" disabled={busy || (mode === 'id' ? !loginId.trim() || !pass : invite.length !== 6)} data-busy={busy || undefined}>
            {busy ? <span className="gt-spin" aria-hidden /> : <KeyRound size={17} aria-hidden />}
            {busy ? 'Checking…' : 'Sign in'}
          </button>

          <p className="gt-help"><LifeBuoy size={14} aria-hidden /> Forgot your ID or passcode? Ask the school office.</p>
        </form>
      </div>
    </section>
  );
}

// ---------- Success moment ----------

function Welcomed({ name }: { name: string }) {
  return (
    <section className="gt-welcomed" role="status" aria-live="polite">
      <span className="gt-check" aria-hidden><Check size={34} strokeWidth={3} /></span>
      <h2>{name ? `Welcome, ${name.split(' ')[0]}` : 'Welcome'}</h2>
      <p>Opening your workspace…</p>
    </section>
  );
}
