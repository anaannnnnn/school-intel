import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, Download, Grid3x3, Info } from 'lucide-react';
import { Callout, Card, CardHeader, Chip, EmptyState, Segmented, formatDate } from '@school-intel/ui';
import { teach, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { Heat, PageFoot, PageHead, Stat, SubjectDot } from '../ui';
import '../teaching-b.css';

type Book = ReturnType<typeof teach.gradebook>;
type Cell = Book['rows'][number]['cells'][number];

const KIND: Record<string, string> = { quiz: 'Quiz', test: 'Test', written: 'Written' };
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((n, x) => n + x, 0) / xs.length) : undefined);

function CellView({ c, label }: { c: Cell; label: string }) {
  if (c.state === 'scored') return <Heat pct={c.pct} label={`${label}: ${c.pct}%`} />;
  if (c.state === 'to-mark') return <Chip tone="warning" dot={false}>To mark</Chip>;
  return <span className="tb-empty-cell" aria-label={`${label}: not submitted`}>—</span>;
}

function exportCsv(book: Book) {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = ['Student', 'SIS', ...book.columns.map((c) => `${c.title} (${KIND[c.kind] ?? c.kind})`), 'Average %'];
  const lines = book.rows.map((r) => [
    r.student.name,
    r.student.sisId,
    ...r.cells.map((c) => (c.state === 'scored' ? String(c.pct) : c.state === 'to-mark' ? 'To mark' : '')),
    r.average === undefined ? '' : String(r.average),
  ]);
  const csv = [head, ...lines].map((l) => l.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `gradebook-${book.subject.short.toLowerCase()}-${book.subject.classId}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Gradebook({ actor }: { actor: Actor }) {
  useDb();
  const visible = teach.subjectsVisible(actor);
  const own = visible.filter((s) => s.teacherId === actor.id);
  const [subjectId, setSubjectId] = useState((own[0] ?? visible[0])?.id ?? '');

  if (!visible.length) {
    return (
      <>
        <PageHead title="Gradebook" />
        <Card><EmptyState icon={Grid3x3} title="No subjects to show">You do not teach or tutor a class with subjects yet.</EmptyState></Card>
      </>
    );
  }

  const book = teach.gradebook(actor, subjectId);
  const colAvg = book.columns.map((_, i) => avg(book.rows.map((r) => r.cells[i]).filter((c): c is Extract<Cell, { state: 'scored' }> => c.state === 'scored').map((c) => c.pct)));
  const classAvg = avg(book.rows.map((r) => r.average).filter((x): x is number => x !== undefined));
  const toMark = book.rows.reduce((n, r) => n + r.cells.filter((c) => c.state === 'to-mark').length, 0);
  const missing = book.rows.reduce((n, r) => n + r.cells.filter((c) => c.state === 'missing').length, 0);
  const topicAvg = book.topics.map((_, i) => avg(book.rows.map((r) => r.mastery[i]).filter((x): x is number => x !== undefined)));
  const weakest = book.topics.map((t, i) => ({ t, v: topicAvg[i] })).filter((x) => x.v !== undefined).sort((a, b) => a.v! - b.v!)[0];

  return (
    <>
      <PageHead
        title="Gradebook"
        sub={`${book.subject.name} · Year ${book.subject.classId} · ${book.editable ? 'your subject' : 'read only'}`}
        spec="Teaching · Gradebook"
        actions={<button type="button" className="btn btn-secondary" onClick={() => exportCsv(book)}><Download size={18} aria-hidden />Export CSV</button>}
      />

      {visible.length > 1 && (
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Segmented
            label="Subject"
            value={subjectId}
            onChange={setSubjectId}
            options={visible.map((s) => ({ value: s.id, label: <span className="tb-subject"><SubjectDot hue={s.hue} />{s.short} {s.classId}</span> }))}
          />
        </div>
      )}

      <div className="stats">
        <Stat value={classAvg === undefined ? '—' : `${classAvg}%`} label="Class average" foot="Across scored work" />
        <Stat value={book.columns.length} label="Assessed pieces" foot="Quizzes, tests and written tasks" />
        <Stat value={toMark} label="Waiting to be marked" tone={toMark ? 'warning' : undefined} to={book.editable && toMark ? '/marking' : undefined} foot={book.editable && toMark ? 'Open marking' : undefined} />
        <Stat value={missing} label="Not submitted" tone={missing ? 'neutral' : undefined} foot="Shown as —" />
      </div>

      <Card className="card-flush table-card">
        <CardHeader icon={Grid3x3} title="Marks" sub="Percentage per piece of work. Written answers count once you confirm them." />
        {book.columns.length === 0 ? (
          <div style={{ padding: '0 22px 22px' }}><p className="muted small">No published quizzes, tests or written tasks in this subject yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="tb-matrix">
              <caption className="sr-only">{book.subject.name} gradebook, students by assessment</caption>
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  {book.columns.map((c) => (
                    <th key={c.id} scope="col">
                      <span className="tb-col">{KIND[c.kind] ?? c.kind} · {formatDate(c.date)}<span>{c.title}</span></span>
                    </th>
                  ))}
                  <th scope="col" className="tb-avg">Average</th>
                </tr>
              </thead>
              <tbody>
                {book.rows.map((r) => (
                  <tr key={r.student.id}>
                    <th scope="row" style={{ fontWeight: 400 }}><Link to={`/students/${r.student.id}`}><strong>{r.student.name}</strong></Link></th>
                    {r.cells.map((c, i) => <td key={book.columns[i].id}><CellView c={c} label={`${r.student.name}, ${book.columns[i].title}`} /></td>)}
                    <td className="tb-avg"><Heat pct={r.average} label={`${r.student.name} average`} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Class average</th>
                  {colAvg.map((v, i) => <td key={book.columns[i].id}><Heat pct={v} /></td>)}
                  <td className="tb-avg"><Heat pct={classAvg} /></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <Legend />
      </Card>

      <Card className="card-flush table-card">
        <CardHeader icon={BookOpenCheck} title="Topic mastery" sub={weakest ? `From marked test and quiz questions · weakest topic: ${weakest.t.name} (${weakest.v}%)` : 'From marked test and quiz questions'} />
        <div className="table-wrap">
          <table className="tb-matrix">
            <caption className="sr-only">Topic mastery, students by topic</caption>
            <thead>
              <tr>
                <th scope="col">Student</th>
                {book.topics.map((t) => <th key={t.id} scope="col"><span className="tb-col">Topic {t.order}<span>{t.name}</span></span></th>)}
              </tr>
            </thead>
            <tbody>
              {book.rows.map((r) => (
                <tr key={r.student.id}>
                  <th scope="row" style={{ fontWeight: 400 }}><strong>{r.student.name}</strong></th>
                  {r.mastery.map((m, i) => <td key={book.topics[i].id}><Heat pct={m} label={`${r.student.name}, ${book.topics[i].name}: ${m === undefined ? 'no data' : `${m}%`}`} /></td>)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Class</th>
                {topicAvg.map((v, i) => <td key={book.topics[i].id}><Heat pct={v} /></td>)}
              </tr>
            </tfoot>
          </table>
        </div>
        <Legend />
      </Card>

      <Callout tone="info" icon={Info}>Grades sync to the SIS when the term report is approved (planned for phase 2). Until then, this gradebook is the working copy.</Callout>
      <PageFoot />
    </>
  );
}

function Legend() {
  return (
    <div className="tb-legend" aria-label="Legend">
      <span><span className="heat" data-band="high">75%+</span>Secure</span>
      <span><span className="heat" data-band="mid">50–74</span>Developing</span>
      <span><span className="heat" data-band="low">&lt;50</span>Needs support</span>
      <span><Chip tone="warning" dot={false}>To mark</Chip>Awaiting your confirmation</span>
      <span><span className="tb-empty-cell">—</span>Not submitted / no data</span>
    </div>
  );
}
