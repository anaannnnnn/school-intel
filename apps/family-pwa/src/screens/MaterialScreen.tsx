import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Clock, MessageCircleQuestion, PenLine, Play, Sparkles, UserRound } from 'lucide-react';
import { Button, Callout, Card, EmptyState, Segmented, errorText, formatDate } from '@school-intel/ui';
import { AI_LABEL, learn, useDb } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { AiNote } from '../kit';
import { KIND, usePractice } from './Learn';
import '../student-c1.css';

type Mode = 'original' | 'cards' | 'simple';

const paragraphs = (text: string) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export function MaterialScreen() {
  const { id = '' } = useParams();
  const { actor, child } = useFamily();
  useDb();
  const navigate = useNavigate();
  const { start, busy, canPractise } = usePractice();
  const [mode, setMode] = useState<Mode>('original');
  if (!child) return null;

  let data: ReturnType<typeof learn.material>;
  try {
    data = learn.material(actor, child.id, id);
  } catch (e) {
    return (
      <>
        <PageHeader title="Material" back="/learn" />
        <EmptyState icon={BookOpen} title="Material not available">{errorText(e)}</EmptyState>
      </>
    );
  }

  const { material: m, subject, topic, teacher } = data;
  const kind = KIND[m.kind];
  const KindIcon = kind.icon;
  const aiAllowed = child.yearGroup >= 7;

  let assisted: string | undefined;
  let assistError: string | undefined;
  if (mode !== 'original' && aiAllowed) {
    try {
      assisted = learn.materialAssist(actor, child.id, m.id, mode);
    } catch (e) {
      assistError = errorText(e);
    }
  }

  const prefill = `I’m reading “${m.title}” and I’m stuck on `;
  const askLink = `/ask?subject=${subject.id}&q=${encodeURIComponent(prefill)}`;

  return (
    <>
      <PageHeader eyebrow={`${subject.name}${topic ? ` · ${topic.name}` : ''}`} title={<span dir="auto">{m.title}</span>} back />

      <div className="c1-meta">
        <span><KindIcon size={15} aria-hidden /> {kind.label}</span>
        <span><Clock size={15} aria-hidden /> {m.minutes} min {kind.verb}</span>
        <span><UserRound size={15} aria-hidden /> {teacher}</span>
        <span>Updated {formatDate(m.updatedAt)}</span>
      </div>

      {m.kind === 'video' && (
        <div className="c1-video">
          <span className="c1-play" aria-hidden><Play size={22} /></span>
          <span>
            <strong>Watch in class</strong>
            <small>Videos play on the school learning platform. The summary is below.</small>
          </span>
        </div>
      )}

      {aiAllowed && (
        <div className="c1-modes">
        <Segmented<Mode>
          label="How to show this material"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'original', label: 'Original' },
            { value: 'cards', label: 'Revision cards' },
            { value: 'simple', label: 'Simpler' },
          ]}
        />
        </div>
      )}

      <Card>
        {mode !== 'original' && (
          <div className="c1-ai-head">
            <span className="row" style={{ gap: 8 }}>
              <span className="ai-badge"><Sparkles size={11} aria-hidden /> AI</span>
              <strong className="small">{AI_LABEL} · {mode === 'cards' ? 'Revision cards' : 'Simpler version'}</strong>
            </span>
          </div>
        )}
        {mode === 'original' || !assisted ? (
          assistError ? (
            <Callout tone="warning">{assistError}</Callout>
          ) : (
            <div className="reader" dir="auto">
              {paragraphs(m.body).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )
        ) : mode === 'cards' ? (
          <ol className="c1-cards" aria-label="Revision cards">
            {paragraphs(assisted).map((c, i) => (
              <li key={i} dir="auto">
                <b aria-hidden>{i + 1}</b>
                <span>{c.replace(/^Card \d+:\s*/, '')}</span>
              </li>
            ))}
          </ol>
        ) : (
          <SimpleView text={assisted} />
        )}
      </Card>

      {mode !== 'original' && (
        <>
          <p className="small muted">Made from your teacher’s notes when you asked. If anything looks different from the original, trust the original.</p>
          <AiNote />
        </>
      )}

      <div className={canPractise && topic ? 'c1-btn-row' : 'stack-sm'}>
        {aiAllowed && actor.kind === 'student' && (
          <Button variant="secondary" icon={MessageCircleQuestion} onClick={() => navigate(askLink)}>Ask about this</Button>
        )}
        {canPractise && topic && (
          <Button variant="brand" icon={PenLine} busy={busy === topic.id} onClick={() => start(topic.id)}>Practise topic</Button>
        )}
      </div>
    </>
  );
}

function SimpleView({ text }: { text: string }) {
  const parts = paragraphs(text);
  const last = parts[parts.length - 1] ?? '';
  const hasKeywords = last.startsWith('Key words:');
  const body = hasKeywords ? parts.slice(0, -1) : parts;
  const words = hasKeywords
    ? last
        .replace(/^Key words:\s*/, '')
        .replace(/\.$/, '')
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean)
    : [];
  return (
    <>
      <div className="reader" dir="auto">
        {body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {words.length > 0 && (
        <>
          <p className="small muted" style={{ marginBlockStart: 16, fontWeight: 700 }}>Key words</p>
          <div className="c1-keywords" style={{ marginBlockStart: 6 }}>
            {words.map((w) => <span key={w} dir="auto">{w}</span>)}
          </div>
        </>
      )}
    </>
  );
}
