import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, FileClock, FileStack, Gauge, PenLine, Plus, Timer } from 'lucide-react';
import { Card, CardHeader, Chip, EmptyState, Progress, formatDate, formatDateTime, formatTime, type Tone } from '@school-intel/ui';
import { getDb, teach, useDb } from '@school-intel/api';
import type { Actor, Assessment } from '@school-intel/contracts';
import { DataTable, Heat, ListRow, PageFoot, PageHead, Stat, SubjectDot, Tabs } from '../ui';
import '../teaching-a.css';

export const ASSESSMENT_STATUS: Record<Assessment['status'], { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  open: { label: 'Open', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
};

type TabKey = 'open' | 'upcoming' | 'closed';

function Window({ opensAt, closesAt, durationMin }: { opensAt: string; closesAt?: string; durationMin?: number }) {
  const sameDay = closesAt && opensAt.slice(0, 10) === closesAt.slice(0, 10);
  return (
    <span className="ta-window">
      <span>{formatDateTime(opensAt)}</span>
      <small>
        {closesAt ? `until ${sameDay ? formatTime(closesAt) : formatDateTime(closesAt)}` : 'No closing time'}
        {durationMin ? ` · ${durationMin} min` : ''}
      </small>
    </span>
  );
}

export function Assessments({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const all = teach.assessments(actor);
  const visible = teach.subjectsVisible(actor);
  const own = teach.mySubjects(actor);
  const d = getDb();
  const [tab, setTab] = useState<TabKey>('open');

  const groups: Record<TabKey, typeof all> = {
    open: all.filter((a) => a.status === 'open'),
    upcoming: all.filter((a) => a.status === 'scheduled' || a.status === 'draft'),
    closed: all.filter((a) => a.status === 'closed'),
  };
  const rows = groups[tab];
  const toMark = all.filter((a) => own.some((s) => s.id === a.subjectId)).reduce((n, a) => n + a.toMark, 0);
  const closedAvgs = groups.closed.map((a) => a.average).filter((x): x is number => x !== undefined);
  const closedAvg = closedAvgs.length ? Math.round(closedAvgs.reduce((a, b) => a + b, 0) / closedAvgs.length) : undefined;
  const papers = d.pastPapers.filter((p) => visible.some((s) => s.id === p.subjectId));

  return (
    <>
      <PageHead
        title="Quizzes & tests"
        sub={own.length ? `Build from your approved question bank, open to the class and release results when marking is done` : 'Read-only view across Year 7 subjects'}
        spec="Teaching · assessments"
        actions={
          own.length ? (
            <Link to="/assessments/new" className="btn">
              <Plus size={18} aria-hidden /> New quiz or test
            </Link>
          ) : undefined
        }
      />

      <div className="stats">
        <Stat icon={Timer} value={groups.open.length} label="Open now" foot={`${groups.open.reduce((n, a) => n + a.inProgress, 0)} students mid-attempt`} />
        <Stat icon={FileClock} value={groups.upcoming.length} label="Scheduled & drafts" tone="neutral" />
        <Stat icon={PenLine} value={toMark} label="Attempts to mark" tone={toMark ? 'warning' : undefined} to={own.length ? '/marking' : undefined} foot={own.length ? 'Written answers with AI-suggested marks' : 'Teachers confirm marks'} />
        <Stat icon={Gauge} value={closedAvg === undefined ? '—' : `${closedAvg}%`} label="Average score · closed" tone={closedAvg !== undefined && closedAvg < 50 ? 'warning' : undefined} foot={`${closedAvgs.length} closed assessment${closedAvgs.length === 1 ? '' : 's'}`} />
      </div>

      <div className="grid-main">
        <Card className="card-flush ta-flush">
          <div className="table-toolbar" style={{ paddingBlockEnd: 0 }}>
            <Tabs
              label="Assessment status"
              value={tab}
              onChange={setTab}
              items={[
                { value: 'open', label: 'Open', count: groups.open.length },
                { value: 'upcoming', label: 'Scheduled & drafts', count: groups.upcoming.length },
                { value: 'closed', label: 'Closed', count: groups.closed.length },
              ]}
            />
          </div>
          <div className="ta-card-gap" />
          <DataTable
            caption="Quizzes and tests"
            rows={rows}
            onRow={(a) => navigate(`/assessments/${a.id}`)}
            empty={
              <EmptyState icon={ClipboardCheck} title={tab === 'open' ? 'Nothing open right now' : tab === 'upcoming' ? 'Nothing scheduled' : 'No closed assessments'}>
                {own.length ? 'Create a quiz or test from your approved question bank.' : 'Assessments appear here when teachers create them.'}
              </EmptyState>
            }
            columns={[
              {
                key: 't',
                label: 'Assessment',
                render: (a) => (
                  <span className="stack-sm" style={{ gap: 4 }}>
                    <span className="strong" style={{ fontWeight: 600 }}>{a.title}</span>
                    <span className="row wrap" style={{ gap: 8 }}>
                      <Chip tone={a.kind === 'test' ? 'info' : 'neutral'} dot={false}>{a.kind === 'test' ? 'Test' : 'Quiz'}</Chip>
                      <span className="ta-subj small">
                        <SubjectDot hue={a.subject.hue} />
                        {a.subject.short}
                      </span>
                      <span className="ta-id">{a.questionIds.length} q · {a.marks} marks</span>
                    </span>
                  </span>
                ),
              },
              { key: 'w', label: 'Window', render: (a) => <Window opensAt={a.opensAt} closesAt={a.closesAt} durationMin={a.durationMin} /> },
              {
                key: 's',
                label: 'Submitted',
                render: (a) => (
                  <span className="ta-submitted">
                    <span className="ta-mono">{a.submitted}/{a.classSize}</span>
                    <Progress value={a.classSize ? (a.submitted / a.classSize) * 100 : 0} label={`${a.submitted} of ${a.classSize} submitted`} />
                  </span>
                ),
              },
              { key: 'avg', label: 'Avg', align: 'end', render: (a) => <Heat pct={a.average} label={a.average === undefined ? 'No marked attempts' : `Average ${a.average}%`} /> },
              { key: 'm', label: 'To mark', align: 'end', render: (a) => (a.toMark ? <Chip tone="warning">{a.toMark}</Chip> : <span className="ta-mono muted">0</span>) },
              {
                key: 'st',
                label: 'Status',
                render: (a) => (
                  <span className="stack-sm" style={{ gap: 4, alignItems: 'flex-start' }}>
                    <Chip tone={ASSESSMENT_STATUS[a.status].tone}>{ASSESSMENT_STATUS[a.status].label}</Chip>
                    {a.kind === 'test' && a.status !== 'draft' && <span className="ta-id">{a.resultsReleased ? 'Results released' : 'Results held'}</span>}
                  </span>
                ),
              },
              { key: 'n', label: '', align: 'end', render: () => <ArrowRight size={16} className="muted" aria-hidden /> },
            ]}
          />
        </Card>

        <Card>
          <CardHeader icon={FileStack} title="Past papers" sub="School-authored, free to use within Horizon" />
          {papers.length === 0 ? (
            <p className="small muted">No past papers for your subjects yet.</p>
          ) : (
            <div className="lrows ta-paper-list">
              {papers.map((p) => {
                const s = d.subjects.find((x) => x.id === p.subjectId)!;
                return (
                  <ListRow
                    key={p.id}
                    icon={FileStack}
                    tone="neutral"
                    title={p.title}
                    sub={
                      <span className="ta-subj">
                        <SubjectDot hue={s.hue} /> {s.short} · {p.session} {p.year} · {p.questionIds.length} questions
                      </span>
                    }
                    value={<span className="ta-id">{p.id.replace('PAPER-', '')}</span>}
                  />
                );
              })}
            </div>
          )}
          <p className="small muted" style={{ marginBlockStart: 12 }}>
            Students can sit these as timed practice from their Tests page. Questions from past papers can also be added to your own tests.
          </p>
          {groups.upcoming.some((a) => a.status === 'scheduled') && (
            <p className="small muted" style={{ marginBlockStart: 8 }}>
              Next scheduled: {groups.upcoming.filter((a) => a.status === 'scheduled').map((a) => `${a.title} (${formatDate(a.opensAt)})`).join(', ')}.
            </p>
          )}
        </Card>
      </div>
      <PageFoot />
    </>
  );
}
