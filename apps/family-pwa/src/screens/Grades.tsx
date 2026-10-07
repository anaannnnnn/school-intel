import { Link } from 'react-router-dom';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { Card, Chip, EmptyState, formatDate, type Tone } from '@school-intel/ui';
import { learn, useDb } from '@school-intel/api';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { Ring, SectionTitle, SubjectTile, scoreTone } from '../kit';
import { NoChildren } from './NoChildren';
import { toneColor } from './Tests';
import '../student-c2.css';

const KIND_LABEL: Record<string, { label: string; tone: Tone }> = {
  test: { label: 'Test', tone: 'warning' },
  quiz: { label: 'Quiz', tone: 'info' },
  written: { label: 'Written', tone: 'neutral' },
};

export function Grades() {
  const { actor, isParent, child } = useFamily();
  useDb();
  if (!child) return <NoChildren />;
  const subjects = learn.gradesFor(actor, child.id);
  const withResults = subjects.filter((s) => s.results.length);
  const without = subjects.filter((s) => !s.results.length);

  return (
    <>
      <PageHeader back={isParent ? '/progress' : true} eyebrow={isParent ? `${child.firstName} · Year ${child.classId}` : 'Released results'} title="Subject grades" />
      {isParent && <ChildSwitcher />}

      {withResults.length === 0 ? (
        <Card>
          <EmptyState icon={GraduationCap} title="No results released yet">
            {isParent ? `${child.firstName}’s` : 'Your'} marks appear here once teachers release them.
          </EmptyState>
        </Card>
      ) : (
        withResults.map((s) => (
          <Card key={s.subject.id} as="article" aria-labelledby={`g-${s.subject.id}`}>
            <div className="stack">
              <div className="card-top">
                <SubjectTile subjectId={s.subject.id} hue={s.subject.hue} />
                <div className="grow">
                  <h3 id={`g-${s.subject.id}`}>{s.subject.name}</h3>
                  <span className="small muted">{s.teacher} · {s.results.length} {s.results.length === 1 ? 'result' : 'results'}</span>
                </div>
                {s.average !== undefined && (
                  <div className="stack-sm" style={{ alignItems: 'center', gap: 4 }}>
                    <Ring pct={s.average} size={56} color={toneColor(scoreTone(s.average))} />
                    <span className="fine">Average</span>
                  </div>
                )}
              </div>
              <ul className="result-list">
                {s.results.map((r) => {
                  const k = KIND_LABEL[r.kind] ?? KIND_LABEL.quiz;
                  const inner = (
                    <>
                      <span className="grow">
                        <strong>{r.title}</strong>
                        <small><Chip tone={k.tone} dot={false}>{k.label}</Chip> {formatDate(r.date)} · {r.got}/{r.max} marks</small>
                      </span>
                      <Chip tone={scoreTone(r.pct)}>{r.pct}%</Chip>
                    </>
                  );
                  return (
                    <li key={r.id}>
                      {r.kind !== 'written' ? (
                        <Link to={`/tests/result/${r.id}`}>{inner}<ChevronRight size={16} className="flip-rtl muted" aria-hidden /></Link>
                      ) : (
                        <div className="result-row">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>
        ))
      )}

      {withResults.length > 0 && without.length > 0 && (
        <>
          <SectionTitle>Other subjects</SectionTitle>
          <div className="rows">
            {without.map((s) => (
              <div key={s.subject.id} className="prow" style={{ cursor: 'default' }}>
                <SubjectTile subjectId={s.subject.id} hue={s.subject.hue} />
                <span className="prow-body">
                  <span className="prow-title">{s.subject.name}</span>
                  <span className="prow-sub">{s.teacher} · no released results yet</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="small muted">Averages use released results only. Practice papers {isParent ? 'students take' : 'you take'} on their own are not included.</p>
    </>
  );
}
