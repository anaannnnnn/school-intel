import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenText, CirclePlay, EyeOff, FileText, Info, Layers, Lock, NotebookPen, PenLine, Presentation, Send, Smartphone, Sparkles, Type, type LucideIcon } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Chip, EmptyState, SelectField, TextArea, TextField, errorText, formatDateTime, useToast } from '@school-intel/ui';
import { AI_DISCLOSURE, getDb, teach, useDb } from '@school-intel/api';
import type { Actor, MaterialKind } from '@school-intel/contracts';
import { AiTag, PageFoot, PageHead, Restricted, SubjectDot } from '../ui';
import '../teaching-a.css';

const KIND: Record<MaterialKind, { label: string; icon: LucideIcon }> = {
  notes: { label: 'Notes', icon: FileText },
  video: { label: 'Video', icon: CirclePlay },
  worksheet: { label: 'Worksheet', icon: NotebookPen },
  slides: { label: 'Slides', icon: Presentation },
};

type Mat = ReturnType<typeof teach.materialById>;

export function MaterialEditor({ actor }: { actor: Actor }) {
  const { id = '' } = useParams();
  useDb();
  const isNew = id === 'new';
  let m: Mat | undefined;
  if (!isNew) {
    try {
      m = teach.materialById(actor, id);
    } catch (e) {
      return <Restricted message={errorText(e)} />;
    }
  }
  if (isNew && teach.mySubjects(actor).length === 0) {
    return (
      <Card>
        <EmptyState icon={Lock} title="Only subject teachers create materials" action={<Link to="/materials" className="btn btn-secondary">Back to materials</Link>}>
          Your role can read published and draft materials across subjects, but not create them.
        </EmptyState>
      </Card>
    );
  }
  return <Editor key={`${id}-${m?.updatedAt ?? ''}-${m?.status ?? ''}`} actor={actor} m={m} />;
}

