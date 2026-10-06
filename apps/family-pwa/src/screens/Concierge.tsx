import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, FileCheck2, History, Inbox, ShieldCheck } from 'lucide-react';
import { Button, Callout, formatDate, useToast } from '@school-intel/ui';
import { family } from '@school-intel/api';
import type { ConciergeAnswer } from '@school-intel/contracts';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { NoChildren } from './NoChildren';

type Msg = { id: number; from: 'me' | 'school'; text: string; answer?: ConciergeAnswer; question?: string };

export function Concierge() {
  const { actor, child } = useFamily();
  const navigate = useNavigate();
  const toast = useToast();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const [thinking, setThinking] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, thinking]);

  if (!child) return <NoChildren />;

  const suggestions = [
    `What does ${child.firstName} need for sports day?`,
    'When is October half term?',
    `Can ${child.firstName} leave before sports day finishes?`,
    'Is the canteen nut-free?',
  ];

  const ask = (question: string) => {
    const text = question.trim();
    if (!text) return;
    setQ('');
    setMsgs((m) => [...m, { id: Date.now(), from: 'me', text }]);
    setThinking(true);
    setTimeout(() => {
      const answer = family.askConcierge(actor, child.id, text);
      setMsgs((m) => [...m, { id: Date.now() + 1, from: 'school', text: answer.text, answer, question: text }]);
      setThinking(false);
    }, 650);
  };

  const sendToOffice = (question: string) => {
    const req = family.createRequest(actor, {
      type: 'question',
      studentId: child.id,
      subject: question.length > 70 ? `${question.slice(0, 67)}…` : question,
      details: { Question: question },
      message: question,
    });
    toast(`Sent to the school office · ${req.id}`);
    navigate(`/requests/${req.id}`);
  };

  return (
    <>
      <PageHeader eyebrow="Approved school information" title="Ask the school" />
      <ChildSwitcher />
      <Callout tone="neutral" icon={ShieldCheck}>
        Answers come only from current, approved school documents and always show their source. Personal arrangements go to a member of staff.
      </Callout>

      <div className="chat" aria-live="polite">
        {msgs.length === 0 && (
          <div className="bubble bubble-school">
            Hello! Ask about events, uniform, the calendar or school arrangements for {child.firstName}. If I can’t confirm an answer, I’ll help you send it to the office.
          </div>
        )}
        {msgs.map((m) =>
          m.from === 'me' ? (
            <div key={m.id} className="bubble bubble-me">{m.text}</div>
          ) : (
            <div key={m.id} className="bubble bubble-school">
              {m.answer?.kind === 'historical' && <p className="eyebrow" style={{ color: 'var(--color-warning-ink)', marginBlockEnd: 6 }}>Historical information · no longer current</p>}
              <p>{m.text}</p>
              {m.answer?.circular && (
                <div className="bubble-source">
                  <span className="row" style={{ gap: 6, color: 'var(--color-brand-ink)', fontWeight: 600 }}>
                    {m.answer.kind === 'historical' ? <History size={13} aria-hidden /> : <FileCheck2 size={13} aria-hidden />}
                    Source: {m.answer.circular.title}, {formatDate(m.answer.circular.issued)}
                  </span>
                  <span>
                    {m.answer.kind === 'historical'
                      ? `Expired ${formatDate(m.answer.circular.validUntil, { day: 'numeric', month: 'short', year: 'numeric' })}. Ask the office for current arrangements.`
                      : `Valid until ${formatDate(m.answer.circular.validUntil, { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </span>
                </div>
              )}
              {(m.answer?.kind === 'personal' || m.answer?.kind === 'unknown' || m.answer?.kind === 'historical') && (
                <div className="stack-sm" style={{ marginBlockStart: 12 }}>
                  {m.answer.kind === 'personal' && /collect|pick|leave/i.test(m.question ?? '') && (
                    <Button size="sm" variant="brand" onClick={() => navigate('/requests/new/early-collection')}>Request early collection</Button>
                  )}
                  <Button size="sm" variant="secondary" icon={Inbox} onClick={() => sendToOffice(m.question ?? '')}>Send question to the office</Button>
                </div>
              )}
            </div>
          ),
        )}
        {thinking && (
          <div className="bubble bubble-school muted small" aria-label="Searching approved documents">Searching approved documents…</div>
        )}
        <div ref={end} />
      </div>

      {msgs.length === 0 && (
        <div className="suggestions" aria-label="Suggested questions">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => ask(s)}>{s}</button>
          ))}
        </div>
      )}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <label htmlFor="ask" className="sr-only">Your question</label>
        <input id="ask" className="input" placeholder="Ask a question…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        <button type="submit" className="btn btn-brand btn-icon" aria-label="Send" disabled={!q.trim() || thinking}>
          <ArrowUp size={18} aria-hidden />
        </button>
      </form>
    </>
  );
}
