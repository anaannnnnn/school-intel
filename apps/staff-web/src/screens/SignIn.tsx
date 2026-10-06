import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Avatar, Button, Callout, TextField } from '@school-intel/ui';
import { SCHOOL, setSession, staff } from '@school-intel/api';

const ROLE_HINT: Record<string, string> = {
  'st-nadia': 'Teacher Copilot, homework, passport',
  'st-aisha': 'Support cases and safeguarding',
  'st-daniel': 'Teaching, pastoral and clubs',
  'st-layla': 'Family requests and attendance',
  'st-karim': 'Connectors, mapping and audit',
  'st-samira': 'Aggregate measures and audit',
};

export function SignIn() {
  const people = staff.staffDirectory();
  const [who, setWho] = useState('st-nadia');
  const [step, setStep] = useState<'pick' | 'mfa'>('pick');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const person = people.find((p) => p.id === who)!;

  return (
    <div className="signin-wrap">
      <aside className="signin-side">
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, color: '#fff' }}>DEVX</div>
          <div className="small">School Intelligence</div>
        </div>
        <div>
          <h1>Your school day, connected and accountable.</h1>
          <p>Teacher-approved drafts, assigned support cases, family requests and data health in one staff workspace. Source systems stay authoritative.</p>
        </div>
        <p className="small" style={{ color: '#8fb3a8' }}>Fictional pilot school · Demonstration data only</p>
      </aside>

      <main className="signin-main enter" key={step}>
        {step === 'pick' ? (
          <>
            <div className="stack-sm">
              <p className="eyebrow">School sign-in · {SCHOOL.name}</p>
              <h2 style={{ fontSize: 'var(--text-3xl)' }}>Welcome back</h2>
              <p className="muted">Choose a demo staff member. Each role sees only what it is authorised to see.</p>
            </div>
            <div className="persona-grid" role="radiogroup" aria-label="Staff member">
              {people.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={who === p.id} aria-pressed={who === p.id} className="card persona" onClick={() => setWho(p.id)}>
                  <Avatar initials={p.initials} />
                  <span className="grow" style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block' }}>{p.name}</strong>
                    <span className="small muted" style={{ display: 'block' }}>{ROLE_HINT[p.id]}</span>
                  </span>
                </button>
              ))}
            </div>
            <TextField label="School email" value={person.email} readOnly />
            <div className="row wrap">
              <Button icon={KeyRound} onClick={() => setStep('mfa')}>Continue with school SSO</Button>
              <a className="btn btn-ghost" href="../family-pwa/">Open the family app instead</a>
            </div>
          </>
        ) : (
          <form
            className="stack"
            style={{ maxWidth: 420 }}
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              setTimeout(() => setSession('staff', { kind: 'staff', id: who }), 400);
            }}
          >
            <div className="stack-sm">
              <p className="eyebrow">Multi-factor authentication</p>
              <h2 style={{ fontSize: 'var(--text-2xl)' }}>Confirm it’s you, {person.name.split(' ')[0]}</h2>
              <p className="muted">Staff access requires MFA. Enter the code from your authenticator app.</p>
            </div>
            <TextField label="Authentication code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} hint="Demo: any six digits" autoFocus />
            <Callout tone="neutral" icon={ShieldCheck}>Sessions expire after 8 hours of inactivity. Access is recorded in the audit log.</Callout>
            <div className="row">
              <Button type="submit" busy={busy} disabled={code.length !== 6}>Verify and continue</Button>
              <Button variant="ghost" onClick={() => setStep('pick')}>Back</Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
