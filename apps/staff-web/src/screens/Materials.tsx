import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CirclePlay, FileText, Library, NotebookPen, Plus, Presentation, Sparkles, type LucideIcon } from 'lucide-react';
import { Callout, Card, Chip, EmptyState, formatDateTime } from '@school-intel/ui';
import { teach, useDb } from '@school-intel/api';
import type { Actor, MaterialKind } from '@school-intel/contracts';
import { AiTag, DataTable, PageFoot, PageHead, Stat, SubjectDot, Tabs } from '../ui';
import '../teaching-a.css';

const KIND: Record<MaterialKind, { label: string; icon: LucideIcon }> = {
  notes: { label: 'Notes', icon: FileText },
  video: { label: 'Video', icon: CirclePlay },
  worksheet: { label: 'Worksheet', icon: NotebookPen },
  slides: { label: 'Slides', icon: Presentation },
};

type Tab = 'all' | 'published' | 'drafts';

export function Materials({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const all = teach.materials(actor);
  const subjects = teach.subjectsVisible(actor);
  const own = teach.mySubjects(actor);
  const [tab, setTab] = useState<Tab>('all');
  const [subject, setSubject] = useState('all');

  const bySubject = useMemo(() => all.filter((m) => subject === 'all' || m.subjectId === subject), [all, subject]);
  const rows = bySubject.filter((m) => (tab === 'all' ? true : tab === 'published' ? m.status === 'published' : m.status === 'draft'));
  const published = all.filter((m) => m.status === 'published');
  const drafts = all.filter((m) => m.status === 'draft');
  const aiDrafts = drafts.filter((m) => m.aiGenerated && m.editable);
  const readOnly = own.length === 0;

  return (
    <>
      <PageHead
        title="Study materials"
        sub={readOnly ? 'Read-only view across Year 7 subjects · teachers publish to their own classes' : `Notes, worksheets, slides and videos for your classes · ${own.map((s) => s.name).join(', ')}`}
        spec="Teaching · study materials"
        actions={
          own.length ? (
            <Link to="/materials/new" className="btn">
              <Plus size={18} aria-hidden /> New material
            </Link>
          ) : undefined
        }
      />

      <div className="stats">
        <Stat icon={BookOpen} value={published.length} label="Published to students" />
        <Stat icon={FileText} value={drafts.length} label="Drafts" tone={drafts.length ? 'warning' : undefined} foot="Hidden from students" />
        <Stat icon={Sparkles} value={drafts.filter((m) => m.aiGenerated).length} label="AI drafts to review" tone={aiDrafts.length ? 'warning' : undefined} foot="Need teacher approval" />
        <Stat icon={Library} value={`${published.reduce((n, m) => n + m.minutes, 0)} min`} label="Published study time" tone="neutral" />
      </div>

      {aiDrafts.length > 0 && (
        <Callout tone="warning" icon={Sparkles} title={`${aiDrafts.length} AI draft${aiDrafts.length === 1 ? '' : 's'} waiting for your review`}>
          Students see nothing until you check the content and publish it.{' '}
          <Link to={`/materials/${aiDrafts[0].id}`} className="strong" style={{ color: 'var(--color-brand-ink)' }}>
            Review “{aiDrafts[0].title}”
          </Link>
        </Callout>
      )}

      <Card className="card-flush">
        <div className="table-toolbar" style={{ paddingBlockEnd: 0, alignItems: 'flex-end' }}>
          <Tabs
            label="Filter by status"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'all', label: 'All', count: bySubject.length },
              { value: 'published', label: 'Published', count: bySubject.filter((m) => m.status === 'published').length },
              { value: 'drafts', label: 'Drafts', count: bySubject.filter((m) => m.status === 'draft').length },
            ]}
          />
          <div className="toolbar" style={{ paddingBlockEnd: 10 }}>
            <label className="sr-only" htmlFor="mat-subject">Subject</label>
            <select id="mat-subject" className="select" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DataTable
          caption="Study materials"
          rows={rows}
          onRow={(m) => navigate(`/materials/${m.id}`)}
          empty={
            <EmptyState icon={BookOpen} title={tab === 'drafts' ? 'No drafts' : 'No materials here'}>
              {tab === 'drafts' ? 'Drafts and AI-generated versions appear here until you publish them.' : 'Materials for the selected subject appear here once they are created.'}
            </EmptyState>
          }
          columns={[
            {
              key: 't',
              label: 'Material',
              render: (m) => {
                const K = KIND[m.kind];
                return (
                  <span className="ta-title-cell">
                    <span className="lrow-tile" data-tone={m.aiGenerated ? undefined : 'neutral'} aria-hidden>
                      <K.icon size={18} />
                    </span>
                    <div>
                      <strong>{m.title}</strong>
                      <span className="row wrap" style={{ gap: 6 }}>
                        <span className="ta-id">{m.id}</span>
                        {m.aiGenerated && <AiTag />}
                        {!m.editable && <span className="ta-id">· read only</span>}
                      </span>
                    </div>
                  </span>
                );
              },
            },
            {
              key: 's',
              label: 'Subject',
              render: (m) => (
                <span className="ta-subj">
                  <SubjectDot hue={m.subject.hue} />
                  {m.subject.short}
                </span>
              ),
            },
            { key: 'tp', label: 'Topic', render: (m) => <span className="small">{m.topic?.name ?? '—'}</span> },
            {
              key: 'k',
              label: 'Kind',
              render: (m) => {
                const K = KIND[m.kind];
                return (
                  <span className="ta-kind">
                    <K.icon size={14} aria-hidden />
                    {K.label}
                  </span>
                );
              },
            },
            { key: 'm', label: 'Time', align: 'end', render: (m) => <span className="ta-mono">{m.minutes} min</span> },
            { key: 'st', label: 'Status', render: (m) => (m.status === 'published' ? <Chip tone="success">Published</Chip> : <Chip tone={m.aiGenerated ? 'warning' : 'info'}>{m.aiGenerated ? 'Needs review' : 'Draft'}</Chip>) },
            { key: 'u', label: 'Updated', render: (m) => <span className="small muted" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(m.updatedAt)}</span> },
            { key: 'n', label: '', align: 'end', render: () => <ArrowRight size={16} className="muted" aria-hidden /> },
          ]}
        />
      </Card>
      <PageFoot />
    </>
  );
}
