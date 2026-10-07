import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CalendarClock, ChevronDown, ChevronLeft, MessageCircleQuestion, PenLine } from 'lucide-react';
import { Button, Chip, EmptyState, formatDate } from '@school-intel/ui';
import { DEMO_DATE, learn, useDb } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { PRow, Ring, SectionTitle, SUBJECT_ICON, daysLabel, hueStyle } from '../kit';
import { KIND, MaterialTile, ringColor, usePractice } from './Learn';
import '../student-c1.css';

export function SubjectScreen() {
  const { subjectId = '' } = useParams();
  const navigate = useNavigate();
  const { actor, child } = useFamily();
  useDb();
  const { start, busy, canPractise } = usePractice();
  const [open, setOpen] = useState<Set<string> | null>(null);
  if (!child) return null;

  let detail: ReturnType<typeof learn.subjectDetail>;
  try {
    detail = learn.subjectDetail(actor, child.id, subjectId);
  } catch {
    return (
      <>
        <PageHeader title="Subject" back="/learn" />
        <EmptyState icon={BookOpen} title="Subject not found">This subject is not on your timetable.</EmptyState>
      </>
    );
  }

  const { subject, topics } = detail;
  const Icon = SUBJECT_ICON[subject.id] ?? BookOpen;
  // Open the weakest scored topic by default, otherwise the first one.
  const weakest = [...topics].filter((t) => t.score).sort((a, b) => a.score!.pct - b.score!.pct)[0] ?? topics[0];
  const expanded = open ?? new Set(weakest ? [weakest.id] : []);
  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };
  const examDays = subject.nextExam ? Math.round((Date.parse(`${subject.nextExam.date.slice(0, 10)}T00:00:00Z`) - Date.parse(`${DEMO_DATE}T00:00:00Z`)) / 86400000) : undefined;
  const aiAllowed = actor.kind === 'student' && child.yearGroup >= 7;

  return (
    <>
      <button type="button" className="back" onClick={() => navigate('/learn')}>
        <ChevronLeft size={18} aria-hidden className="flip-rtl" /> Learn
      </button>

      <section className="c1-subject-hero" style={hueStyle(subject.hue)} aria-labelledby="subject-title">
        <div className="row" style={{ gap: 14, alignItems: 'center' }}>
          <span className="tile-icon" aria-hidden><Icon size={26} /></span>
          <div className="grow" style={{ minWidth: 0 }}>
            <h1 id="subject-title">{subject.name}</h1>
            <p className="small muted" style={{ fontWeight: 600 }}>{subject.teacher} · {subject.topicCount} topics</p>
          </div>
          {subject.mastery !== undefined && <Ring pct={subject.mastery} size={60} />}
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          {subject.nextExam ? (
            <Chip dot={false}>
              <CalendarClock size={12} aria-hidden style={{ verticalAlign: '-2px', marginInlineEnd: 4 }} />
              {subject.nextExam.title} · {examDays !== undefined ? daysLabel(examDays) : ''} · {formatDate(subject.nextExam.date)}
            </Chip>
          ) : (
            <Chip dot={false}>No exams scheduled</Chip>
          )}
          <Chip dot={false}>{subject.materialCount} material{subject.materialCount === 1 ? '' : 's'}</Chip>
        </div>
      </section>

      {aiAllowed && (
        <PRow icon={MessageCircleQuestion} title={`Stuck on ${subject.short}?`} sub="Ask the study helper for a hint" to={`/ask?subject=${subject.id}`} />
      )}

      <SectionTitle>Topics</SectionTitle>
      <div className="stack" style={{ gap: 12 }}>
        {topics.map((t) => {
          const isOpen = expanded.has(t.id);
          const panelId = `topic-${t.id}`;
          const count = Math.min(5, t.practice);
          return (
            <section key={t.id} className="card c1-topic" style={hueStyle(subject.hue)}>
              <button type="button" className="c1-topic-head" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(t.id)}>
                <span className="c1-topic-num" aria-hidden>{t.order}</span>
                <span className="prow-body">
                  <span className="prow-title">{t.name}</span>
                  <span className="prow-sub">
                    {t.materials.length} material{t.materials.length === 1 ? '' : 's'} · {t.score ? `${t.score.correct}/${t.score.total} marks so far` : 'not tested yet'}
                  </span>
                </span>
                {t.score ? <Ring pct={t.score.pct} size={50} color={ringColor(t.score.pct)} /> : <Chip dot={false}>New</Chip>}
                <ChevronDown size={18} className="c1-topic-chev" aria-hidden />
              </button>
              {isOpen && (
                <div className="c1-topic-body" id={panelId}>
                  {t.materials.length ? (
                    t.materials.map((m) => (
                      <PRow key={m.id} tile={<MaterialTile kind={m.kind} hue={subject.hue} />} title={m.title} sub={`${KIND[m.kind].label} · ${m.minutes} min`} to={`/material/${m.id}`} />
                    ))
                  ) : (
                    <p className="small muted">Your teacher has not shared materials for this topic yet.</p>
                  )}
                  {canPractise &&
                    (count > 0 ? (
                      <Button variant="brand" icon={PenLine} block busy={busy === t.id} onClick={() => start(t.id)}>
                        Practise ({count} question{count === 1 ? '' : 's'})
                      </Button>
                    ) : (
                      <p className="small muted">Practice questions for this topic are coming soon.</p>
                    ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
