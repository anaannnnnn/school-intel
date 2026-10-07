import type { RequestStatus } from '@school-intel/contracts';
import type { Tone } from '@school-intel/ui';

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  'awaiting-approval': { label: 'Awaiting approval', tone: 'warning' },
  'in-progress': { label: 'In progress', tone: 'info' },
  approved: { label: 'Confirmed', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  answered: { label: 'Answered', tone: 'success' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
};
