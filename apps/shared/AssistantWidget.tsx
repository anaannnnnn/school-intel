import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { assistant } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import './shared.css';

interface Turn {
  from: 'me' | 'bot';
  text: string;
  bullets?: string[];
  materials?: Array<{ id: string; title: string; kind: string; subject: string }>;
}

const storeKey = (a: Actor) => `school-intel:assistant:${a.kind}:${a.id}`;
const load = (a: Actor): Turn[] => {
  try {
    return JSON.parse(sessionStorage.getItem(storeKey(a)) ?? '[]') as Turn[];
  } catch {
    return [];
  }
};

/** Floating assistant for every role. `materialHref` builds the link for a study resource in this app. */
export function AssistantWidget({ actor, materialHref }: { actor: Actor; materialHref: (id: string) => string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [turns, setTurns] = useState<Turn[]>(() => load(actor));
  const [chips, setChips] = useState<string[]>(() => assistant.suggestionsFor(actor));
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(storeKey(actor), JSON.stringify(turns.slice(-30)));
    } catch {
      /* storage full or unavailable: the conversation stays in memory */
    }
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, actor, open]);

  const ask = (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setText('');
    setBusy(true);
    setTurns((t) => [...t, { from: 'me', text: question }]);
    window.setTimeout(() => {
      const r = assistant.ask(actor, question);
      setTurns((t) => [...t, { from: 'bot', text: r.text, bullets: r.bullets, materials: r.materials }]);
      setChips(r.followUps.length ? r.followUps : assistant.suggestionsFor(actor));
      setBusy(false);
    }, 420);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
  };

  return (
    <>
      <motion.button type="button" className="ai-fab" aria-label={open ? 'Close assistant' : 'Open Horizon Assistant'} aria-expanded={open} onClick={() => setOpen((o) => !o)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.6 }}>
        {open ? <X size={22} /> : <Sparkles size={22} />}
        {!open && <span className="ai-fab-ring" aria-hidden />}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.section className="ai-panel" role="dialog" aria-label="Horizon Assistant" initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }} transition={{ type: 'spring', stiffness: 360, damping: 30 }}>
            <header>
              <span className="ai-badge" aria-hidden><Bot size={18} /></span>
              <div>
                <strong>Horizon Assistant</strong>
                <small>Answers from your school records · offline, no data leaves this device</small>
              </div>
            </header>
            <div className="ai-log" role="log" aria-live="polite">
              {turns.length === 0 && <p className="ai-hint">Hi! Ask me about attendance, timetable, exams, results or study materials.</p>}
              {turns.map((t, i) => (
                <motion.div key={i} className="ai-turn" data-from={t.from} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <p>{t.text}</p>
                  {t.bullets && <ul>{t.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
                  {t.materials && (
                    <ul className="ai-mats">
                      {t.materials.map((m) => (
                        <li key={m.id}><a href={materialHref(m.id)} onClick={() => setOpen(false)}>{m.title}<small>{m.subject} · {m.kind.replace('-', ' ')}</small></a></li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
              {busy && <div className="ai-turn" data-from="bot"><span className="ai-typing" aria-label="Assistant is typing"><i /><i /><i /></span></div>}
              <div ref={end} />
            </div>
            <div className="ai-chips">
              {chips.slice(0, 4).map((c) => <button key={c} type="button" onClick={() => ask(c)}>{c}</button>)}
            </div>
            <form onSubmit={submit}>
              <label className="sr-only" htmlFor="ai-input">Ask the assistant</label>
              <input id="ai-input" value={text} maxLength={300} placeholder="Ask a question" onChange={(e) => setText(e.target.value)} autoComplete="off" />
              <button type="submit" aria-label="Send" disabled={!text.trim() || busy}><Send size={16} /></button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