function paragraphs(body: string) {
  return body
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function Preview({ title, subjectHue, subjectName, topic, kind, minutes, body, status }: { title: string; subjectHue: number; subjectName: string; topic?: string; kind: MaterialKind; minutes: number | string; body: string; status: 'draft' | 'published' }) {
  const K = KIND[kind];
  const paras = paragraphs(body);
  return (
    <div className="ta-preview" aria-label="Student preview">
      <div className="ta-preview-head">
        <span className="ta-meta">
          <span className="ta-subj">
            <SubjectDot hue={subjectHue} />
            {subjectName}
          </span>
          {topic && <span>{topic}</span>}
        </span>
        <h3>{title.trim() || 'Untitled material'}</h3>
        <span className="ta-meta">
          <span className="ta-kind">
            <K.icon size={14} aria-hidden />
            {K.label}
          </span>
          <span>{minutes || 0} min read</span>
          <span>{status === 'published' ? 'Visible to students' : 'Draft · hidden from students'}</span>
        </span>
      </div>
      <div className="ta-preview-body">
        {paras.length ? paras.map((p, i) => <p key={i}>{p}</p>) : <p className="ta-preview-empty">The content you write appears here as students will see it.</p>}
      </div>
    </div>
  );
}

function Editor({ actor, m }: { actor: Actor; m?: Mat }) {
  const navigate = useNavigate();
  const toast = useToast();
  const d = getDb();
  const own = teach.mySubjects(actor);
  const isNew = !m;
  const editable = isNew || !!m?.editable;

  const initial = {
    subjectId: m?.subjectId ?? own[0]?.id ?? '',
    topicId: m?.topicId ?? d.topics.filter((t) => t.subjectId === (m?.subjectId ?? own[0]?.id)).sort((a, b) => a.order - b.order)[0]?.id ?? '',
    title: m?.title ?? '',
    kind: m?.kind ?? ('notes' as MaterialKind),
    minutes: String(m?.minutes ?? 10),
    body: m?.body ?? '',
  };
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = (Object.keys(initial) as (keyof typeof initial)[]).some((k) => initial[k] !== form[k]);

  const subject = d.subjects.find((s) => s.id === form.subjectId) ?? m?.subject;
  const topics = d.topics.filter((t) => t.subjectId === form.subjectId).sort((a, b) => a.order - b.order);
  const topicName = d.topics.find((t) => t.id === form.topicId)?.name;
  const author = d.staff.find((s) => s.id === m?.createdBy)?.name;
  const teacher = d.staff.find((s) => s.id === m?.subject.teacherId)?.name;
  const words = form.body.trim().split(/\s+/).filter(Boolean).length;

  const save = () => {
    try {
      const saved = teach.saveMaterial(actor, { id: m?.id, subjectId: form.subjectId, topicId: form.topicId, title: form.title, kind: form.kind, body: form.body, minutes: Math.max(1, Number(form.minutes) || 1) });
      if (isNew) {
        toast('Draft saved · students cannot see it until you publish');
        navigate(`/materials/${saved.id}`, { replace: true });
      } else {
        toast('Changes saved');
      }
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const setStatus = (status: 'draft' | 'published') => {
    if (!m) return;
    try {
      teach.setMaterialStatus(actor, m.id, status);
      toast(status === 'published' ? 'Published · students in the class can now open it' : 'Unpublished · hidden from students');
    } catch (e) {
      toast(errorText(e), 'danger');
    }
  };

  const aiDraft = (mode: 'cards' | 'simple') => {
    if (!m) return;
    setBusy(mode);
    try {
      const x = teach.aiMaterialDraft(actor, m.id, mode);
      toast(mode === 'cards' ? 'Revision cards drafted · review before publishing' : 'Simpler version drafted · review before publishing');
      navigate(`/materials/${x.id}`);
    } catch (e) {
      toast(errorText(e), 'danger');
    } finally {
      setBusy(null);
    }
  };

  const statusChip = m ? m.status === 'published' ? <Chip tone="success">Published</Chip> : <Chip tone={m.aiGenerated ? 'warning' : 'info'}>{m.aiGenerated ? 'AI draft · needs review' : 'Draft'}</Chip> : <Chip tone="neutral">New · not saved</Chip>;

  const head = (
    <PageHead
      title={isNew ? 'New material' : m!.title}
      sub={
        isNew
          ? 'Write notes, a worksheet, slides or a video summary. New materials start as drafts.'
          : `${m!.subject.name} · ${m!.topic?.name ?? 'No topic'} · ${KIND[m!.kind].label} · updated ${formatDateTime(m!.updatedAt)}${author ? ` by ${author}` : ''}`
      }
      spec="Teaching · material editor"
      actions={
        <>
          <Link to="/materials" className="btn btn-secondary">
            <ArrowLeft size={18} aria-hidden /> All materials
          </Link>
          {m && editable && (m.status === 'published' ? (
            <Button variant="secondary" icon={EyeOff} onClick={() => setStatus('draft')}>Unpublish</Button>
          ) : (
            <Button icon={Send} disabled={dirty} title={dirty ? 'Save your changes first' : undefined} onClick={() => setStatus('published')}>Publish</Button>
          ))}
        </>
      }
    />
  );

  const aiCallout = m?.aiGenerated && m.status === 'draft' && (
    <Callout tone="warning" icon={Sparkles} title="AI draft · Review before publishing">
      This version was generated by the demo AI from your own material. Check the facts, wording and reading level; students see it only after you publish.
    </Callout>
  );

  if (!editable && m) {
    return (
      <>
        {head}
        <div className="row wrap" style={{ gap: 8 }}>
          {statusChip}
          {m.aiGenerated && <AiTag />}
        </div>
        <Callout tone="info" icon={Lock} title="Read-only">
          Only {teacher ?? 'the subject teacher'}, who teaches {m.subject.name}, can edit or publish this material.
        </Callout>
        {aiCallout}
        <div className="grid-main">
          <Card>
            <CardHeader icon={Smartphone} title="Student view" sub={m.status === 'published' ? 'As it appears in the student app' : 'Not yet visible to students'} />
            <Preview title={m.title} subjectHue={m.subject.hue} subjectName={m.subject.name} topic={m.topic?.name} kind={m.kind} minutes={m.minutes} body={m.body} status={m.status} />
          </Card>
          <Card>
            <CardHeader icon={Info} title="Details" />
            <dl className="kv">
              <dt>Subject</dt>
              <dd>{m.subject.name}</dd>
              <dt>Topic</dt>
              <dd>{m.topic?.name ?? '—'}</dd>
              <dt>Kind</dt>
              <dd>{KIND[m.kind].label}</dd>
              <dt>Study time</dt>
              <dd className="ta-mono">{m.minutes} min</dd>
              <dt>Status</dt>
              <dd>{statusChip}</dd>
              <dt>Created by</dt>
              <dd>{author ?? '—'}{m.aiGenerated ? ' (AI-assisted)' : ''}</dd>
              <dt>Updated</dt>
              <dd>{formatDateTime(m.updatedAt)}</dd>
            </dl>
          </Card>
        </div>
        <PageFoot />
      </>
    );
  }

  return (
    <>
      {head}
      <div className="row wrap" style={{ gap: 8 }}>
        {statusChip}
        {m?.aiGenerated && <AiTag />}
        {dirty && <Chip tone="warning">Unsaved changes</Chip>}
      </div>
      {aiCallout}

      <div className="grid-main">
        <Card>
          <CardHeader icon={PenLine} title="Content" sub="Plain paragraphs, separated by a blank line" />
          <div className="ta-form-grid">
            <SelectField
              label="Subject"
              value={form.subjectId}
              disabled={!isNew}
              hint={isNew ? undefined : 'Fixed once saved'}
              onChange={(e) => {
                const sid = e.target.value;
                setForm((f) => ({ ...f, subjectId: sid, topicId: d.topics.filter((t) => t.subjectId === sid).sort((a, b) => a.order - b.order)[0]?.id ?? '' }));
              }}
              options={own.map((s) => ({ value: s.id, label: `${s.name} · Year ${s.classId}` }))}
            />
            <SelectField label="Topic" value={form.topicId} onChange={(e) => set('topicId', e.target.value)} options={topics.map((t) => ({ value: t.id, label: t.name }))} />
            <div className="ta-span">
              <TextField label="Title" value={form.title} placeholder="For example: Adding fractions with unlike denominators" onChange={(e) => set('title', e.target.value)} />
            </div>
            <SelectField label="Kind" value={form.kind} onChange={(e) => set('kind', e.target.value as MaterialKind)} options={(Object.keys(KIND) as MaterialKind[]).map((k) => ({ value: k, label: KIND[k].label }))} />
            <TextField label="Study time (minutes)" type="number" min={1} max={120} inputMode="numeric" value={form.minutes} onChange={(e) => set('minutes', e.target.value)} />
            <div className="ta-span">
              <TextArea label="Body" rows={14} value={form.body} onChange={(e) => set('body', e.target.value)} hint={`${words} words · ${paragraphs(form.body).length} paragraphs`} placeholder="Explain the idea, give a worked example and name a common mistake." />
            </div>
          </div>
          <div className="ta-form-actions">
            <Button icon={Type} variant={isNew ? 'primary' : 'secondary'} onClick={save} disabled={!isNew && !dirty}>
              {isNew ? 'Save as draft' : 'Save changes'}
            </Button>
            {!isNew && dirty && (
              <Button variant="ghost" onClick={() => setForm(initial)}>
                Discard changes
              </Button>
            )}
            <span className="ta-hint">{m?.status === 'published' ? 'Saved changes are visible to students straight away.' : 'Drafts stay hidden from students.'}</span>
          </div>
        </Card>

        <div className="stack">
          <Card>
            <CardHeader icon={Smartphone} title="Student view" sub="Live preview as you type" />
            <Preview title={form.title} subjectHue={subject?.hue ?? 180} subjectName={subject?.name ?? ''} topic={topicName} kind={form.kind} minutes={form.minutes} body={form.body} status={m?.status ?? 'draft'} />
          </Card>

          <Card className="ai-panel">
            <CardHeader icon={Sparkles} title="AI assistant" sub="Creates a new draft from this material for you to review" action={<AiTag>Demo AI</AiTag>} />
            <div className="ta-ai-actions">
              <Button className="btn-ai" icon={Layers} busy={busy === 'cards'} disabled={isNew || dirty || !!busy} onClick={() => aiDraft('cards')}>
                Generate revision cards
              </Button>
              <Button className="btn-ai" icon={BookOpenText} busy={busy === 'simple'} disabled={isNew || dirty || !!busy} onClick={() => aiDraft('simple')}>
                Simplify reading level
              </Button>
            </div>
            {(isNew || dirty) && <p className="small muted" style={{ marginBlockEnd: 10 }}>Save the material first so the AI works from your latest version.</p>}
            <p className="ta-disclosure">
              <Info size={13} aria-hidden />
              <span>{AI_DISCLOSURE} The original stays unchanged and the draft is not shown to students until you publish it.</span>
            </p>
          </Card>
        </div>
      </div>
      <PageFoot />
    </>
  );
}
