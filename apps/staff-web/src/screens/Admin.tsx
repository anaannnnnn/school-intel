import { useEffect, useMemo, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { Activity, BookOpen, Download, GraduationCap, KeyRound, LayoutGrid, MessagesSquare, School, Search, Users } from 'lucide-react';
import { BottomSheet, Button, Card, CardHeader, Chip, SelectField, TextField, cx, formatDateTime } from '@school-intel/ui';
import { admin, useDb } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { DataTable, PageHead, Tabs } from '../ui';

type Tab = 'overview' | 'students' | 'teachers' | 'classes' | 'accounts' | 'activity';

function Count({ value, suffix = '' }: { value: number; suffix?: string }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${Math.round(v).toLocaleString()}${suffix}`);
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [mv, value]);
  return <motion.span>{text}</motion.span>;
}

const tone = (pct: number) => (pct >= 92 ? 'success' : pct >= 85 ? 'warning' : 'danger');

export function Admin({ actor }: { actor: Actor }) {
  useDb();
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <>
      <PageHead title="Administration" sub="School-wide view for Horizon Learning School · CBSE, Classes 1–12" />
      <Tabs<Tab>
        label="Admin sections"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'overview', label: 'Overview' },
          { value: 'students', label: 'Students' },
          { value: 'teachers', label: 'Teachers' },
          { value: 'classes', label: 'Classes' },
          { value: 'accounts', label: 'Accounts' },
          { value: 'activity', label: 'Activity' },
        ]}
      />
      <div style={{ marginBlockStart: 16 }}>
        {tab === 'overview' && <OverviewTab actor={actor} />}
        {tab === 'students' && <StudentsTab actor={actor} />}
        {tab === 'teachers' && <TeachersTab actor={actor} />}
        {tab === 'classes' && <ClassesTab actor={actor} />}
        {tab === 'accounts' && <AccountsTab actor={actor} />}
        {tab === 'activity' && <ActivityTab actor={actor} />}
      </div>
    </>
  );
}

function OverviewTab({ actor }: { actor: Actor }) {
  const o = admin.overview(actor);
  const kpis = [
    { label: 'Students', value: o.students, icon: GraduationCap },
    { label: 'Parents', value: o.guardians, icon: Users },
    { label: 'Teachers', value: o.teachers, icon: School },
    { label: 'Sections', value: o.sections, icon: LayoutGrid },
    { label: 'Study resources', value: o.materials, icon: BookOpen },
    { label: 'Chat messages', value: o.messages, icon: MessagesSquare },
  ];
  const maxStudents = Math.max(...o.grades.map((g) => g.students), 1);
  return (
    <div className="stack">
      <div className="admin-kpis">
        {kpis.map((k, i) => (
          <motion.div key={k.label} className="admin-kpi" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4 }}>
            <span className="admin-kpi-icon" aria-hidden><k.icon size={18} /></span>
            <strong><Count value={k.value} /></strong>
            <small>{k.label}</small>
          </motion.div>
        ))}
        <motion.div className="admin-kpi" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
          <span className="admin-kpi-icon" aria-hidden><Activity size={18} /></span>
          <strong><Count value={o.attendance} suffix="%" /></strong>
          <small>Average attendance · {o.below85} students below 85%</small>
        </motion.div>
      </div>
      <Card>
        <CardHeader title="Enrolment and attendance by class" sub="Bar length is the number of students; the chip is average attendance" />
        <ul className="admin-bars">
          {o.grades.map((g, i) => (
            <li key={g.grade}>
              <span>Class {g.grade}</span>
              <span className="admin-bar" aria-hidden>
                <motion.i initial={{ width: 0 }} animate={{ width: `${(g.students / maxStudents) * 100}%` }} transition={{ delay: 0.1 + i * 0.04, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
              </span>
              <span className="admin-bar-n">{g.students} · {g.sections} sections</span>
              <Chip tone={tone(g.attendance)}>{g.attendance}%</Chip>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="Learning library" sub={`${o.questions.toLocaleString()} questions · ${o.assessments} assessments`} />
        <div className="admin-kinds">
          {Object.entries(o.materialKinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
            <Chip key={k} tone="info">{k.replace('-', ' ')} · {n.toLocaleString()}</Chip>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StudentsTab({ actor }: { actor: Actor }) {
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState('');
  const [open, setOpen] = useState<string>();
  const rows = admin.students(actor, { q, grade: grade ? Number(grade) : undefined });
  const profile = open ? admin.studentProfile(actor, open) : undefined;
  return (
    <div className="stack">
      <div className="admin-filters">
        <TextField label="Search name, class or login" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 9A or stu.9a.01" />
        <SelectField label="Class" value={grade} onChange={(e) => setGrade(e.target.value)} options={[{ value: '', label: 'All classes' }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` }))]} />
      </div>
      <p className="admin-note">{rows.length} shown{rows.length === 400 ? ' (first 400 — narrow the search)' : ''}</p>
      <DataTable
        caption="Students"
        rows={rows}
        onRow={(r) => setOpen(r.id)}
        empty={<p className="admin-note">No students match.</p>}
        columns={[
          { key: 'name', label: 'Student', render: (r) => <strong>{r.name}</strong> },
          { key: 'class', label: 'Section', render: (r) => r.classId },
          { key: 'roll', label: 'Roll', render: (r) => r.rollNo ?? '—' },
          { key: 'login', label: 'Login', render: (r) => <code>{r.loginId}</code> },
          { key: 'att', label: 'Attendance', align: 'end', render: (r) => <Chip tone={tone(r.attendance)}>{r.attendance}%</Chip> },
        ]}
      />
      <BottomSheet open={!!profile} onClose={() => setOpen(undefined)} title={profile?.student.name ?? 'Student'} tall>
        {profile && (
          <div className="stack">
            <p className="admin-note">Section {profile.student.classId} · Attendance {profile.attendance}%</p>
            <h3>Logins</h3>
            <ul className="admin-list">
              {profile.logins.map((l) => <li key={l.loginId}><code>{l.loginId}</code><span>{l.kind}</span></li>)}
            </ul>
            <h3>Parents / guardians</h3>
            <ul className="admin-list">
              {profile.guardians.map((g) => g && <li key={g.id}><span>{g.name}</span><span>{g.phone ?? ''}</span></li>)}
            </ul>
            <h3>Latest results</h3>
            {profile.scores.length === 0 ? <p className="admin-note">No results recorded.</p> : (
              <ul className="admin-list">
                {profile.scores.slice(0, 12).map((s, i) => <li key={i}><span>{s.subject}</span><span>{'score' in s ? String((s as { score: number }).score) : ''}</span></li>)}
              </ul>
            )}
            <h3>Last 14 school days</h3>
            <div className="admin-days">
              {profile.recent.map((d) => <i key={d.date} data-status={d.status} title={`${d.date}: ${d.status}`} />)}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function TeachersTab({ actor }: { actor: Actor }) {
  const [q, setQ] = useState('');
  const all = admin.teachers(actor);
  const rows = useMemo(() => all.filter((t) => !q || `${t.name} ${t.loginId} ${t.subjects.join(' ')}`.toLowerCase().includes(q.toLowerCase())), [all, q]);
  return (
    <div className="stack">
      <TextField label="Search teachers" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, subject or login" />
      <DataTable
        caption="Teachers"
        rows={rows}
        columns={[
          { key: 'name', label: 'Teacher', render: (t) => <strong>{t.name}</strong> },
          { key: 'login', label: 'Login', render: (t) => <code>{t.loginId}</code> },
          { key: 'subjects', label: 'Teaches', render: (t) => t.subjects.slice(0, 3).join(', ') + (t.subjects.length > 3 ? ` +${t.subjects.length - 3}` : '') },
          { key: 'sections', label: 'Sections', align: 'end', render: (t) => t.sections },
        ]}
      />
    </div>
  );
}

function ClassesTab({ actor }: { actor: Actor }) {
  const rows = admin.classes(actor);
  return (
    <DataTable
      caption="Classes"
      rows={rows}
      columns={[
        { key: 'id', label: 'Section', render: (c) => <strong>{c.id}</strong> },
        { key: 'stream', label: 'Stream', render: (c) => c.stream ?? '—' },
        { key: 'tutor', label: 'Class teacher', render: (c) => c.tutor },
        { key: 'room', label: 'Room', render: (c) => c.room ?? '—' },
        { key: 'n', label: 'Students', align: 'end', render: (c) => c.students },
        { key: 'att', label: 'Attendance', align: 'end', render: (c) => <Chip tone={tone(c.attendance)}>{c.attendance}%</Chip> },
      ]}
    />
  );
}

function AccountsTab({ actor }: { actor: Actor }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const rows = admin.accounts(actor, { q, kind: (kind || undefined) as 'student' | 'guardian' | 'staff' | undefined });
  const download = () => {
    const url = URL.createObjectURL(new Blob([admin.accountsCsv(actor)], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'horizon-accounts.csv' });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="stack">
      <div className="admin-filters">
        <TextField label="Search login or name" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. par.9a" />
        <SelectField label="Account type" value={kind} onChange={(e) => setKind(e.target.value)} options={[{ value: '', label: 'All' }, { value: 'student', label: 'Students' }, { value: 'guardian', label: 'Parents' }, { value: 'staff', label: 'Staff and admins' }]} />
        <Button variant="secondary" icon={Download} onClick={download}>Export CSV</Button>
      </div>
      <p className="admin-note"><KeyRound size={14} aria-hidden /> Every account starts with the shared first-use passcode from the school office. Passcodes are never shown here.</p>
      <DataTable
        caption="Accounts"
        rows={rows}
        columns={[
          { key: 'login', label: 'Login', render: (a) => <code>{a.loginId}</code> },
          { key: 'kind', label: 'Type', render: (a) => a.kind },
          { key: 'label', label: 'Name', render: (a) => a.label },
          { key: 'group', label: 'Group', render: (a) => a.group },
        ]}
      />
    </div>
  );
}

function ActivityTab({ actor }: { actor: Actor }) {
  const chat = admin.recentChat(actor);
  const log = admin.auditLog(actor);
  return (
    <div className="admin-two">
      <Card>
        <CardHeader icon={MessagesSquare} title="Chat" sub={`${chat.total} messages · ${chat.broadcasts} class broadcasts`} />
        <ul className="admin-list">
          {chat.latest.map((m) => (
            <li key={m.id} className={cx(m.broadcast && 'is-broadcast')}>
              <span><strong>{m.fromName}</strong> {m.broadcast ? '(to class) ' : ''}{m.text.slice(0, 90)}</span>
              <small>{formatDateTime(m.at)}</small>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader icon={Search} title="Audit trail" sub="Latest 100 recorded actions" />
        <ul className="admin-list">
          {log.slice(0, 30).map((e) => (
            <li key={e.id}><span><strong>{e.actor}</strong> · {e.action} · {e.target}</span><small>{formatDateTime(e.at)}</small></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
