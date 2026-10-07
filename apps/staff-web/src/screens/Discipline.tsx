import { useState } from 'react';
import { Award, BellRing, BellOff, ChartBar, ListChecks, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Avatar, Button, Card, CardHeader, Chip, EmptyState, Segmented, SelectField, Switch, TextArea, errorText, formatDate, formatDateTime, useToast } from '@school-intel/ui';
import { teach, useDb } from '@school-intel/api';
import type { Actor, BehaviourPoint } from '@school-intel/contracts';
import { DataTable, ListRow, PageFoot, PageHead, Stat } from '../ui';
import '../teaching-b.css';

type Kind = BehaviourPoint['kind'];
type Filter = 'all' | Kind;

export function Discipline({ actor }: { actor: Actor }) {
  useDb();
  const toast = useToast();
  const log = teach.behaviourLog(actor);
  const [filter, setFilter] = useState<Filter>('all');

  const [studentId, setStudentId] = useState(log.students[0]?.id ?? '');
  const [kind, setKind] = useState<Kind>('merit');
  const cats = kind === 'merit' ? teach.MERIT_CATEGORIES : teach.DEMERIT_CATEGORIES;
  const [category, setCategory] = useState(cats[0]);
  const [points, setPoints] = useState('1');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState('');

  const merits = log.points.filter((p) => p.kind === 'merit');
  const demerits = log.points.filter((p) => p.kind === 'demerit');
  const sum = (xs: typeof log.points) => xs.reduce((n, p) => n + p.points, 0);
  const notified = log.points.filter((p) => p.parentNotified).length;
  const rows = filter === 'all' ? log.points : log.points.filter((p) => p.kind === filter);
  const catMap = new Map<string, { key: string; kind: Kind; category: string; count: number; points: number }>();
  for (const p of log.points) {
    const k = `${p.kind}:${p.category}`;
    const c = catMap.get(k) ?? { key: k, kind: p.kind, category: p.category, count: 0, points: 0 };
    c.count++;
    c.points += p.points;
    catMap.set(k, c);
  }
  const cats_ = [...catMap.values()].sort((a, b) => b.count - a.count || b.points - a.points);
  const top = Math.max(1, ...log.classes.flatMap((c) => [c.merits, c.demerits]));

  const switchKind = (k: Kind) => {
    setKind(k);
    setCategory((k === 'merit' ? teach.MERIT_CATEGORIES : teach.DEMERIT_CATEGORIES)[0]);
    setError('');
  };

  const submit = () => {
    try {
      const p = teach.awardPoint(actor, { studentId, kind, category, points: Number(points), note, notifyParent: notify });
      const who = log.students.find((s) => s.id === studentId)?.firstName ?? 'the student';
      toast(kind === 'merit' ? `+${p.points} merit for ${who}${notify ? ' · family notified' : ''}` : `Demerit recorded for ${who}${notify ? ' · family notified' : ''}`);
      setNote('');
      setError('');
    } catch (e) {
      setError(errorText(e));
      toast(errorText(e), 'danger');
    }
  };

  return (
    <>
      <PageHead
        title="Merits & discipline"
        sub="Recognise effort and record behaviour notes for students in your classes. Families are told straight away when you choose to notify them."
        spec="Teaching · Discipline points"
      />

      <div className="stats">
        <Stat icon={ThumbsUp} value={sum(merits)} label="Merit points this term" tone="success" foot={`${merits.length} awards`} />
        <Stat icon={ThumbsDown} value={sum(demerits)} label="Demerit points this term" tone={demerits.length ? 'warning' : undefined} foot={`${demerits.length} notes`} />
        <Stat icon={BellRing} value={notified} label="Families notified" foot={`of ${log.points.length} entries`} />
      </div>

      <div className="grid-main">
        <Card>
          <CardHeader icon={ChartBar} title="Class totals" sub="Merit and demerit points per class this term" />
          {log.classes.length === 0 ? (
            <p className="small muted">No classes to show.</p>
          ) : (
            <div className="tb-class-bars">
              {log.classes.map((c) => (
                <div key={c.classId} className="tb-class-row">
                  <strong>{c.classId}</strong>
                  <div className="tb-bars">
                    <div className="tb-bar" data-kind="merit" role="img" aria-label={`Class ${c.classId}: ${c.merits} merit points`}>
                      <span><i style={{ width: `${(c.merits / top) * 100}%` }} /></span><b>+{c.merits}</b>
                    </div>
                    <div className="tb-bar" data-kind="demerit" role="img" aria-label={`Class ${c.classId}: ${c.demerits} demerit points`}>
                      <span><i style={{ width: `${(c.demerits / top) * 100}%` }} /></span><b>−{c.demerits}</b>
                    </div>
                  </div>
                </div>
              ))}
              <div className="legend">
                <span><i style={{ background: 'var(--color-brand)' }} />Merits</span>
                <span><i style={{ background: 'var(--color-warning-solid)' }} />Demerits</span>
              </div>
            </div>
          )}
          {cats_.length > 0 && (
            <>
              <p className="tb-section-title" style={{ marginBlockStart: 22 }}>Most used categories</p>
              <div className="lrows">
                {cats_.slice(0, 5).map((c) => (
                  <ListRow key={c.key} icon={c.kind === 'merit' ? ThumbsUp : ThumbsDown} tone={c.kind === 'merit' ? undefined : 'warning'} title={c.category} sub={`${c.count} ${c.count === 1 ? 'entry' : 'entries'} · ${c.kind}`} value={`${c.kind === 'merit' ? '+' : '−'}${c.points}`} />
                ))}
              </div>
            </>
          )}
          <p className="tb-note" style={{ marginBlockStart: 16 }}><ShieldCheck size={14} aria-hidden />Individual students are not ranked. Only class totals are shown.</p>
        </Card>

        <Card>
          <CardHeader icon={Award} title="Award points" />
          <form className="tb-form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <SelectField label="Student" value={studentId} onChange={(e) => { setStudentId(e.target.value); setError(''); }} options={log.students.map((s) => ({ value: s.id, label: `${s.name} · ${s.classId}` }))} />
            <div>
              <span className="field-label" id="tb-kind">Type</span>
              <Segmented label="Type" value={kind} onChange={switchKind} options={[{ value: 'merit', label: 'Merit' }, { value: 'demerit', label: 'Demerit' }]} />
            </div>
            <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={cats} />
            <div>
              <span className="field-label">Points</span>
              <Segmented label="Points" value={points} onChange={setPoints} options={['1', '2', '3'].map((v) => ({ value: v, label: v }))} />
            </div>
            <TextArea
              label={kind === 'demerit' ? 'What happened (required)' : 'Note (optional)'}
              value={note}
              onChange={(e) => { setNote(e.target.value); setError(''); }}
              rows={3}
              error={error}
              required={kind === 'demerit'}
              placeholder={kind === 'demerit' ? 'Describe what happened, factually.' : 'What did they do well?'}
            />
            <Switch label="Notify family" hint="Sends a notification to verified guardians" checked={notify} onChange={setNotify} />
            <Button type="submit" icon={kind === 'merit' ? ThumbsUp : ThumbsDown} disabled={!studentId || (kind === 'demerit' && note.trim().length < 10)}>
              {kind === 'merit' ? `Award +${points} merit` : `Record demerit`}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="card-flush table-card">
        <div className="table-toolbar">
          <h2 className="card-title row" style={{ gap: 10 }}><span className="card-icon" aria-hidden><ListChecks size={18} /></span>Log</h2>
          <Segmented label="Filter log" value={filter} onChange={setFilter} options={[{ value: 'all', label: `All (${log.points.length})` }, { value: 'merit', label: `Merits (${merits.length})` }, { value: 'demerit', label: `Demerits (${demerits.length})` }]} />
        </div>
        <DataTable
          caption="Merits and discipline log"
          rows={rows}
          empty={<EmptyState icon={ListChecks} title="No entries">Nothing recorded for this filter yet.</EmptyState>}
          columns={[
            { key: 'd', label: 'Date', render: (p) => <span className="tb-muted-cell" title={formatDateTime(p.at)}>{formatDate(p.at)}</span> },
            { key: 's', label: 'Student', render: (p) => <span className="tb-who"><Avatar initials={p.student.initials} /><span><strong>{p.student.name}</strong><small>{p.student.classId}</small></span></span> },
            { key: 'k', label: 'Type', render: (p) => <Chip tone={p.kind === 'merit' ? 'success' : 'warning'}>{p.kind === 'merit' ? 'Merit' : 'Demerit'}</Chip> },
            { key: 'c', label: 'Category', render: (p) => <span style={{ whiteSpace: 'nowrap' }}>{p.category}</span> },
            { key: 'p', label: 'Points', align: 'end', render: (p) => <span className="tb-score">{p.kind === 'merit' ? '+' : '−'}{p.points}</span> },
            { key: 'n', label: 'Note · by', render: (p) => <span style={{ display: 'block', minWidth: 0 }}><span className="tb-note-cell" title={p.note}>{p.note || '—'}</span><span className="tb-muted-cell" style={{ fontSize: 12 }}>{p.by}</span></span> },
            { key: 'f', label: 'Family', align: 'end', render: (p) => (p.parentNotified ? <BellRing size={16} className="tb-icon-ok" aria-label="Family notified" /> : <BellOff size={16} className="tb-icon-off" aria-label="Family not notified" />) },
          ]}
        />
      </Card>

      <PageFoot />
    </>
  );
}
