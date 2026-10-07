import { BookOpen, CalendarCheck, ReceiptText, ShieldCheck } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Chip, EmptyState, formatBytes, formatDate, formatTime, useToast } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';

const RESOURCES = [
  { title: 'Fractions worked examples', subject: 'Mathematics', approved: '5 Oct' },
  { title: 'Worksheet 4 · equivalent fractions', subject: 'Mathematics', approved: '5 Oct' },
  { title: 'Particle model worksheet', subject: 'Science', approved: '4 Oct' },
  { title: 'Change of state rubric', subject: 'Science', approved: '4 Oct' },
  { title: 'Vocabulary revision cards', subject: 'Arabic', approved: '3 Oct' },
  { title: 'Reading log template', subject: 'English', approved: '1 Oct' },
];

export function Exams({ actor }: { actor: Actor }) {
  useDb();
  const toast = useToast();
  const subs = staff.classSubmissions(actor);
  return (
    <>
      <PageHead title="Exam and resource hub" sub="Year 7A · Approved revision resources · Term 1" spec="PHASE 2 · FR-E01–E04" />
      <div className="stats">
        <Stat value={3} label="Upcoming checkpoints" />
        <Stat value={RESOURCES.length} label="Approved resources" />
        <Stat value={subs.length} label="Submissions received" foot="Science observation report" />
      </div>
      <div className="grid-2">
        <Card>
          <CardHeader icon={CalendarCheck} title="Fractions checkpoint" sub="Friday, 9 Oct · 10:20–11:00" />
          <p>Scope: equivalent fractions, simplification, unlike denominators.</p>
          <p className="muted small" style={{ marginBlockStart: 6 }}>Teacher-approved practice: Worksheet 4 and worked examples.</p>
          <div style={{ marginBlockStart: 12 }}><Callout tone="neutral" icon={ShieldCheck}>Secure exam questions are not stored here and never enter general retrieval.</Callout></div>
        </Card>
        <Card>
          <CardHeader icon={ReceiptText} title="Submission reliability" sub="Science observation report · due 8 Oct, 18:00" />
          <ul className="list small">
            <li className="list-item">Accepts PDF or DOCX up to 20 MB.</li>
            <li className="list-item">Late submissions require teacher review.</li>
            <li className="list-item">A server receipt confirms acceptance; local upload alone does not.</li>
          </ul>
        </Card>
      </div>
      <Card className="card-flush table-card">
        <div className="table-toolbar"><h2 className="card-title">Submissions</h2></div>
        <DataTable
          caption="Submissions"
          rows={subs}
          empty={<EmptyState icon={ReceiptText} title="No submissions yet">Receipts appear here as soon as the server accepts a student’s file.</EmptyState>}
          columns={[
            { key: 'id', label: 'Receipt', render: (s) => <span className="strong">{s.id}</span> },
            { key: 'st', label: 'Learner', render: (s) => s.student },
            { key: 'a', label: 'Assignment', render: (s) => s.assignment },
            { key: 'f', label: 'File', render: (s) => <span className="small">{s.fileName} · v{s.version} · {formatBytes(s.sizeBytes)}</span> },
            { key: 't', label: 'Accepted', render: (s) => `${formatDate(s.acceptedAt!)}, ${formatTime(s.acceptedAt!)}` },
            { key: 'r', label: 'Review', render: (s) => (s.teacherReview === 'reviewed' ? <Chip tone="success">Reviewed</Chip> : <Button size="sm" variant="secondary" onClick={() => { staff.markSubmissionReviewed(actor, s.id); toast('Marked as reviewed'); }}>Mark reviewed</Button>) },
          ]}
        />
      </Card>
      <Card className="card-flush table-card">
        <div className="table-toolbar"><h2 className="card-title">Approved resources</h2></div>
        <DataTable caption="Approved resources" rows={RESOURCES} columns={[
          { key: 't', label: 'Resource', render: (r) => <span className="row"><BookOpen size={16} className="muted" aria-hidden /><span className="strong">{r.title}</span></span> },
          { key: 's', label: 'Subject', render: (r) => r.subject },
          { key: 'a', label: 'Status', render: (r) => <Chip tone="success">Approved {r.approved}</Chip> },
        ]} />
      </Card>
      <PageFoot updated="6 Oct, 09:10" />
    </>
  );
}
