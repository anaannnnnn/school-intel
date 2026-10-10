import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Megaphone, MessageSquarePlus, Search, Send, Users } from 'lucide-react';
import { chat, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import './shared.css';

type Audience = chat.Audience;
const AUDIENCES: Array<{ id: Audience; label: string }> = [
  { id: 'both', label: 'Students and parents' },
  { id: 'students', label: 'Students only' },
  { id: 'parents', label: 'Parents only' },
];

const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export function ChatScreen({ actor }: { actor: Actor }) {
  useDb();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [bulk, setBulk] = useState(false);
  const rooms = chat.rooms(actor);

  return (
    <div className="chat">
      <AnimatePresence mode="wait" initial={false}>
        {roomId ? (
          <Thread key={roomId} actor={actor} roomId={roomId} title={chat.roomName(actor, roomId)} onBack={() => setRoomId(null)} />
        ) : (
          <motion.section key="list" className="chat-list" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
            <header className="chat-head">
              <div>
                <p className="chat-eyebrow">Messages</p>
                <h1>Chat rooms</h1>
              </div>
              <div className="chat-actions">
                {chat.broadcastTargets(actor).length > 0 && (
                  <button type="button" className="chat-btn chat-btn-soft" onClick={() => setBulk(true)}>
                    <Megaphone size={16} aria-hidden /> Message a class
                  </button>
                )}
                <button type="button" className="chat-btn" onClick={() => setPicker(true)}>
                  <MessageSquarePlus size={16} aria-hidden /> New chat
                </button>
              </div>
            </header>
            {rooms.length === 0 && <p className="chat-empty">No conversations yet. Start one with “New chat”.</p>}
            <ul className="chat-rooms" role="list">
              {rooms.map((r, i) => (
                <motion.li key={r.roomId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
                  <button type="button" className="chat-room" onClick={() => setRoomId(r.roomId)}>
                    <span className="chat-avatar" data-kind={r.kind} aria-hidden>{r.kind === 'class' ? <Users size={18} /> : initials(r.title)}</span>
                    <span className="chat-room-text">
                      <strong>{r.title}</strong>
                      <small>{r.last ? `${r.last.fromName.split(' ')[0]}: ${r.last.text}` : r.subtitle}</small>
                    </span>
                    <span className="chat-room-meta">
                      {r.last && <small>{clock(r.last.at)}</small>}
                      {r.unread > 0 && <span className="chat-unread" aria-label={`${r.unread} unread`}>{r.unread}</span>}
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        )}
      </AnimatePresence>
      {picker && <ContactPicker actor={actor} onClose={() => setPicker(false)} onPick={(id) => { setPicker(false); setRoomId(id); }} />}
      {bulk && <BulkSend actor={actor} onClose={() => setBulk(false)} onSent={(id) => { setBulk(false); setRoomId(id); }} />}
    </div>
  );
}

function Thread({ actor, roomId, title, onBack }: { actor: Actor; roomId: string; title: string; onBack: () => void }) {
  const db = useDb();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const msgs = chat.messages(actor, roomId);
  const mine = `${actor.kind}:${actor.id}`;
  const count = msgs.length;

  useEffect(() => {
    chat.markRead(actor, roomId);
  }, [actor, roomId, count]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [count, db.version]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    try {
      chat.send(actor, roomId, text);
      setText('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send.');
    }
  };

  return (
    <motion.section className="chat-thread" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}>
      <header className="chat-thread-head">
        <button type="button" className="chat-icon" onClick={onBack} aria-label="Back to chats"><ArrowLeft size={18} /></button>
        <div>
          <strong>{title}</strong>
          <small>{roomId.startsWith('class:') ? 'Class room · teachers, students and parents' : 'Direct message'}</small>
        </div>
      </header>
      <div className="chat-msgs" role="log" aria-live="polite">
        {msgs.length === 0 && <p className="chat-empty">Say hello to start the conversation.</p>}
        {msgs.map((m) => {
          const own = `${m.fromKind}:${m.fromId}` === mine;
          return (
            <motion.article key={m.id} className="chat-msg" data-own={own || undefined} data-broadcast={m.broadcast ? '' : undefined} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.18 }}>
              {!own && <small className="chat-from">{m.fromName}{m.fromKind === 'staff' ? ' · Teacher' : m.fromKind === 'guardian' ? ' · Parent' : ''}</small>}
              {m.broadcast && <small className="chat-tag"><Megaphone size={12} aria-hidden /> Class announcement · {AUDIENCES.find((a) => a.id === m.broadcast!.audience)?.label}</small>}
              <p>{m.text}</p>
              <small className="chat-time">{clock(m.at)}</small>
            </motion.article>
          );
        })}
        <div ref={end} />
      </div>
      <form className="chat-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="chat-input">Message</label>
        <textarea id="chat-input" rows={1} value={text} maxLength={1000} placeholder="Write a message" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }} />
        <button type="submit" className="chat-send" aria-label="Send" disabled={!text.trim()}><Send size={18} /></button>
      </form>
      {error && <p className="chat-error" role="alert">{error}</p>}
    </motion.section>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <motion.div className="chat-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
      <motion.div className="chat-sheet" role="dialog" aria-modal aria-label={title} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} onClick={(e) => e.stopPropagation()}>
        <header><h2>{title}</h2><button type="button" className="chat-icon" onClick={onClose} aria-label="Close">×</button></header>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ContactPicker({ actor, onClose, onPick }: { actor: Actor; onClose: () => void; onPick: (roomId: string) => void }) {
  const [q, setQ] = useState('');
  const all = useMemo(() => chat.contacts(actor), [actor]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (t ? all.filter((c) => c.name.toLowerCase().includes(t) || c.detail.toLowerCase().includes(t)) : all).slice(0, 60);
  }, [all, q]);
  return (
    <Sheet title="Start a chat" onClose={onClose}>
      <label className="chat-search"><Search size={16} aria-hidden /><span className="sr-only">Search people</span><input autoFocus type="search" placeholder="Name or class" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <ul className="chat-contacts" role="list">
        {list.length === 0 && <li className="chat-empty">Nobody matches.</li>}
        {list.map((c) => (
          <li key={c.key}>
            <button type="button" className="chat-room" onClick={() => onPick(chat.directRoom(actor, c.key))}>
              <span className="chat-avatar" aria-hidden>{initials(c.name)}</span>
              <span className="chat-room-text"><strong>{c.name}</strong><small>{c.detail}</small></span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function BulkSend({ actor, onClose, onSent }: { actor: Actor; onClose: () => void; onSent: (roomId: string) => void }) {
  const targets = chat.broadcastTargets(actor);
  const [classId, setClassId] = useState(targets[0]?.classId ?? '');
  const [audience, setAudience] = useState<Audience>('both');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const picked = targets.find((t) => t.classId === classId);
  return (
    <Sheet title="Message a whole class" onClose={onClose}>
      <form
        className="chat-bulk"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onSent(chat.broadcast(actor, classId, audience, text).roomId);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not send.');
          }
        }}
      >
        <label>Class
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {targets.map((t) => <option key={t.classId} value={t.classId}>{t.label} · {t.students} students</option>)}
          </select>
        </label>
        <fieldset>
          <legend>Send to</legend>
          {AUDIENCES.map((a) => (
            <label key={a.id} className="chat-radio"><input type="radio" name="aud" checked={audience === a.id} onChange={() => setAudience(a.id)} /> {a.label}</label>
          ))}
        </fieldset>
        <label>Message
          <textarea rows={4} value={text} maxLength={1000} placeholder="Write the announcement" onChange={(e) => setText(e.target.value)} />
        </label>
        {error && <p className="chat-error" role="alert">{error}</p>}
        <button type="submit" className="chat-btn" disabled={!text.trim() || !picked}><Megaphone size={16} aria-hidden /> Send to {picked?.label ?? 'class'}</button>
      </form>
    </Sheet>
  );
}
