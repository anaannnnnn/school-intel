import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Lock, PhoneCall, ShieldCheck } from 'lucide-react';
import { Callout, Card, CardHeader, Chip, formatDate } from '@school-intel/ui';
import { family, useDb } from '@school-intel/api';
import { PageHeader } from '../Shell';
import { useFamily } from '../family-context';

export function Help() {
  const { actor, isParent } = useFamily();
  useDb();
  if (isParent) {
    return (
      <>
        <PageHeader back="/more" title="Help and support" />
        <Callout tone="info">For questions about school arrangements use Ask the school. For concerns about a child’s safety, call the school and ask for the designated safeguarding lead.</Callout>
      </>
    );
  }
  const mine = family.myConcerns(actor);
  return (
    <>
      <PageHeader eyebrow="Confidential support" title="I need help" />
      <Card className="help-hero">
        <CardHeader icon={HeartHandshake} title="You can speak up" />
        <p>Tell us about bullying, online behaviour, safety, a friend you’re worried about, or anything else. Trained staff will read it and follow up with you.</p>
        <Link to="/help/new" className="btn btn-block" style={{ marginBlockStart: 16, background: '#fff', color: 'var(--color-nav)' }}>Write a concern</Link>
      </Card>

      <Card>
        <CardHeader icon={Lock} title="How confidentiality works" />
        <ul className="glance">
          <li><span className="glance-body">Only authorised support staff review your report.</span></li>
          <li><span className="glance-body">Staff may need to share information to keep someone safe.</span></li>
          <li><span className="glance-body">Anonymous reporting is not enabled at this school, so staff can follow up with you.</span></li>
          <li><span className="glance-body">Details never appear in notifications.</span></li>
        </ul>
      </Card>

      <Callout tone="danger" icon={PhoneCall} title="If you feel unsafe right now">
        Speak to a trusted adult or the school duty staff straight away. This form is not an emergency service.
      </Callout>

      {mine.length > 0 && (
        <>
          <h2 className="section-title">Your reports</h2>
          {mine.map((c) => (
            <Link key={c.id} to={`/help/${c.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="card-icon" aria-hidden><ShieldCheck size={18} /></span>
              <span className="grow">
                <strong style={{ display: 'block' }}>Reference {c.id}</strong>
                <span className="small muted">{c.category} · {formatDate(c.receivedAt)}</span>
              </span>
              <Chip tone={c.closed ? 'neutral' : 'success'}>{c.closed ? 'Followed up' : 'Being reviewed'}</Chip>
              <ArrowRight size={18} className="flip-rtl" aria-hidden />
            </Link>
          ))}
        </>
      )}
    </>
  );
}
