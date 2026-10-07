import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BellRing, CheckCheck, CircleCheck, PenLine, Send, TriangleAlert } from 'lucide-react';
import { Avatar, Button, Callout, Card, Chip, errorText, formatTime, formatWeekday, useToast } from '@school-intel/ui';
import { teach, useDb } from '@school-intel/api';
import type { Actor, Presence } from '@school-intel/contracts';
import { PageFoot, PageHead, Restricted, SubjectDot } from '../ui';
import '../teaching-a.css';

const OPTIONS: { value: Presence; label: string; color: string }[] = [
  { value: 'present', label: 'Present', color: 'var(--color-success)' },
  { value: 'late', label: 'Late', color: 'var(--color-warning-solid)' },
  { value: 'absent', label: 'Absent', color: 'var(--color-danger)' },
  { value: 'excused', label: 'Excused', color: 'var(--color-accent-2)' },
];

const WARN_RATE = 92;

export function RegisterScreen({ actor }: { actor: Actor }) {
  const { id = '' } = useParams();
  useDb();
  let r: ReturnType<typeof teach.lessonRegister>;
  try {
    r = teach.lessonRegister(actor, id);
  } catch (e) {
    return <Restricted message={errorText(e)} />;
  }
  return <RegisterView key={r.register.id} actor={actor} data={r} />;
}

function RegisterView({ actor, data }: { actor: Actor; data: ReturnType<typeof teach.lessonRegister> }) {
  const toast = useToast();
  const { register, period, subject, students, takenBy } = data;
  const submitted = register.status === 'submitted';
  const [amending, setAmending] = useState(false);
  const locked = submitted && !amending;

  const counts = OPTIONS.map((o) => ({ ...o, n: students.filter((s) => s.mark === o.value).length }));
  const absent = counts.find((c) => c.value === 'absent')!.n;
  const allPresent = students.every((s) => s.mark === 'present');

  const set = (studentId: string, mark: Presence) => {
    try {
      teach.setPresence(actor, register.id, studentId, mark);
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const markAll = () => {
    try {
      students.filter((s) => s.mark !== 'present').forEach((s) => teach.setPresence(actor, register.id, s.student.id, 'present'));
      toast('Everyone marked present');
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const submit = () => {
    try {
      const res = teach.submitRegister(actor, register.id);
      setAmending(false);
      toast(`Register ${submitted ? 'updated' : 'submitted'} · ${res.absent} absent${res.absent ? ' (families notified)' : ''}`);
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  return (
    <>
      <PageHead
        title={
          <span className="row" style={{ gap: 12 }}>
            <SubjectDot hue={subject.hue} />
            {subject.name} register
          </span>
        }
        sub={`Year ${period.classId} · ${formatWeekday(register.date)} · ${period.start}–${period.end} · Room ${period.room}`}
        spec="Teaching · lesson register"
        actions={
          <Link to="/lessons" className="btn btn-secondary">
            <ArrowLeft size={18} aria-hidden /> All lessons
          </Link>
        }
      />

      {submitted ? (
        <Callout tone="success" icon={CircleCheck} title={`Submitted by ${takenBy ?? 'a colleague'}${register.takenAt ? ` at ${formatTime(register.takenAt)}` : ''}`}>
          {amending ? 'You are amending this register. Submit again to save the changes; families of anyone newly marked absent are notified.' : 'The register is saved to the attendance record. You can amend it if a student arrives late or a mark was wrong.'}
        </Callout>
      ) : (
        <Callout tone="info" icon={BellRing} title="Families of absent students are notified immediately">
          When you submit, each family of a student marked absent receives a message straight away. Late and excused marks are recorded without a notification.
        </Callout>
      )}

      <Card className="card-flush">
        <div className="table-toolbar">
          <div className="stack-sm" style={{ gap: 6 }}>
            <div className="row wrap" style={{ gap: 10 }}>
              <h2 className="card-title">Class roster</h2>
              {submitted ? <Chip tone="success">Submitted</Chip> : <Chip tone="warning">Not submitted</Chip>}
            </div>
            <div className="ta-counts" aria-live="polite">
              {counts.map((c) => (
                <span key={c.value}>
                  <i style={{ background: c.color }} aria-hidden />
                  <b>{c.n}</b>
                  {c.label.toLowerCase()}
                </span>
              ))}
              <span>
                <b>{students.length}</b>on roll
              </span>
            </div>
          </div>
          <div className="toolbar">
            {locked ? (
              <Button variant="secondary" icon={PenLine} onClick={() => setAmending(true)}>
                Amend register
              </Button>
            ) : (
              <>
                <Button variant="secondary" icon={CheckCheck} onClick={markAll} disabled={allPresent}>
                  Mark all present
                </Button>
                <Button icon={Send} onClick={submit}>
                  {submitted ? 'Submit changes' : 'Submit register'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="ta-roster-head" aria-hidden>
          <span>Student</span>
          <span>Attendance</span>
          <span>Mark</span>
        </div>
        <div className="ta-roster" role="list" aria-label="Class roster">
          {students.map(({ student, mark, rate }) => {
            const warn = rate < WARN_RATE;
            return (
              <div key={student.id} className="ta-roster-row" role="listitem" data-mark={mark}>
                <div className="ta-roster-who">
                  <Avatar initials={student.initials} />
                  <div className="stack-sm" style={{ gap: 0, minWidth: 0 }}>
                    <Link to={`/students/${student.id}`}>{student.name}</Link>
                    <span className="ta-id">{student.sisId}</span>
                  </div>
                </div>
                <div className="ta-rate" data-warn={warn} title={warn ? `Below ${WARN_RATE}% attendance` : undefined}>
                  {warn && <TriangleAlert size={12} aria-hidden style={{ display: 'inline', marginInlineEnd: 4, verticalAlign: -1 }} />}
                  {rate.toFixed(1)}%
                  <small>{warn ? 'Below 92%' : 'term to date'}</small>
                </div>
                <div className="ta-presence" role="radiogroup" aria-label={`Attendance for ${student.name}`}>
                  {OPTIONS.map((o) => (
                    <label key={o.value}>
                      <input type="radio" name={`mark-${student.id}`} value={o.value} checked={mark === o.value} disabled={locked} onChange={() => set(student.id, o.value)} />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {!locked && absent > 0 && (
        <p className="small muted">
          Submitting will notify the families of {absent} student{absent === 1 ? '' : 's'} marked absent.
        </p>
      )}
      <PageFoot />
    </>
  );
}
