import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Info } from 'lucide-react';
import { Button, Callout, Card, CardHeader, Checkbox, SelectField, Steps, TextArea, TextField, errorText, useToast } from '@school-intel/ui';
import { family } from '@school-intel/api';
import { ChildSwitcher, PageHeader } from '../Shell';
import { useFamily } from '../family-context';
import { NoChildren } from './NoChildren';

export function EarlyCollection() {
  const { actor, child, name } = useFamily();
  const navigate = useNavigate();
  const toast = useToast();
  const [date, setDate] = useState('2026-10-15');
  const [time, setTime] = useState('11:00');
  const [reason, setReason] = useState('Medical appointment');
  const [collector, setCollector] = useState(name);
  const [note, setNote] = useState('');
  const [ack, setAck] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!child) return <NoChildren />;

  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      try {
        const label = new Date(`${date}T12:00:00+04:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const req = family.createRequest(actor, {
          type: 'early-collection',
          studentId: child.id,
          subject: `Early collection · ${child.firstName}`,
          details: { Date: label, Time: `${time} GST`, Reason: reason, Collector: `${collector}${collector === name ? ', verified guardian' : ''}` },
          message: note,
        });
        toast(`Request ${req.id} sent for approval`);
        navigate(`/requests/${req.id}`, { replace: true });
      } catch (e) {
        setError(errorText(e));
        setBusy(false);
      }
    }, 500);
  };

  return (
    <>
      <PageHeader back eyebrow="Request" title="Early collection" />
      <ChildSwitcher />
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Card>
          <CardHeader icon={ClipboardList} title="Collection details" />
          <div className="stack">
            <TextField label="Collection date" type="date" min="2026-10-06" value={date} onChange={(e) => setDate(e.target.value)} required />
            <TextField label="Collection time" type="time" value={time} onChange={(e) => setTime(e.target.value)} hint="Gulf Standard Time" required />
            <SelectField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} options={['Medical appointment', 'Dental appointment', 'Family emergency', 'Religious observance', 'Other']} />
            <SelectField label="Verified collector" value={collector} onChange={(e) => setCollector(e.target.value)} options={[name, 'Ahmed Ali (authorised driver)']} hint="Only collectors on the school’s authorised list can be chosen." />
            <TextArea label="Note for the office (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </Card>

        <Card>
          <CardHeader icon={Info} tone="info" title="Before you send" />
          <Steps
            steps={[
              { label: 'Office approval', done: false, meta: 'Staff must approve this request.' },
              { label: 'Class teacher and security notified', done: false, meta: 'They receive the approved plan.' },
              { label: 'Transport acknowledgement', done: false, meta: 'The bus team confirms any route change.' },
            ]}
          />
        </Card>

        <Callout tone="warning" title="Draft · not yet submitted">No collection arrangement is confirmed until the school approves it.</Callout>
        <Checkbox checked={ack} onChange={setAck} label="I will show photo ID at reception when collecting." />
        {error && <p className="field-error" role="alert">{error}</p>}
        <Button type="submit" block busy={busy} disabled={!ack}>Submit for approval</Button>
      </form>
    </>
  );
}
