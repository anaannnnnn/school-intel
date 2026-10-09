import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Library, Presentation, Search, Video, X, type LucideIcon } from 'lucide-react';
import { Button, EmptyState, Progress, errorText, formatDate, useToast } from '@school-intel/ui';
import { className, learn, useDb } from '@school-intel/api';
import type { MaterialKind } from '@school-intel/contracts';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { PRow, Ring, SectionTitle, SUBJECT_ICON, hueStyle, scoreTone } from '../kit';
import '../student-c1.css';

export const KIND: Record<MaterialKind, { label: string; icon: LucideIcon; verb: string }> = {
  notes: { label: 'Notes', icon: BookOpen, verb: 'read' },
  worksheet: { label: 'Worksheet', icon: FileText, verb: 'work' },
  video: { label: 'Video', icon: Video, verb: 'watch' },
  slides: { label: 'Slides', icon: Presentation, verb: 'read' },
};

export function ringColor(pct: number | undefined) {
  const t = scoreTone(pct);
  return t === 'success' ? 'var(--color-success)' : t === 'warning' ? 'var(--color-warning-solid)' : t === 'danger' ? 'var(--color-danger)' : undefined;
}

export function MaterialTile({ kind, hue }: { kind: MaterialKind; hue: number }) {
  const Icon = KIND[kind].icon;
  return (
    <span className="prow-tile" data-hue style={hueStyle(hue)} aria-hidden>
      <Icon size={20} />
    </span>
  );
}

/** Starts a short practice quiz on one topic and opens the player. */
export function usePractice() {
  const { actor } = useFamily();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState<string>();
  const start = (topicId: string) => {
    setBusy(topicId);
    try {
      const at = learn.startTopicPractice(actor, topicId);
      navigate(`/tests/play/${at.id}`);
    } catch (e) {
      toast(errorText(e), 'danger');
      setBusy(undefined);
    }
  };
  return { start, busy, canPractise: actor.kind === 'student' };
}

export function Learn() {
  const { actor, child } = useFamily();
  useDb();
  const [query, setQuery] = useState('');
  const { start, busy, canPractise } = usePractice();
  if (!child) return null;

  const subjects = learn.subjectsFor(actor, child.id);
  if (!subjects.length) {
    return (
      <>
        <PageHeader eyebrow={`${className(child.classId)}`} title="Learn" />
        <EmptyState icon={Library} title="No subjects shared yet">
          When your teachers share notes, videos and worksheets with your class, they will appear here.
        </EmptyState>
      </>
    );
  }

  const details = subjects.map((s) => learn.subjectDetail(actor, child.id, s.id));
  const materials = details.flatMap((d) => d.topics.flatMap((t) => t.materials.map((m) => ({ m, subject: d.subject, topic: t }))));
  const q = query.trim().toLowerCase();
  const results = q ? materials.filter(({ m, topic }) => m.title.toLowerCase().includes(q) || topic.name.toLowerCase().includes(q)) : [];
  const recent = [...materials].sort((a, b) => b.m.updatedAt.localeCompare(a.m.updatedAt)).slice(0, 3);
  const weakest = details
    .flatMap((d) => d.topics.filter((t) => t.score && t.score.pct < 100 && t.practice > 0).map((t) => ({ t, subject: d.subject })))
    .sort((a, b) => a.t.score!.pct - b.t.score!.pct)
    .slice(0, 3);
  const untried = details.flatMap((d) => d.topics.filter((t) => !t.score && t.practice > 0).map((t) => ({ t, subject: d.subject })));
  const practise = [...weakest, ...untried].slice(0, 4);

  return (
    <>
      <PageHeader eyebrow={`${className(child.classId)} · ${subjects.length} subjects`} title="Learn" />

      <div className="c1-search" role="search">
        <Search size={18} aria-hidden />
        <label htmlFor="learn-search" className="sr-only">Search class materials</label>
        <input id="learn-search" className="input" type="search" placeholder="Search notes, videos, worksheets" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
        {query && (
          <button type="button" className="c1-search-clear" aria-label="Clear search" onClick={() => setQuery('')}>
            <X size={16} aria-hidden />
          </button>
        )}
      </div>

      {q ? (
        <section aria-live="polite" className="stack-sm" style={{ gap: 12 }}>
          <SectionTitle>{results.length ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'No results'}</SectionTitle>
          {results.length ? (
            <div className="rows">
              {results.map(({ m, subject, topic }) => (
                <PRow key={m.id} tile={<MaterialTile kind={m.kind} hue={subject.hue} />} title={m.title} sub={`${subject.short} · ${topic.name} · ${m.minutes} min`} to={`/material/${m.id}`} />
              ))}
            </div>
          ) : (
            <p className="muted small">Nothing matches “{query.trim()}”. Try a topic name such as “fractions” or “particles”.</p>
          )}
        </section>
      ) : (
        <>
          <SectionTitle>Your subjects</SectionTitle>
          <div className="subject-grid">
            {subjects.map((s) => {
              const Icon = SUBJECT_ICON[s.id] ?? BookOpen;
              return (
                <Link key={s.id} to={`/learn/${s.id}`} className="subject-tile" style={hueStyle(s.hue)} aria-label={`${s.name}, ${s.teacher}, ${s.topicCount} topics${s.mastery !== undefined ? `, ${s.mastery}% mastery` : ''}`}>
                  <span className="c1-tile-top">
                    <span className="tile-icon" aria-hidden><Icon size={20} /></span>
                    {s.mastery !== undefined && <span className="c1-tile-pct">{s.mastery}%</span>}
                  </span>
                  <span className="c1-tile-text">
                    <strong>{s.short}</strong>
                    <small>{s.teacher}</small>
                    <small>{s.topicCount} topic{s.topicCount === 1 ? '' : 's'} · {s.materialCount} material{s.materialCount === 1 ? '' : 's'}</small>
                  </span>
                  {s.mastery !== undefined ? <Progress value={s.mastery} label={`${s.name} mastery`} /> : <small style={{ marginBlockStart: 'auto' }}>No scores yet</small>}
                </Link>
              );
            })}
          </div>

          {recent.length > 0 && (
            <>
              <SectionTitle>Continue learning</SectionTitle>
              <div className="rows">
                {recent.map(({ m, subject }) => (
                  <PRow key={m.id} tile={<MaterialTile kind={m.kind} hue={subject.hue} />} title={m.title} sub={`${subject.short} · ${KIND[m.kind].label} · ${m.minutes} min · ${formatDate(m.updatedAt)}`} to={`/material/${m.id}`} />
                ))}
              </div>
            </>
          )}

          {canPractise && practise.length > 0 && (
            <>
              <SectionTitle>Practice by topic</SectionTitle>
              <p className="small muted" style={{ marginBlockStart: -4 }}>Your weakest topics first, from your marked quizzes and tests.</p>
              <div className="rows">
                {practise.map(({ t, subject }) => (
                  <div key={t.id} className="c1-action-row">
                    {t.score ? <Ring pct={t.score.pct} size={48} color={ringColor(t.score.pct)} /> : <MaterialTile kind="worksheet" hue={subject.hue} />}
                    <span className="prow-body">
                      <span className="prow-title">{t.name}</span>
                      <span className="prow-sub">{subject.short} · {t.score ? `${t.score.correct} of ${t.score.total} marks` : 'Not tried yet'}</span>
                    </span>
                    <Button size="sm" variant="ghost" className="btn-tonal" busy={busy === t.id} onClick={() => start(t.id)} aria-label={`Practise ${t.name}`}>Practise</Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
