import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileSearch, ShieldCheck, Sparkles } from 'lucide-react';
import { Avatar, Callout, Card, CardHeader, Chip, Segmented, formatDate } from '@school-intel/ui';
import { staff, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageFoot, PageHead, Stat } from '../ui';
import { DRAFT } from '../statuses';

type Filter = 'all' | 'review' | 'done';

export function Copilot({ actor }: { actor: Actor }) {
  useDb();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('review');
  const all = staff.drafts(actor);
  const review = all.filter((d) => ['draft', 'edited', 'missing-evidence'].includes(d.state));
  const done = all.filter((d) => ['approved', 'published'].includes(d.state));
  const rows = filter === 'all' ? all : filter === 'review' ? review : done;
  const featured = all.find((d) => d.id === 'd-sara' && d.state !== 'published') ?? review.find((d) => d.versions.length);

  return (
    <>
      <PageHead title="Teacher Copilot · Report drafts" sub="Mathematics · Year 7A · Term 1 · Ms Nadia Farooq" spec="MVP · FR-T01–T04" />
      <div className="stats">
        <Stat value={all.length} label="Learners with drafts" />
        <Stat value={done.length} label="Approved or published" />
        <Stat value={review.length} label="Pending review" tone={review.length ? 'warning' : undefined} />
        <Stat value={all.filter((d) => d.state === 'missing-evidence').length} label="Missing evidence" tone="neutral" />
      </div>

      <div className="grid-main">
        {featured ? (
          <Card>
            <CardHeader icon={Sparkles} title={`${featured.student.name} · Draft v${featured.versions.length}`} sub={`Last edited by ${featured.versions.at(-1)!.editedBy}`} action={<Chip tone={DRAFT[featured.state].tone}>{DRAFT[featured.state].label}</Chip>} />
            <p className="draft-text">{featured.versions.at(-1)!.text}</p>
            <div className="row" style={{ marginBlockStart: 16 }}>
              <button type="button" className="btn" onClick={() => navigate(`/copilot/${featured.id}`)}>Open draft review</button>
            </div>
          </Card>
        ) : (
          <Card><CardHeader icon={Sparkles} title="All drafts reviewed" sub="New drafts appear after the next assessment import." /></Card>
        )}
        <Card>
          <CardHeader icon={FileSearch} title="Evidence used" sub="Authorised records only" />
          {featured ? (
            <ul className="list">
              {featured.evidence.map((e) => (
                <li key={e.id} className="list-item">
                  <span className="grow"><span className="list-title">{e.label}</span><span className="list-meta"> · {formatDate(e.date)}</span><br /><span className="list-meta">{e.value}</span></span>
                  <Chip tone="neutral" dot={false}>{e.source.system}</Chip>
                </li>
              ))}
            </ul>
          ) : null}
          <div style={{ marginBlockStart: 14 }}>
            <Callout tone="success" icon={ShieldCheck}>No claim is added without supporting evidence. Drafts stay private until you approve them.</Callout>
          </div>
        </Card>
      </div>

      <Card className="card-flush table-card">
        <div className="table-toolbar">
          <h2 className="card-title">Class drafts</h2>
          <Segmented label="Filter drafts" value={filter} onChange={setFilter} options={[{ value: 'review', label: `To review (${review.length})` }, { value: 'done', label: `Done (${done.length})` }, { value: 'all', label: 'All' }]} />
        </div>
        <DataTable
          caption="Class drafts"
          rows={rows}
          onRow={(d) => navigate(`/copilot/${d.id}`)}
          columns={[
            { key: 's', label: 'Learner', render: (d) => <span className="row"><Avatar initials={d.student.initials} /><span className="strong">{d.student.name}</span></span> },
            { key: 'c', label: 'Class', render: (d) => d.classId },
            { key: 'v', label: 'Version', render: (d) => (d.versions.length ? `v${d.versions.length}` : '—') },
            { key: 'e', label: 'Evidence', render: (d) => `${d.evidence.length} ${d.evidence.length === 1 ? 'record' : 'records'}` },
            { key: 'st', label: 'Status', render: (d) => <Chip tone={DRAFT[d.state].tone}>{DRAFT[d.state].label}</Chip> },
            { key: 'n', label: '', align: 'end', render: () => <ArrowRight size={16} className="muted" aria-hidden /> },
          ]}
        />
      </Card>
      <PageFoot updated="6 Oct, 09:15" />
    </>
  );
}
