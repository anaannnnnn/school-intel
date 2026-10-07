import { UserX } from 'lucide-react';
import { Card, EmptyState } from '@school-intel/ui';

export function NoChildren() {
  return (
    <Card>
      <EmptyState icon={UserX} title="No linked children">
        Your account has no verified child relationships right now. If this is unexpected, contact the school office so they can check your guardian record.
      </EmptyState>
    </Card>
  );
}
