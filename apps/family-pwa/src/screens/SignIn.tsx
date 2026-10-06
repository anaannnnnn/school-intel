import { useState } from 'react';
import { ArrowRight, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { Button, Callout, Card, TextField, errorText } from '@school-intel/ui';
import { family, SCHOOL, setSession } from '@school-intel/api';

type Step = 'choose' | 'guardian' | 'student';

export function SignIn() {
  const [step, setStep] = useState<Step>('choose');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const verify = () => {
    setBusy(true);
    setTimeout(() => {
      try {
        setSession('family', family.verifyGuardianInvitation(code));
      } catch (e) {
        setError(errorText(e));
        setBusy(false);
      }
    }, 450);
  };

  const studentSso = () => {
    setBusy(true);
    setTimeout(() => setSession('family', { kind: 'student', id: 'stu-sara' }), 450);
  };

  return (
    <div className="signin">
      <div className="signin-hero">
        <div className="wordmark" style={{ color: '#fff' }}>
          <span className="wordmark-mark" style={{ background: 'rgba(255,255,255,.12)' }}>DEVX</span>
          <span className="wordmark-text">
            <span style={{ color: '#fff' }}>School Intelligence</span>
            <small style={{ color: '#9fc0b5' }}>{SCHOOL.name}</small>
          </span>
        </div>
        <h1>A calmer school day. A clearer next step.</h1>
        <p>Today’s plan, learning updates and school requests in one place.</p>
      </div>

      <main className="signin-body enter" key={step}>
        {step === 'choose' && (
          <>
            <p className="eyebrow">Sign in</p>
            <button type="button" className="card role-card" onClick={() => setStep('guardian')}>
              <span className="card-icon" aria-hidden><Users size={18} /></span>
              <span className="grow">
                <strong style={{ display: 'block' }}>I’m a parent or guardian</strong>
                <span className="small muted">Use your verified guardian invitation</span>
              </span>
              <ArrowRight size={18} className="flip-rtl" aria-hidden />
            </button>
            <button type="button" className="card role-card" onClick={() => setStep('student')}>
              <span className="card-icon" aria-hidden><GraduationCap size={18} /></span>
              <span className="grow">
                <strong style={{ display: 'block' }}>I’m a student</strong>
                <span className="small muted">Continue with your school account</span>
              </span>
              <ArrowRight size={18} className="flip-rtl" aria-hidden />
            </button>
            <p className="small muted" style={{ textAlign: 'center', marginBlockStart: 8 }}>
              Demonstration with fictional school data. Staff use the <a href="../staff-web/index.html">staff workspace</a>.
            </p>
          </>
        )}

        {step === 'guardian' && (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              verify();
            }}
          >
            <div className="stack-sm">
              <p className="eyebrow">Identity verification</p>
              <h2 style={{ fontSize: 'var(--text-2xl)' }}>Verify your guardian invitation</h2>
            </div>
            <Card>
              <dl className="kv">
                <dt>Invitation for</dt>
                <dd>Fatima Ahmed</dd>
                <dt>Linked children</dt>
                <dd>Sara Ahmed and Adam Ahmed</dd>
              </dl>
            </Card>
            <TextField
              label="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="input otp"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              error={error}
              hint="Enter the six-digit code sent to your registered contact. It expires in 10 minutes."
            />
            <Callout tone="neutral" icon={ShieldCheck}>
              Demo code: <strong>{family.GUARDIAN_INVITE_CODE}</strong>
            </Callout>
            <Button type="submit" block busy={busy} disabled={code.length !== 6}>
              Verify code
            </Button>
            <Button variant="ghost" onClick={() => setStep('choose')}>Back</Button>
          </form>
        )}

        {step === 'student' && (
          <div className="stack">
            <div className="stack-sm">
              <p className="eyebrow">School sign-in</p>
              <h2 style={{ fontSize: 'var(--text-2xl)' }}>Welcome back</h2>
            </div>
            <TextField label="School email" value="sara.ahmed@students.horizon.example" readOnly />
            <Callout tone="info">You will continue with {SCHOOL.name} single sign-on. This demo signs you in as Sara Ahmed, Year 7A.</Callout>
            <Button block busy={busy} onClick={studentSso}>Continue with school SSO</Button>
            <Button variant="ghost" onClick={() => setStep('choose')}>Back</Button>
          </div>
        )}
      </main>
    </div>
  );
}
