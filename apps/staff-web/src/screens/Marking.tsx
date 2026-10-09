import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CircleCheck, ClipboardCheck, FileText, Gauge, PenLine, Send, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Avatar, Button, Callout, Card, CardHeader, Chip, EmptyState, Progress, errorText, formatDateTime, useToast, type Tone } from '@school-intel/ui';
import { className, teach, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat, SubjectDot, Tabs } from '../ui';
import '../teaching-b.css';

type Row = ReturnType<typeof teach.markingQueue>[number];
type Status = Row['status'];

export const CONFIDENCE: Record<Row['confidence'], { label: string; tone: Tone }> = {
  high: { label: 'High confidence', tone: 'success' },
  medium: { label: 'Medium confidence', tone: 'warning' },
  low: { label: 'Low confidence', tone: 'danger' },
};

export function Marking({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<Status>('to-confirm');
  const queue = teach.markingQueue(actor);
  const tasks = teach.writtenTasks(actor).filter((t) => t.subject.teacherId === actor.id);

  const by = (s: Status) => queue.filter((x) => x.status === s);
  const toConfirm = by('to-confirm');
  const confirmed = by('confirmed');
  const released = by('released');
  const rows = by(tab);
  const high = toConfirm.filter((x) => x.confidence === 'high').length;
  const low = toConfirm.filter((x) => x.confidence === 'low').length;

  const release = (taskId: string, title: string) => {
    try {
      const n = teach.releaseWritten(actor, taskId);
      toast(`Feedback released to ${n} student${n === 1 ? '' : 's'} · ${title}`);
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const first = toConfirm[0];

  return (
    <>
      <PageHead
        title="Marking"
        sub="AI-suggested marks for written answers, ready for your decision. Each mark shows the rubric criterion, the sentence used as evidence and how confident the suggestion is."
        spec="Teaching · AI-assisted marking"
        actions={first ? <Button icon={PenLine} onClick={() => navigate(`/marking/${encodeURIComponent(first.key)}`)}>Start confirming</Button> : undefined}
      />

      <div className="stats">
        <Stat icon={ClipboardCheck} value={toConfirm.length} label="To confirm" tone={toConfirm.length ? 'warning' : undefined} foot="Answers waiting for your decision" />
        <Stat icon={Gauge} value={high} label="High confidence" foot="Quick check usually enough" />
        <Stat icon={TriangleAlert} value={low} label="Low confidence" tone={low ? 'danger' : undefined} foot="Needs a closer look" />
        <Stat icon={Send} value={confirmed.length} label="Confirmed, not released" tone={confirmed.length ? 'info' : undefined} foot="Release when the class is done" />
      </div>

      <Callout tone="info" icon={ShieldCheck} title="AI suggests, you decide. Nothing reaches students until you confirm and release.">
        Change any mark you disagree with. Every confirmation, and every change from the AI suggestion, is recorded in the audit log.
      </Callout>

      <Card className="card-flush table-card">
        <div className="table-toolbar" style={{ paddingBlockEnd: 0 }}>
          <Tabs
            label="Marking status"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'to-confirm', label: 'To confirm', count: toConfirm.length },
              { value: 'confirmed', label: 'Confirmed', count: confirmed.length },
              { value: 'released', label: 'Released', count: released.length },
            ]}
          />
        </div>
        <DataTable
          caption="Marking queue"
          rows={rows}
          onRow={(r) => navigate(`/marking/${encodeURIComponent(r.key)}`)}
          empty={
            <EmptyState icon={CircleCheck} title={tab === 'to-confirm' ? 'Nothing waiting for you' : tab === 'confirmed' ? 'No confirmed work waiting for release' : 'Nothing released yet'}>
              {tab === 'to-confirm' ? 'New AI suggestions appear here when students submit written answers.' : 'Confirmed work appears here until you release feedback.'}
            </EmptyState>
          }
          columns={[
            { key: 's', label: 'Student', render: (r) => <span className="tb-who"><Avatar initials={r.student.initials} /><strong>{r.student.name}</strong></span> },
            { key: 't', label: 'Task', render: (r) => <span>{r.title}<br /><span className="tb-muted-cell">{r.ref.kind === 'test' ? 'Test · short answer' : 'Written task'}</span></span> },
            { key: 'sub', label: 'Subject', render: (r) => <span className="tb-subject"><SubjectDot hue={r.subject.hue} />{r.subject.short}</span> },
            { key: 'at', label: 'Submitted', render: (r) => <span className="tb-muted-cell">{formatDateTime(r.submittedAt)}</span> },
            { key: 'm', label: tab === 'to-confirm' ? 'AI suggested' : 'Confirmed mark', align: 'end', render: (r) => <span className="tb-score">{r.suggested}<small> / {r.max}</small></span> },
            { key: 'c', label: 'Confidence', render: (r) => <Chip tone={CONFIDENCE[r.confidence].tone}>{CONFIDENCE[r.confidence].label.split(' ')[0]}</Chip> },
            { key: 'a', label: '', align: 'end', render: (r) => <span className="tb-link">{r.status === 'to-confirm' ? 'Review' : 'View'} <ArrowRight size={14} aria-hidden /></span> },
          ]}
        />
      </Card>

      <Card>
        <CardHeader icon={FileText} title="Written tasks" sub="Feedback is released per task, once you have confirmed the marks" />
        {tasks.length === 0 ? (
          <p className="muted small">You have no written tasks set for your classes.</p>
        ) : (
          <div className="tb-tasks">
            {tasks.map((t) => (
              <div key={t.id} className="tb-task">
                <div style={{ minWidth: 0 }}>
                  <div className="tb-task-title">{t.title}</div>
                  <div className="tb-task-meta">{t.subject.name} · {className(t.classId)} · due {formatDateTime(t.due)}</div>
                  <Progress value={(t.submitted / Math.max(1, t.classSize)) * 100} label={`${t.submitted} of ${t.classSize} submitted`} />
                  <div className="tb-task-figs">
                    <span><b>{t.submitted}/{t.classSize}</b>submitted</span>
                    <span><b>{t.toConfirm}</b>to confirm</span>
                    <span><b>{t.confirmed}</b>confirmed</span>
                    <span><b>{t.released}</b>released</span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" icon={Send} disabled={t.confirmed === 0} onClick={() => release(t.id, t.title)} aria-label={`Release feedback for ${t.title}`}>
                  Release feedback{t.confirmed ? ` (${t.confirmed})` : ''}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <PageFoot />
    </>
  );
}
