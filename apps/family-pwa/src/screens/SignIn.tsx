import { useState } from 'react';
import { ArrowRight, BookOpen, Check, ClipboardCheck, GraduationCap, MessageCircleQuestion, ShieldCheck, Users } from 'lucide-react';
import { Avatar, Button, Callout, Card, TextField, errorText } from '@school-intel/ui';
import { family, SCHOOL, setSession } from '@school-intel/api';
import '../student-c2.css';

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
        <div className="wordmark">
          <span className="wordmark-mark">DEVX</span>
          <span className="wordmark-text">
            <span>School Intelligence</span>
            <small>{SCHOOL.name}</small>
          </span>
        </div>
        <h1>A calmer school day. A clearer next step.</h1>
        <p>Today’s plan, learning updates and school requests in one place.</p>
        <ul className="hero-features" aria-label="What you can do">
          <li><span aria-hidden><BookOpen size={14} /></span>Lessons &amp; homework</li>
          <li><span aria-hidden><ClipboardCheck size={14} /></span>Tests &amp; results</li>
          <li><span aria-hidden><MessageCircleQuestion size={14} /></span>Ask for help</li>
        </ul>
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
            <div className="stack-sm" role="group" aria-label="Choose your account">
              <p className="field-label">Choose your account</p>
              <button type="button" className="account-pick" aria-pressed="true">
                <Avatar initials="SA" />
                <span className="grow">
                  <strong>Sara Ahmed · Year 7</strong>
                  <small>sara.ahmed@students.horizon.example</small>
                </span>
                <span className="tick" aria-hidden><Check size={14} /></span>
              </button>
            </div>
            <Callout tone="info">You will continue with {SCHOOL.name} single sign-on. This demo signs you in as Sara Ahmed, Year 7A.</Callout>
            <Button block busy={busy} onClick={studentSso}>Continue with school SSO</Button>
            <Button variant="ghost" onClick={() => setStep('choose')}>Back</Button>
          </div>
        )}
      </main>
    </div>
  );
}
