import { useState } from 'react';
import { CheckCircle, KeyRound, ShieldCheck } from 'lucide-react';
import { Avatar, Button, Callout, TextField } from '@school-intel/ui';
import { SCHOOL, setSession, staff } from '@school-intel/api';

const ROLE_HINT: Record<string, string> = {
  'st-nadia': 'Maths: lessons, registers, question bank and Copilot',
  'st-priya': 'Science: tests and AI-assisted marking',
  'st-james': 'English: written work and feedback',
  'st-huda': 'Arabic: materials and quizzes',
  'st-aisha': 'Support cases and safeguarding',
  'st-daniel': 'Teaching, pastoral and clubs',
  'st-layla': 'Family requests and attendance',
  'st-karim': 'Connectors, mapping and audit',
  'st-samira': 'Aggregate measures and audit',
};

const POINTS = [
  'Registers, materials and quizzes for the lessons you teach',
  'AI suggests marks with evidence; you confirm every one before release',
  'Student questions get hints first, then reach the subject teacher',
  'Role-based access, MFA and a full audit log',
];

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
        <div className="side-brand">
          <span className="side-logo" aria-hidden>DX</span>
          <span>
            <strong>DEVX</strong>
            <small>School Intelligence</small>
          </span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1>Your school day, connected and accountable.</h1>
          <p>Lessons, marking, student support and family requests in one staff workspace. Source systems stay authoritative.</p>
        </div>
        <div className="signin-points">
          {POINTS.map((t) => (
            <div key={t}><CheckCircle size={16} aria-hidden />{t}</div>
          ))}
        </div>
        <p className="small" style={{ position: 'relative', zIndex: 1, opacity: 0.75 }}>Fictional pilot school · Demonstration data only</p>
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
              <a className="btn btn-secondary" href="../family-pwa/index.html">Open the family app instead</a>
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
              <Button variant="secondary" onClick={() => setStep('pick')}>Back</Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
