import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUp, BookOpen, Lightbulb, LifeBuoy, Lock, MessageCircleQuestion, Timer, UserRound } from 'lucide-react';
import { Button, Callout, Card, Chip, EmptyState, errorText, formatDate, formatTime, type Tone } from '@school-intel/ui';
import { learn, useDb } from '@school-intel/api';
import type { Doubt } from '@school-intel/contracts';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { AiNote, PRow, SectionTitle, SUBJECT_ICON, SubjectTile, hueStyle } from '../kit';
import '../student-c1.css';

export const DOUBT_STATUS: Record<Doubt['status'], { label: string; tone: Tone }> = {
  'ai-answered': { label: 'Hint given', tone: 'info' },
  escalated: { label: 'With teacher', tone: 'warning' },
  'teacher-answered': { label: 'Teacher replied', tone: 'success' },
  resolved: { label: 'Solved', tone: 'neutral' },
};

const SUGGESTIONS: Record<string, string[]> = {
  'sub-math': ['How do I add 1/3 + 1/4?', 'How do I simplify 18/24?', 'How can I check two fractions are equivalent?'],
  'sub-sci': ['Why does a gas fill its container?', 'What happens to particles when ice melts?', 'Why does temperature stay the same while water boils?'],
  'sub-eng': ['How do I write a strong PEEL paragraph?', 'What counts as evidence in a persuasive paragraph?'],
  'sub-ara': ['How can I remember school vocabulary?', 'How do I read a short Arabic text?'],
};

export function StudyHelper() {
  const { actor, child } = useFamily();
  useDb();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [text, setText] = useState(() => params.get('q') ?? '');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const subjects = child ? learn.subjectsFor(actor, child.id) : [];
  const initial = params.get('subject');
  const [subjectId, setSubjectId] = useState(() => (subjects.some((s) => s.id === initial) ? initial! : subjects[0]?.id ?? ''));
  if (!child) return null;

  const access = learn.doubtAccess(actor);
  const active = learn.activeTest(actor);
  const past = actor.kind === 'student' ? learn.myDoubts(actor) : [];

  const pastList = past.length > 0 && (
    <>
      <SectionTitle>Your questions</SectionTitle>
      <div className="rows">
        {past.map((d) => {
          const st = DOUBT_STATUS[d.status];
          return (
            <PRow
              key={d.id}
              tile={d.subject ? <SubjectTile subjectId={d.subject.id} hue={d.subject.hue} /> : undefined}
              icon={d.subject ? undefined : MessageCircleQuestion}
              title={<span className="c1-clamp2">{d.question}</span>}
              sub={`${d.subject?.short ?? 'General'} · ${formatDate(d.createdAt)}, ${formatTime(d.createdAt)}`}
              end={<Chip tone={st.tone} dot={false}>{st.label}</Chip>}
              to={`/ask/${d.id}`}
              chevron={false}
            />
          );
        })}
      </div>
    </>
  );

  if (!access.allowed) {
    if (active) {
      return (
        <>
          <PageHeader eyebrow="Study helper" title="Ask" />
          <Callout tone="warning" icon={Lock} title="Paused during your test">
            {access.reason} It will be back as soon as you submit.
          </Callout>
          <Button variant="brand" icon={Timer} block onClick={() => navigate(`/tests/play/${active.id}`)}>Back to your test</Button>
          {pastList}
        </>
      );
    }
    return (
      <>
        <PageHeader eyebrow="Study helper" title="Ask" />
        <Card>
          <EmptyState
            icon={Lock}
            title={child.yearGroup < 7 ? 'The study helper starts in Year 7' : 'The study helper is not available'}
            action={
              <div className="stack-sm" style={{ width: '100%', maxWidth: 300 }}>
                <Link to="/help" className="btn btn-brand"><LifeBuoy size={18} aria-hidden /> Get help from a person</Link>
                <Link to="/learn" className="btn btn-secondary"><BookOpen size={18} aria-hidden /> Read your class notes</Link>
              </div>
            }
          >
            {access.reason}
          </EmptyState>
        </Card>
        <p className="small muted" style={{ textAlign: 'center' }}>School rules follow UAE guidance on AI tools for younger students.</p>
      </>
    );
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(undefined);
    if (text.trim().length < 8) {
      setError('Tell the helper a little more about what you are stuck on.');
      box.current?.focus();
      return;
    }
    setBusy(true);
    // Short pause so the hand-off to the helper feels deliberate.
    setTimeout(() => {
      try {
        const d = learn.askDoubt(actor, { subjectId, question: text });
        navigate(`/ask/${d.id}`);
      } catch (err) {
        setError(errorText(err));
        setBusy(false);
      }
    }, 450);
  };

  const suggestions = SUGGESTIONS[subjectId] ?? [];

  return (
    <>
      <PageHeader eyebrow="AI study helper" title="Ask" />

      <section className="hero-card" aria-labelledby="helper-intro">
        <h2 id="helper-intro" style={{ position: 'relative', zIndex: 1 }}>Stuck? Get a hint.</h2>
        <ul className="c1-rules">
          <li><span aria-hidden><Lightbulb size={17} /></span><span>Hints that guide you, not the final answer</span></li>
          <li><span aria-hidden><BookOpen size={17} /></span><span>Uses your teachers’ class notes</span></li>
          <li><span aria-hidden><UserRound size={17} /></span><span>Your teacher sees questions you send them</span></li>
        </ul>
      </section>

      <form className="card c1-ask" onSubmit={submit} aria-label="Ask the study helper">
        <div className="c1-subjects" role="group" aria-label="Subject">
          {subjects.map((s) => {
            const Icon = SUBJECT_ICON[s.id] ?? BookOpen;
            return (
              <button key={s.id} type="button" aria-pressed={s.id === subjectId} style={hueStyle(s.hue)} onClick={() => setSubjectId(s.id)}>
                <Icon size={16} aria-hidden /> {s.short}
              </button>
            );
          })}
        </div>
        <label htmlFor="doubt" className="sr-only">What are you stuck on?</label>
        <textarea
          id="doubt"
          ref={box}
          className="textarea"
          placeholder="What are you stuck on? Say what you have tried so far."
          value={text}
          maxLength={600}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? 'doubt-error' : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
        />
        {error && <span id="doubt-error" className="field-error" role="alert">{error}</span>}
        <div className="c1-ask-foot">
          <span className="small muted">Don’t share passwords or personal details.</span>
          <Button type="submit" variant="brand" icon={ArrowUp} busy={busy} disabled={!text.trim()}>Get a hint</Button>
        </div>
      </form>

      {suggestions.length > 0 && (
        <div className="suggestions c1-suggestions" role="group" aria-label="Example questions">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setText(s);
                setError(undefined);
                box.current?.focus();
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {pastList}

      <AiNote />
    </>
  );
}
