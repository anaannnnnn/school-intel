import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarCheck, ClipboardList, FileText, GraduationCap, HeartHandshake, Inbox, Lock, MessageCircleQuestion, ShieldCheck, Trophy, Users } from 'lucide-react';
import { Avatar, Button, Callout, Card, CardHeader, Chip, Dialog, TextArea, errorText, formatDate, formatTime, useToast } from '@school-intel/ui';
import { staff, teach, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { Heat, PageFoot, PageHead, Restricted, SubjectDot } from '../ui';
import '../teaching-b.css';
import { CASE, REQUEST } from '../statuses';

export function StudentProfile({ actor }: { actor: Actor }) {
  const { id = '' } = useParams();
  useDb();
  const toast = useToast();
  const [revoke, setRevoke] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const me = staff.me(actor);
  const canManage = me.roles.some((r) => r === 'office' || r === 'it');

  let p;
  try {
    p = staff.studentProfile(actor, id);
  } catch (e) {
    return <Restricted message={errorText(e)} />;
  }

  return (
    <>
      <PageHead
        title={<span className="row" style={{ gap: 14 }}><Avatar initials={p.initials} size="lg" />{p.name}</span>}
        sub={`Year ${p.classId} · ${p.sisId} · Horizon Learning School`}
        spec="Student record · role-filtered"
        actions={<Link to="/students" className="btn btn-secondary">All students</Link>}
      />

      <LearningRecord actor={actor} studentId={p.id} firstName={p.firstName} />

      <div className="grid-main">
        <div className="stack">
          <Card>
            <CardHeader icon={ClipboardList} title="Assignments" sub="From the LMS · source of record" />
            <ul className="list">
              {p.assignments.length === 0 && <li className="list-item muted small">No current assignments in the demo data.</li>}
              {p.assignments.map((a) => {
                const sub = p.submissions.filter((s) => s.assignmentId === a.id).sort((x, y) => y.version - x.version)[0];
                return (
                  <li key={a.id} className="list-item">
                    <span className="grow"><span className="list-title">{a.title}</span><br /><span className="list-meta">{a.subject} · due {formatDate(a.due)}, {formatTime(a.due)}</span></span>
                    {sub ? <Chip tone="success">{sub.id} · v{sub.version}</Chip> : a.acceptsSubmission ? <Chip tone="warning">Not submitted</Chip> : <Chip tone="neutral">In class</Chip>}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader icon={FileText} tone="info" title="Published report comments" />
            {p.comments.length === 0 ? <p className="muted small">None published yet.</p> : p.comments.map((c) => (
              <div key={c.id} className="stack-sm" style={{ marginBlockEnd: 12 }}>
                <span className="small muted">{c.subject} · {c.period} · published {formatDate(c.publishedAt!)}</span>
                <p>{c.versions.find((v) => v.version === c.publishedVersion)?.text}</p>
              </div>
            ))}
          </Card>

          {p.requests.length > 0 && (
            <Card>
              <CardHeader icon={Inbox} title="Family requests" />
              <ul className="list">
                {p.requests.map((r) => (
                  <li key={r.id} className="list-item">
                    <Link to={`/requests/${r.id}`} className="grow" style={{ color: 'inherit', textDecoration: 'none' }}><span className="list-title">{r.id}</span> · {r.subject}<br /><span className="list-meta">{formatDate(r.submittedAt)}</span></Link>
                    <Chip tone={REQUEST[r.status].tone}>{REQUEST[r.status].label}</Chip>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="stack">
          <Card>
            <CardHeader icon={Users} title="Guardians" sub="Verified against school-held records" />
            {p.guardians.length === 0 && <p className="small muted">Guardian records for this learner are not included in the demo.</p>}
            <ul className="list">
              {p.guardians.map((g) => (
                <li key={g.guardianId} className="list-item" style={{ alignItems: 'flex-start' }}>
                  <span className="grow">
                    <span className="list-title">{g.guardian.name}</span> <span className="list-meta">· {g.relationship}</span><br />
                    <span className="list-meta">{g.guardian.email}</span><br />
                    <span className="list-meta">{g.guardian.phone}</span>
                  </span>
                  <span className="stack-sm" style={{ alignItems: 'flex-end' }}>
                    {g.status === 'verified' ? <Chip tone="success">Verified</Chip> : <Chip tone="danger">Revoked</Chip>}
                    {canManage && (g.status === 'verified'
                      ? <Button size="sm" variant="ghost" onClick={() => setRevoke(g.guardianId)}>Revoke access</Button>
                      : <Button size="sm" variant="ghost" onClick={() => { staff.restoreGuardian(actor, g.guardianId, p.id); toast('Access restored'); }}>Restore</Button>)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader icon={CalendarCheck} title="Attendance today" />
            {p.register ? (
              <p>{p.register.status === 'complete' ? <Chip tone="success">Register complete</Chip> : <Chip tone="warning">Register pending</Chip>} <span className="small muted">· {p.register.period}, updated {formatTime(p.register.updatedAt)}</span></p>
            ) : <p className="muted small">No register data.</p>}
          </Card>

          <Card>
            <CardHeader icon={HeartHandshake} title="Student support" />
            {!p.supportCase ? (
              <p className="small muted">No open support case.</p>
            ) : p.supportCase.id === 'restricted' ? (
              <Callout tone="neutral" icon={Lock}>A support record exists. Details are visible only to the assigned pastoral owner.</Callout>
            ) : (
              <Link to={`/support/${p.supportCase.id}`} className="row" style={{ textDecoration: 'none' }}>{p.supportCase.id} <Chip tone={CASE[p.supportCase.status].tone}>{CASE[p.supportCase.status].label}</Chip></Link>
            )}
          </Card>

          {p.activities.length > 0 && (
            <Card>
              <CardHeader icon={Trophy} title="Activities" />
              <ul className="list">{p.activities.map((a) => <li key={a.name} className="list-item"><span className="grow">{a.name}</span><Chip tone={a.status === 'Booked' ? 'success' : 'warning'}>{a.status}</Chip></li>)}</ul>
            </Card>
          )}
          <Callout tone="neutral" icon={ShieldCheck}>Safeguarding records are never shown on student profiles.</Callout>
        </div>
      </div>
      <PageFoot updated="6 Oct, 09:15" />

      <Dialog
        open={!!revoke}
        onClose={() => setRevoke(null)}
        title="Revoke guardian access?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setRevoke(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => {
              try {
                staff.revokeGuardian(actor, revoke!, p.id, reason);
                setRevoke(null);
                setReason('');
                toast('Access revoked · effective on the guardian’s next request');
              } catch (e) {
                setError(errorText(e));
              }
            }}>Revoke access</Button>
          </>
        }
      >
        <p>The guardian loses access to {p.firstName}’s records immediately on their next request. This is recorded in the audit log.</p>
        <TextArea label="Reason" value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} error={error} placeholder="For example: custody update received from the SIS" rows={3} />
      </Dialog>
    </>
  );
}

const PRESENCE_LABEL = { present: 'Present', late: 'Late', absent: 'Absent', excused: 'Excused' } as const;

function LearningRecord({ actor, studentId, firstName }: { actor: Actor; studentId: string; firstName: string }) {
  let r;
  try {
    r = teach.learningRecord(actor, studentId);
  } catch {
    return null;
  }
  const a = r.attendance;
  const strip = a.days.slice(-30);
  const recent = r.behaviour.slice(0, 5);
  const merits = r.behaviour.filter((b) => b.kind === 'merit').reduce((n, b) => n + b.points, 0);
  const demerits = r.behaviour.filter((b) => b.kind === 'demerit').reduce((n, b) => n + b.points, 0);
  return (
    <Card>
      <CardHeader icon={GraduationCap} title="Learning record" sub="Attendance, marked work, merits and study helper use this term" />
      <div className="tb-record">
        <div>
          <span className="tb-section-title">Attendance</span>
          <span className="tb-big">{a.rate}%</span>
          <div className="tb-strip" role="img" aria-label={`Last ${strip.length} school days: ${a.present} present, ${a.late} late, ${a.absent} absent, ${a.excused} excused`}>
            {strip.map((x) => <i key={x.date} data-s={x.status} title={`${formatDate(x.date, { weekday: 'short', day: 'numeric', month: 'short' })}: ${PRESENCE_LABEL[x.status]}`} />)}
          </div>
          <div className="tb-counts">
            <span><b>{a.present}</b>present</span>
            <span><b>{a.late}</b>late</span>
            <span><b>{a.absent}</b>absent</span>
            <span><b>{a.excused}</b>excused</span>
          </div>
        </div>
        <div>
          <span className="tb-section-title">Subject averages</span>
          <ul className="tb-grade-list">
            {r.grades.length === 0 && <li className="muted">No subjects for this class.</li>}
            {r.grades.map((g) => (
              <li key={g.subject.id}>
                <SubjectDot hue={g.subject.hue} />
                <span>{g.subject.name}<span className="muted"> · {g.count} marked</span></span>
                <Heat pct={g.average} label={`${g.subject.name} average`} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <span className="tb-section-title">Points · +{merits} / −{demerits}</span>
          {recent.length === 0 ? <p className="small muted">No points recorded this term.</p> : (
            <ul className="tb-pt-list">
              {recent.map((b) => (
                <li key={b.id} data-kind={b.kind}>
                  <span>{b.kind === 'merit' ? '+' : '−'}{b.points}</span>
                  <span>{b.category}<small>{b.by} · {formatDate(b.at)}</small></span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <span className="tb-section-title">Study helper</span>
          <span className="row" style={{ gap: 10 }}><span className="card-icon" aria-hidden><MessageCircleQuestion size={16} /></span><span className="tb-big">{r.doubts}</span></span>
          <p className="small muted">Question{r.doubts === 1 ? '' : 's'} {firstName} asked the study helper. Hints only; escalations go to the subject teacher.</p>
        </div>
      </div>
    </Card>
  );
}
