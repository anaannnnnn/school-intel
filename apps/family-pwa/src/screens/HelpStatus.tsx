import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CircleCheck, ListChecks, PhoneCall, ShieldCheck } from 'lucide-react';
import { Callout, Card, CardHeader, formatDate, formatTime } from '@school-intel/ui';
import { family, useDb } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';

export function HelpStatus() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { actor } = useFamily();
  useDb();
  const c = family.myConcerns(actor).find((x) => x.id === id);
  if (!c) return <PageHeader back="/help" title="Report not found" />;
  const isNew = params.get('new') === '1';
  return (
    <>
      <PageHeader back="/help" eyebrow={`Reference ${c.id}`} title={isNew ? 'We received your concern' : 'Your report'} />
      <Card>
        <CardHeader icon={CircleCheck} title="Your report is stored" sub={`Received ${formatDate(c.receivedAt)}, ${formatTime(c.receivedAt)}`} />
        <p>{c.studentStatus}</p>
        <p className="small muted" style={{ marginBlockStart: 8 }}>Sensitive details will not appear in notifications.</p>
      </Card>
      <Card>
        <CardHeader icon={ListChecks} title="What happens next" />
        <ul className="glance">
          <li><span className="glance-body">Staff will arrange a private check-in.</span></li>
          <li><span className="glance-body">You can add more information by talking to the staff member who contacts you.</span></li>
          <li><span className="glance-body">We cannot promise a specific outcome before staff review.</span></li>
        </ul>
      </Card>
      <Callout tone="warning" icon={PhoneCall} title="If your situation changes">Speak with a trusted adult or duty staff if you feel unsafe now.</Callout>
      <Link to="/today" className="btn btn-secondary btn-block"><ShieldCheck size={16} aria-hidden /> Back to today</Link>
    </>
  );
}
