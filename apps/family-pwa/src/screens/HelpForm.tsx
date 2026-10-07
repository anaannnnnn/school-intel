import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Paperclip } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Checkbox, SelectField, TextArea, TextField, errorText } from '@school-intel/ui';
import { family } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';

const CATEGORIES = ['Bullying', 'Online behaviour', 'Feeling unsafe', 'Worried about a friend', 'Something else'];

export function HelpForm() {
  const { actor } = useFamily();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState('Online behaviour');
  const [description, setDescription] = useState('');
  const [whenWhere, setWhenWhere] = useState('');
  const [contact, setContact] = useState('Private check-in during break');
  const [files, setFiles] = useState(0);
  const [ack, setAck] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const send = () => {
    setBusy(true);
    setTimeout(() => {
      try {
        const r = family.reportConcern(actor, { category, description, whenWhere, contactPreference: contact, attachments: files, acknowledgedLimits: ack });
        navigate(`/help/${r.id}?new=1`, { replace: true });
      } catch (e) {
        setError(errorText(e));
        setBusy(false);
      }
    }, 600);
  };

  return (
    <>
      <PageHeader back="/help" eyebrow="Named confidential report" title="Tell us what happened" />
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Card>
          <div className="stack">
            <SelectField label="What is it about?" value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORIES} />
            <TextArea label="What happened?" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Write as much or as little as you want." required />
            <TextField label="When and where" value={whenWhere} onChange={(e) => setWhenWhere(e.target.value)} placeholder="For example: 5 October, after school, online" />
            <div className="field">
              <span className="field-label">Screenshots or files (optional)</span>
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => setFiles(e.target.files?.length ?? 0)} />
              <Button variant="secondary" icon={Paperclip} onClick={() => fileRef.current?.click()}>{files ? `${files} file${files > 1 ? 's' : ''} attached` : 'Attach files'}</Button>
              <span className="field-hint">Files are stored in a restricted area only safeguarding staff can open.</span>
            </div>
            <SelectField label="How should staff contact you?" value={contact} onChange={(e) => setContact(e.target.value)} options={['Private check-in during break', 'Private check-in after school', 'Through my form tutor', 'Message me here first']} />
          </div>
        </Card>
        <Card>
          <CardHeader icon={Lock} title="Before you send" />
          <Checkbox checked={ack} onChange={setAck} label="I understand staff may share information needed to keep someone safe." />
        </Card>
        {error && <Callout tone="danger">{error}</Callout>}
        <Button type="submit" block busy={busy} disabled={!ack || !description.trim()}>Send to support staff</Button>
      </form>
    </>
  );
}
