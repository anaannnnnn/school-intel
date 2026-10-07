import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CircleCheck, Eye, FileSearch, History, ListChecks, PenLine, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Checkbox, Chip, Dialog, EmptyState, TextArea, errorText, formatDate, formatTime, useToast } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { PageFoot, PageHead, Restricted, Stat } from '../ui';
import { DRAFT } from '../statuses';

export function DraftReview({ actor }: { actor: Actor }) {
  const { id = '' } = useParams();
  useDb();
  const toast = useToast();
  let d;
  try {
    d = staff.draft(actor, id);
  } catch (e) {
    return <Restricted message={errorText(e)} />;
  }
  return <Review key={`${d.id}-${d.versions.length}-${d.state}`} actor={actor} draft={d} toast={toast} />;
}

function Review({ actor, draft: d, toast }: { actor: Actor; draft: ReturnType<typeof staff.draft>; toast: ReturnType<typeof useToast> }) {
  const latest = d.versions.at(-1);
  const [text, setText] = useState(latest?.text ?? '');
  const [checks, setChecks] = useState([false, false, false]);
  const [confirm, setConfirm] = useState(false);
  const [published, setPublished] = useState<{ version: number; at: string } | null>(null);
  const [warning, setWarning] = useState('');
  const dirty = text !== (latest?.text ?? '');

  useEffect(() => setChecks([false, false, false]), [text]);

  const save = () => {
    try {
      staff.saveDraftEdit(actor, d.id, text);
      toast('Draft saved as a new version');
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const publish = () => {
    try {
      const r = staff.approveAndPublish(actor, d.id, checks);
      setConfirm(false);
      setPublished(r);
    } catch (e) {
      toast(errorText(e), 'danger');
      setConfirm(false);
    }
  };

  if (published) {
    return (
      <Card>
        <EmptyState icon={CircleCheck} title="Your draft was published" action={<Link to="/copilot" className="btn">Return to drafts</Link>}>
          <p>{d.student.name} · {d.subject} · {d.period}</p>
          <p>Approved by you at {formatTime(published.at)}. Comment version {published.version} is now available to the verified guardian.</p>
          <p>Other student drafts remain private.</p>
        </EmptyState>
      </Card>
    );
  }

  const missing = d.state === 'missing-evidence';

  return (
    <>
      <PageHead
        title={missing ? 'More evidence is needed' : 'Review before publishing'}
        sub={`${d.student.name} · ${d.subject} · ${d.period} report${latest ? ` · Draft v${latest.version}` : ''}`}
        spec="MVP · FR-T02 / FR-T03"
        actions={<Link to="/copilot" className="btn btn-secondary">All drafts</Link>}
      />
      <div className="stats">
        <Stat value={d.evidence.length} label="Evidence records" tone={d.evidence.length ? undefined : 'warning'} />
        <Stat value={0} label="Unresolved claims" />
        <Stat value={<Chip tone={DRAFT[d.state].tone}>{DRAFT[d.state].label}</Chip>} label="Visibility: teacher only" tone="neutral" />
      </div>

      {missing && latest === undefined && (
        <Callout tone="warning" icon={TriangleAlert} title={`${d.student.name} · Year ${d.classId}`}>
          No published assessment exists in this reporting period. Add an authorised teacher note or write the comment manually. No unsupported draft has been generated.
        </Callout>
      )}

      <div className="grid-main">
        <div className="stack">
          <Card>
            <CardHeader icon={PenLine} title={missing && !latest ? 'Write comment manually' : 'Editable report comment'} sub="Plain, specific and evidence-based" />
            <TextArea label="Report comment" value={text} onChange={(e) => setText(e.target.value)} rows={7} hint={`${text.trim().split(/\s+/).filter(Boolean).length} words`} />
            <div className="row wrap" style={{ marginBlockStart: 12 }}>
              <Button variant="secondary" disabled={!dirty || !text.trim()} onClick={save}>Save as new version</Button>
              {missing && (
                <Button
                  variant="ghost"
                  icon={RefreshCw}
                  onClick={() => {
                    const r = staff.regenerateDraft(actor, d.id);
                    setWarning(r.message);
                  }}
                >
                  Try generating again
                </Button>
              )}
            </div>
            {warning && <div style={{ marginBlockStart: 12 }}><Callout tone="warning">{warning}</Callout></div>}
          </Card>

          <Card>
            <CardHeader icon={ListChecks} title="Review checklist" sub="All three are required before publishing" />
            {['Student and reporting period verified', 'Evidence references checked', 'Wording reviewed for clarity'].map((label, i) => (
              <Checkbox key={label} label={label} checked={checks[i]} disabled={dirty || !latest} onChange={(v) => setChecks((c) => c.map((x, j) => (j === i ? v : x)))} />
            ))}
            {dirty && <p className="field-hint">Save your edits before completing the checklist.</p>}
            <div style={{ marginBlockStart: 12 }}>
              <Callout tone="info" icon={Eye}>This approval publishes only {d.student.firstName}’s selected comment; other drafts remain private.</Callout>
            </div>
            <div className="row" style={{ marginBlockStart: 16 }}>
              <Button variant="brand" disabled={dirty || !latest || checks.some((c) => !c) || d.state === 'published'} onClick={() => setConfirm(true)}>
                {d.state === 'published' ? 'Already published' : 'Approve and publish'}
              </Button>
              {d.state === 'published' && <Button variant="ghost" onClick={() => staff.reopenDraft(actor, d.id)}>Start a new version</Button>}
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card>
            <CardHeader icon={FileSearch} title="Evidence" sub="Every statement links to a source record" />
            {d.evidence.length === 0 ? (
              <p className="muted small">No authorised evidence for this period.</p>
            ) : (
              d.evidence.map((e) => (
                <div key={e.id} className="evidence">
                  <div className="grow">
                    <strong>{e.label}</strong> · {e.value}
                    <small>{formatDate(e.date)} · {e.source.system} {e.source.recordId}</small>
                  </div>
                  <Chip tone="success" dot={false}>Linked</Chip>
                </div>
              ))
            )}
          </Card>
          <Card>
            <CardHeader icon={History} title="Revision history" />
            {d.versions.length === 0 ? (
              <p className="muted small">No versions yet.</p>
            ) : (
              <ol className="timeline">
                {[...d.versions].reverse().map((v) => (
                  <li key={v.version} data-state="done">
                    <strong>v{v.version}</strong> · {v.editedBy}
                    <div className="small muted">{formatDate(v.at)}, {formatTime(v.at)}</div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <PageFoot updated="6 Oct, 09:15" />

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Publish this comment?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="brand" onClick={publish}>Approve and publish</Button>
          </>
        }
      >
        <p>{d.student.name}’s verified guardians will be able to read version {latest?.version} in the family app. This action is recorded in the audit log.</p>
        <p className="draft-text">{latest?.text}</p>
      </Dialog>
    </>
  );
}
