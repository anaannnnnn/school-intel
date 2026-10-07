import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, CircleCheck, FileText, History, Minus, PenLine, Plus, SkipForward, Sparkles } from 'lucide-react';
import { Avatar, Button, Card, CardHeader, Chip, Progress, TextArea, errorText, formatDateTime, useToast } from '@school-intel/ui';
import { AI_DISCLOSURE, teach, useDb } from '@school-intel/api';
import type { Actor, MarkSuggestion } from '@school-intel/contracts';
import { AiTag, PageFoot, PageHead, Restricted, SubjectDot } from '../ui';
import { CONFIDENCE } from './Marking';
import '../teaching-b.css';

const CRIT_COLOURS = ['var(--color-brand)', 'var(--color-accent-2)', 'var(--color-warning-solid)', 'color-mix(in srgb, var(--color-accent-2) 55%, var(--color-danger))', 'var(--color-danger)', 'var(--color-success)'];
const critColour = (i: number) => CRIT_COLOURS[i % CRIT_COLOURS.length];

type Item = ReturnType<typeof teach.markingItem>;

export function MarkItem({ actor }: { actor: Actor }) {
  const { key: raw = '' } = useParams();
  const key = decodeURIComponent(raw);
  useDb();
  let item: Item;
  try {
    item = teach.markingItem(actor, key);
  } catch (e) {
    return <Restricted message={errorText(e)} />;
  }
  return <MarkView key={`${key}:${item.row.status}`} actor={actor} item={item} />;
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Splits the answer into plain text and evidence sentences, each tagged with the criteria that quote it. */
function highlight(text: string, suggestions: MarkSuggestion[], active: string | null): ReactNode[] {
  const ranges: Array<{ start: number; end: number; crits: number[] }> = [];
  suggestions.forEach((s, i) => {
    const ev = s.evidence.trim();
    if (!ev) return;
    const start = text.indexOf(ev);
    if (start < 0) return;
    const end = start + ev.length;
    const same = ranges.find((r) => r.start === start && r.end === end);
    if (same) same.crits.push(i);
    else if (!ranges.some((r) => start < r.end && end > r.start)) ranges.push({ start, end, crits: [i] });
  });
  ranges.sort((a, b) => a.start - b.start);
  const out: ReactNode[] = [];
  let at = 0;
  for (const r of ranges) {
    if (r.start > at) out.push(text.slice(at, r.start));
    const isActive = active !== null && r.crits.some((i) => suggestions[i].criterionId === active);
    const lead = isActive ? r.crits.find((i) => suggestions[i].criterionId === active)! : r.crits[0];
    out.push(
      <mark key={r.start} data-active={isActive} style={{ ['--crit' as string]: critColour(lead) }} title={`Evidence for: ${r.crits.map((i) => suggestions[i].criterion).join('; ')}`}>
        {text.slice(r.start, r.end)}
        {r.crits.map((i) => (
          <span key={i} className="tb-badge" style={{ ['--crit' as string]: critColour(i) }} aria-label={`criterion ${i + 1}`}>{i + 1}</span>
        ))}
      </mark>,
    );
    at = r.end;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

function Stepper({ value, max, onChange, label, disabled }: { value: number; max: number; onChange: (v: number) => void; label: string; disabled?: boolean }) {
  const set = (v: number) => onChange(Math.max(0, Math.min(max, Number.isFinite(v) ? Math.round(v) : 0)));
  return (
    <span className="tb-stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => set(value - 1)} disabled={disabled || value <= 0} aria-label={`Decrease ${label}`}><Minus size={14} aria-hidden /></button>
      <input type="number" inputMode="numeric" min={0} max={max} value={value} disabled={disabled} onChange={(e) => set(Number(e.target.value))} aria-label={label} />
      <button type="button" onClick={() => set(value + 1)} disabled={disabled || value >= max} aria-label={`Increase ${label}`}><Plus size={14} aria-hidden /></button>
      <span className="tb-max" aria-hidden>/ {max}</span>
    </span>
  );
}

function MarkView({ actor, item }: { actor: Actor; item: Item }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { row, suggestions } = item;
  const readOnly = row.status !== 'to-confirm';
  const [awards, setAwards] = useState<Record<string, number>>(() => Object.fromEntries(suggestions.map((s) => [s.criterionId, s.awarded ?? s.suggested])));
  const [feedback, setFeedback] = useState(item.teacherFeedback ?? item.feedback ?? '');
  const [active, setActive] = useState<string | null>(null);

  const queue = teach.markingQueue(actor);
  const peers = queue.filter((x) => x.status === row.status);
  const idx = peers.findIndex((x) => x.key === row.key);
  const prev = idx > 0 ? peers[idx - 1] : undefined;
  const next = idx >= 0 && idx < peers.length - 1 ? peers[idx + 1] : undefined;
  const go = (k: string) => navigate(`/marking/${encodeURIComponent(k)}`);

  const total = suggestions.reduce((n, s) => n + (awards[s.criterionId] ?? 0), 0);
  const aiTotal = suggestions.reduce((n, s) => n + s.suggested, 0);
  const max = suggestions.reduce((n, s) => n + s.max, 0);
  const changed = suggestions.filter((s) => awards[s.criterionId] !== s.suggested).length;
  const words = wordCount(item.text);
  const body = useMemo(() => highlight(item.text, suggestions, active), [item.text, suggestions, active]);
  const conf = CONFIDENCE[row.confidence];

  const confirm = () => {
    // Work out where to go before the item leaves the queue.
    const after = peers.slice(idx + 1).find((x) => x.status === 'to-confirm') ?? peers.find((x) => x.status === 'to-confirm' && x.key !== row.key);
    try {
      teach.confirmMarks(actor, row.key, awards, feedback);
      toast(changed ? `Marks confirmed · ${changed} changed from the AI suggestion` : `Marks confirmed · ${total} / ${max}`);
      navigate(after ? `/marking/${encodeURIComponent(after.key)}` : '/marking');
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  return (
    <>
      <PageHead
        title={<span className="row" style={{ gap: 14 }}><Avatar initials={row.student.initials} size="lg" />{row.student.name}</span>}
        sub={<span className="row wrap" style={{ gap: 8 }}><SubjectDot hue={row.subject.hue} />{row.subject.name} · {row.title} · submitted {formatDateTime(row.submittedAt)}</span>}
        spec="Teaching · AI-assisted marking"
        actions={
          <div className="tb-pager">
            <Link to="/marking" className="btn btn-secondary btn-sm"><ArrowLeft size={16} aria-hidden className="flip-rtl" />Queue</Link>
            <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={!prev} onClick={() => prev && go(prev.key)} aria-label="Previous answer">Prev</Button>
            <span className="tb-pos" aria-live="polite">{idx + 1} of {peers.length}{readOnly ? (row.status === 'confirmed' ? ' confirmed' : ' released') : ' to confirm'}</span>
            <Button variant="secondary" size="sm" disabled={!next} onClick={() => next && go(next.key)} aria-label="Next answer">Next<ChevronRight size={16} aria-hidden /></Button>
          </div>
        }
      />

      <div className="tb-mark-layout">
        <div className="stack">
          <Card>
            <CardHeader icon={FileText} title={row.ref.kind === 'test' ? 'Question' : 'Task'} sub={row.ref.kind === 'test' ? `${row.title} · short answer · ${max} marks` : `Written task · ${max} marks`} />
            <p className="tb-prompt">{item.prompt}</p>
          </Card>

          <Card>
            <CardHeader icon={PenLine} title="Student’s answer" sub="Underlined sentences are the evidence the AI quoted. Hover or focus a criterion to find its sentence." />
            <div className="tb-answer" data-dim={active !== null} aria-label="Student answer with evidence highlighted">{body}</div>
            <div className="tb-words" style={{ marginBlockStart: 12 }}>
              <span className="mono">{words} words</span>
              {item.minWords > 0 && (
                <>
                  <Progress value={(words / item.minWords) * 100} tone={words < item.minWords ? 'warning' : undefined} label={`${words} of ${item.minWords} minimum words`} />
                  <span>{words >= item.minWords ? `Meets the ${item.minWords}-word minimum` : `Below the ${item.minWords}-word minimum`}</span>
                </>
              )}
            </div>
          </Card>

          {item.modelAnswer && (
            <details className="tb-details card" style={{ padding: 0 }}>
              <summary><ChevronRight size={16} aria-hidden className="flip-rtl" />Model answer</summary>
              <div>{item.modelAnswer}</div>
            </details>
          )}
        </div>

        <aside className="tb-mark-side">
          <Card className="ai-panel">
            <CardHeader
              icon={Sparkles}
              title={readOnly ? 'Confirmed marks' : 'Suggested marks'}
              sub={<span className="row wrap" style={{ gap: 6, marginBlockStart: 4 }}><AiTag>AI suggestion</AiTag><Chip tone={conf.tone}>{conf.label}</Chip></span>}
            />
            <p className="small muted" style={{ marginBlockStart: -6, marginBlockEnd: 14 }}>{AI_DISCLOSURE}</p>

            <div className="tb-crits">
              {suggestions.map((s, i) => {
                const v = awards[s.criterionId] ?? 0;
                const diff = v !== s.suggested;
                return (
                  <div
                    key={s.criterionId}
                    className="tb-crit"
                    data-active={active === s.criterionId}
                    style={{ ['--crit' as string]: critColour(i) }}
                    onMouseEnter={() => setActive(s.criterionId)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(s.criterionId)}
                    onBlur={() => setActive(null)}
                  >
                    <span className="tb-crit-name"><span className="tb-badge" aria-hidden>{i + 1}</span>{s.criterion}</span>
                    <span className="tb-score">{v}<small> / {s.max}</small></span>
                    <span className="tb-crit-why">{s.rationale}</span>
                    <blockquote className="tb-quote" data-empty={!s.evidence}>{s.evidence ? `“${s.evidence}”` : 'No supporting sentence found.'}</blockquote>
                    <div className="tb-crit-foot">
                      <span className="tb-suggest">AI suggested <b>{s.suggested}</b> {diff && <span className="tb-changed"><History size={11} aria-hidden />Changed from AI</span>}</span>
                      {readOnly ? (
                        <span className="tb-suggest">Your mark <b>{v}</b></span>
                      ) : (
                        <Stepper value={v} max={s.max} label={`Mark for ${s.criterion}`} onChange={(n) => setAwards((a) => ({ ...a, [s.criterionId]: n }))} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="tb-total" style={{ marginBlock: 16 }}>
              <span>
                <strong style={{ display: 'block' }}>{readOnly ? 'Confirmed total' : 'Your total'}</strong>
                <small>AI suggested {aiTotal} / {max}{changed ? ` · ${changed} criterion${changed === 1 ? '' : 'a'} changed` : ''}</small>
              </span>
              <span className="mono" aria-live="polite">{total} / {max}</span>
            </div>

            {readOnly ? (
              <div className="stack-sm">
                <div className="tb-confirmed"><CircleCheck size={16} aria-hidden />{row.status === 'released' ? 'Confirmed and released to the student' : 'Confirmed · release from the Marking page when ready'}</div>
                {feedback && (
                  <>
                    <p className="tb-section-title" style={{ marginBlockStart: 8, marginBlockEnd: 0 }}>Feedback</p>
                    <p className="small">{feedback}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="stack">
                <TextArea
                  label="Feedback to the student"
                  hint={item.feedback ? 'Drafted by AI from the rubric. Edit before confirming.' : 'Optional. Shown with the result once released.'}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
                <div className="row wrap">
                  <Button icon={CircleCheck} onClick={confirm}>Confirm marks</Button>
                  <Button variant="secondary" icon={SkipForward} disabled={!next} onClick={() => next && go(next.key)}>Skip</Button>
                </div>
                <p className="tb-note">Confirming records your marks{changed ? ` and the ${changed} change${changed === 1 ? '' : 's'} from the AI suggestion` : ''} in the audit log. Students see nothing until you release.</p>
              </div>
            )}
          </Card>
        </aside>
      </div>

      <PageFoot />
    </>
  );
}

