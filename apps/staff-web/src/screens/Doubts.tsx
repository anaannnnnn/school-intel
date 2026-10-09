import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CircleCheck, MessageCircleQuestion, MessagesSquare, ShieldCheck, Sparkles, UserRoundCheck } from 'lucide-react';
import { Avatar, Callout, Card, CardHeader, Chip, EmptyState, formatDateTime } from '@school-intel/ui';
import { className, teach, useDb } from '@school-intel/api';
import type { Actor, Doubt } from '@school-intel/contracts';
import { AiTag, DataTable, PageFoot, PageHead, Stat, SubjectDot, Tabs } from '../ui';
import '../teaching-b.css';

type Filter = 'waiting' | 'ai' | 'all';

export function DoubtStatus({ status }: { status: Doubt['status'] }) {
  if (status === 'escalated') return <Chip tone="warning">Waiting for you</Chip>;
  if (status === 'ai-answered') return <span className="chip chip-ai" data-dot="true">Answered by AI</span>;
  if (status === 'teacher-answered') return <Chip tone="success">You replied</Chip>;
  return <Chip tone="neutral">Resolved</Chip>;
}

export function Doubts({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const { list, themes } = teach.doubtsInbox(actor);
  const waiting = list.filter((x) => x.status === 'escalated');
  const byAi = list.filter((x) => x.status === 'ai-answered');
  const [tab, setTab] = useState<Filter>(waiting.length ? 'waiting' : 'all');
  const rows = tab === 'waiting' ? waiting : tab === 'ai' ? byAi : list;
  const top = Math.max(1, ...themes.map((t) => t.count));
  const replied = list.filter((x) => x.status === 'teacher-answered' || x.status === 'resolved').length;

  return (
    <>
      <PageHead
        title="Student questions"
        sub="Questions students asked the study helper about your subjects. The helper gives hints and points to your materials, never the answer. When a student is still stuck, the question comes to you."
        spec="Teaching · Study helper escalations"
      />

      <div className="stats">
        <Stat icon={MessageCircleQuestion} value={waiting.length} label="Waiting for you" tone={waiting.length ? 'warning' : undefined} foot="Escalated by students" />
        <Stat icon={Bot} value={byAi.length} label="Answered by AI hints" foot="No action needed" />
        <Stat icon={UserRoundCheck} value={replied} label="Replied by you" foot="This term" />
        <Stat icon={MessagesSquare} value={list.length} label="All questions" foot={`${themes.length} topic${themes.length === 1 ? '' : 's'}`} />
      </div>

      <div className="grid-main">
        <Card className="card-flush table-card">
          <div className="table-toolbar" style={{ paddingBlockEnd: 0 }}>
            <Tabs
              label="Filter questions"
              value={tab}
              onChange={setTab}
              items={[
                { value: 'waiting', label: 'Waiting for you', count: waiting.length },
                { value: 'ai', label: 'Answered by AI', count: byAi.length },
                { value: 'all', label: 'All', count: list.length },
              ]}
            />
          </div>
          <DataTable
            caption="Student questions"
            rows={rows}
            onRow={(r) => navigate(`/doubts/${r.id}`)}
            empty={
              <EmptyState icon={CircleCheck} title={tab === 'waiting' ? 'No one is waiting for you' : 'No questions here'}>
                {tab === 'waiting' ? 'Students who are still stuck after the AI hints appear here.' : 'Questions about your subjects will appear here.'}
              </EmptyState>
            }
            columns={[
              { key: 's', label: 'Student', render: (r) => <span className="tb-who"><Avatar initials={r.student.initials} /><span><strong>{r.student.name}</strong><small>{className(r.student.classId)}</small></span></span> },
              {
                key: 'q',
                label: 'Question',
                render: (r) => (
                  <span style={{ display: 'block', minWidth: 0 }}>
                    <span className="tb-excerpt" title={r.question}>{r.question}</span>
                    <span className="tb-muted-cell tb-subject"><SubjectDot hue={r.subject.hue} />{r.subject.short}{r.topic ? ` · ${r.topic.name}` : ''}</span>
                  </span>
                ),
              },
              { key: 'st', label: 'Status · asked', render: (r) => <span className="stack-sm" style={{ gap: 4, alignItems: 'flex-start' }}><DoubtStatus status={r.status} /><span className="tb-muted-cell">{formatDateTime(r.createdAt)}</span></span> },
            ]}
          />
        </Card>

        <div className="stack">
          <Card className="ai-panel">
            <CardHeader icon={Sparkles} title="Common themes" sub={<span className="row wrap" style={{ gap: 6 }}>Grouped by topic <AiTag>AI summary</AiTag></span>} />
            {themes.length === 0 ? (
              <p className="small muted">No themes yet.</p>
            ) : (
              <div className="tb-themes">
                {themes.map((t) => (
                  <div key={t.topicId}>
                    <div className="tb-theme-top">
                      <strong>{t.name}</strong>
                      <span>{t.count} question{t.count === 1 ? '' : 's'}{t.escalated ? ` · ${t.escalated} escalated` : ''}</span>
                    </div>
                    <div className="tb-theme-bar" role="img" aria-label={`${t.count} questions, ${t.escalated} escalated`}>
                      <i data-esc style={{ width: `${(t.escalated / top) * 100}%` }} />
                      <i style={{ width: `${((t.count - t.escalated) / top) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="legend">
                  <span><i style={{ background: 'var(--color-warning-solid)' }} />Escalated</span>
                  <span><i style={{ background: 'color-mix(in srgb, var(--color-brand) 45%, transparent)' }} />Helped by hints</span>
                </div>
              </div>
            )}
          </Card>
          <Callout tone="info" icon={ShieldCheck} title="Hints, not answers">
            The study helper only uses your published materials, shows its sources and never completes work for students.
          </Callout>
        </div>
      </div>

      <PageFoot />
    </>
  );
}
