import { useLayoutEffect, useRef } from 'react';
import { BookOpenCheck, Bot, ChartNoAxesCombined, MessagesSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getDb } from '@school-intel/api';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { icon: BookOpenCheck, title: 'Complete CBSE library', text: 'Textbook chapter guides, notes, worksheets, revision sheets and sample papers for Classes 1 to 12, mapped to the NCERT syllabus.' },
  { icon: Bot, title: 'Horizon Assistant', text: 'Ask about attendance, timetable, exams or find the right study material. Answers come from your own school records.' },
  { icon: MessagesSquare, title: 'Class chat rooms', text: 'Teachers, students and parents of the same class talk in one place. Teachers can message a whole class in one go.' },
  { icon: ChartNoAxesCombined, title: 'Attendance and results', text: 'Daily attendance, scorecards and merit points for every student, visible to the right people only.' },
  { icon: ShieldCheck, title: 'Admin console', text: 'Enrolment, staff, sections, accounts and an audit trail for the school office.' },
  { icon: Sparkles, title: 'Three themes', text: 'Pick the look that suits you in Settings: light, calm or dark.' },
];

export function Showcase() {
  const root = useRef<HTMLElement>(null);
  const d = (() => {
    try {
      const db = getDb();
      return { students: db.students.length, sections: db.classes.length, materials: db.materials.length, questions: db.questions.length };
    } catch {
      return { students: 0, sections: 0, materials: 0, questions: 0 };
    }
  })();

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.gt-sc-card', { opacity: 0, y: 40, duration: 0.7, ease: 'power3.out', stagger: 0.09, scrollTrigger: { trigger: '.gt-sc-grid', start: 'top 85%' } });
      gsap.from('.gt-sc-head > *', { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.gt-sc-head', start: 'top 88%' } });
      gsap.utils.toArray<HTMLElement>('.gt-sc-num').forEach((n) => {
        const target = Number(n.dataset.value ?? 0);
        const o = { v: 0 };
        gsap.to(o, { v: target, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: n, start: 'top 92%', once: true }, onUpdate: () => { n.textContent = Math.round(o.v).toLocaleString(); } });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="gt-showcase" aria-labelledby="gt-sc-h">
      <div className="gt-sc-head">
        <p className="gt-kicker">Built for CBSE schools</p>
        <h2 id="gt-sc-h">Everything a CBSE school runs on, in one app.</h2>
      </div>
      <ul className="gt-sc-stats" role="list">
        {[['Students', d.students], ['Sections', d.sections], ['Study resources', d.materials], ['Practice questions', d.questions]].map(([label, v]) => (
          <li key={label as string}>
            <strong className="gt-sc-num" data-value={v as number}>{(v as number).toLocaleString()}</strong>
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <ul className="gt-sc-grid" role="list">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="gt-sc-card">
            <span className="gt-sc-icon" aria-hidden><Icon size={22} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
