import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CircleCheck, FileText, ListChecks, Paperclip, ReceiptText, ShieldCheck, Upload, WifiOff } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Chip, Freshness, Progress, Steps, errorText, formatBytes, formatDate, formatTime, useToast } from '@school-intel/ui';
import { family, useDb } from '@school-intel/api';
import type { Submission } from '@school-intel/contracts';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';

type Phase = 'idle' | 'selected' | 'uploading' | 'paused' | 'processing' | 'accepted';

async function sha256(file: File) {
  try {
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }
}

export function AssignmentScreen() {
  const { id = '' } = useParams();
  const { actor, child, isParent } = useFamily();
  useDb();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Submission | null>(null);
  const [replacing, setReplacing] = useState(false);

  const task = child ? family.assignmentsFor(actor, child.id).find((t) => t.id === id) : undefined;
  const history = family.submissionsFor(actor, id);
  const latest = receipt ?? history[0];

  useEffect(() => {
    const offline = () => {
      if (phase === 'uploading') {
        window.clearInterval(timer.current);
        setPhase('paused');
      }
    };
    window.addEventListener('offline', offline);
    return () => window.removeEventListener('offline', offline);
  }, [phase]);

  useEffect(() => () => window.clearInterval(timer.current), []);

  if (!task || !child) return <PageHeader back="/tasks" title="Assignment not found" />;

  const choose = (f: File | undefined) => {
    setError('');
    if (!f) return;
    try {
      family.validateFile(f.name, f.size);
      setFile(f);
      setPhase('selected');
      setProgress(0);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const transfer = (from: number) => {
    setPhase('uploading');
    let p = from;
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      p = Math.min(100, p + 7 + Math.random() * 9);
      setProgress(p);
      if (p >= 100) {
        window.clearInterval(timer.current);
        setPhase('processing');
        void finish();
      }
    }, 180);
  };

  const finish = async () => {
    if (!file) return;
    const checksum = await sha256(file);
    setTimeout(() => {
      try {
        const sub = family.acceptSubmission(actor, task.id, { name: file.name, size: file.size, checksum });
        setReceipt(sub);
        setPhase('accepted');
        setReplacing(false);
        toast('Submission accepted by the school server');
      } catch (e) {
        setError(errorText(e));
        setPhase('selected');
      }
    }, 900);
  };

  const interrupt = () => {
    window.clearInterval(timer.current);
    setPhase('paused');
  };

  const showUploader = !isParent && task.acceptsSubmission && (!latest || replacing) && phase !== 'accepted';

  return (
    <>
      <PageHeader back="/tasks" eyebrow={`${task.subject} · Year ${child.classId}`} title={task.title} />
      <div className="row wrap">
        <Chip tone={latest ? 'success' : 'warning'}>Due {formatDate(task.due)}, {formatTime(task.due)}</Chip>
        <Freshness source="LMS" at={task.source.updatedAt} stale={task.stale} />
      </div>

      <Card>
        <CardHeader icon={ListChecks} title="Instructions" sub={`About ${task.minutes} minutes`} />
        <ul className="glance">
          {task.instructions.map((x) => <li key={x}><span className="glance-body">{x}</span></li>)}
        </ul>
      </Card>

      {latest && !replacing && (
        <Card className="receipt">
          <CardHeader icon={ReceiptText} title={phase === 'accepted' ? 'Submission accepted' : 'Latest receipt'} sub={`Server receipt · ${latest.id}`} action={<Chip tone="success">Accepted</Chip>} />
          <dl className="kv">
            <dt>File</dt><dd style={{ wordBreak: 'break-all' }}>{latest.fileName}</dd>
            <dt>Version</dt><dd>{latest.version} · {formatBytes(latest.sizeBytes)}</dd>
            <dt>Accepted</dt><dd>{formatDate(latest.acceptedAt!, { day: 'numeric', month: 'short', year: 'numeric' })}, {formatTime(latest.acceptedAt!)} GST</dd>
            <dt>Assignment</dt><dd className="receipt-code">{task.id}</dd>
            <dt>Teacher review</dt><dd>{latest.teacherReview === 'reviewed' ? 'Reviewed' : 'Pending'}</dd>
          </dl>
          <div style={{ marginBlockStart: 16 }}>
            <Callout tone="success" icon={ShieldCheck}>The school server received and accepted this file. Keep this receipt as proof of submission.</Callout>
          </div>
          {!isParent && (
            <div className="stack-sm" style={{ marginBlockStart: 16 }}>
              <p className="small muted">Resubmission is allowed before {formatDate(task.due)}, {formatTime(task.due)}. A new version gets its own receipt.</p>
              <Button variant="secondary" icon={Upload} onClick={() => { setReplacing(true); setPhase('idle'); setFile(null); setReceipt(null); }}>Replace file</Button>
            </div>
          )}
        </Card>
      )}

      {isParent && !latest && task.acceptsSubmission && (
        <Callout tone="warning">Not yet submitted. Submissions are made from {child.firstName}’s student account.</Callout>
      )}

      {showUploader && (
        <Card>
          <CardHeader icon={Paperclip} title="Your file" sub="PDF or DOCX · maximum 20 MB" />
          <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(e) => choose(e.target.files?.[0])} />
          {!file ? (
            <button type="button" className="file-drop" onClick={() => inputRef.current?.click()}>
              <Upload size={22} aria-hidden />
              <strong>Choose a file</strong>
              <span className="small muted">From your device or cloud drive</span>
            </button>
          ) : (
            <div className="stack">
              <div className="file-row">
                <span className="card-icon" aria-hidden><FileText size={18} /></span>
                <div className="grow">
                  <strong style={{ display: 'block', wordBreak: 'break-all' }}>{file.name}</strong>
                  <span className="small muted">{formatBytes(file.size)} · {file.name.split('.').pop()?.toUpperCase()}</span>
                </div>
                {phase === 'selected' && <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()}>Change</Button>}
              </div>

              {phase === 'selected' && <Chip tone="neutral">Selected, not uploaded</Chip>}

              {(phase === 'uploading' || phase === 'paused' || phase === 'processing') && (
                <div className="stack-sm">
                  <div className="row-between small">
                    <span>{phase === 'processing' ? 'Received · checking file' : phase === 'paused' ? 'Upload paused' : 'Uploading…'}</span>
                    <span className="tabular">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} tone={phase === 'paused' ? 'warning' : undefined} label="Upload progress" />
                </div>
              )}

              {phase === 'paused' && (
                <Callout tone="warning" icon={WifiOff} title="Your connection was interrupted">
                  {Math.round(progress)}% transferred. No server acceptance receipt exists yet. Your file is kept for this session.
                </Callout>
              )}
            </div>
          )}
          {error && <p className="field-error" role="alert" style={{ marginBlockStart: 12 }}>{error}</p>}
        </Card>
      )}

      {showUploader && (
        <Card>
          <CardHeader icon={CircleCheck} title="How submission works" />
          <Steps
            steps={[
              { label: 'Upload your file', done: phase === 'processing' },
              { label: 'School server checks the file', done: false },
              { label: 'Receipt issued', done: false, meta: 'Only a receipt confirms acceptance. Late work is reviewed by your teacher.' },
            ]}
          />
        </Card>
      )}

      {showUploader && file && (
        <div className="stack-sm">
          {phase === 'selected' && <Button block icon={Upload} onClick={() => transfer(0)}>Upload and submit</Button>}
          {phase === 'uploading' && (
            <Button block variant="secondary" icon={WifiOff} onClick={interrupt}>Simulate connection drop</Button>
          )}
          {phase === 'paused' && <Button block icon={Upload} onClick={() => transfer(progress)}>Resume upload</Button>}
          {phase === 'processing' && <Button block busy>Waiting for server receipt</Button>}
        </div>
      )}

      {history.length > 1 && (
        <Card>
          <CardHeader icon={ReceiptText} title="Receipt history" />
          <ul className="glance">
            {history.map((h) => (
              <li key={h.id}>
                <span className="glance-body">
                  <span className="glance-title">Version {h.version} · {h.id}</span>
                  <span className="glance-detail">{formatDate(h.acceptedAt!)}, {formatTime(h.acceptedAt!)} · {formatBytes(h.sizeBytes)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
