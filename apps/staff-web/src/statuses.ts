import type { CaseStatus, DraftState, RequestStatus } from '@school-intel/contracts';
import type { Tone } from '@school-intel/ui';

export const DRAFT: Record<DraftState, { label: string; tone: Tone }> = {
  'missing-evidence': { label: 'Missing evidence', tone: 'warning' },
  draft: { label: 'Awaiting review', tone: 'info' },
  edited: { label: 'Edited · awaiting approval', tone: 'info' },
  approved: { label: 'Approved', tone: 'success' },
  published: { label: 'Published', tone: 'success' },
};

export const CASE: Record<CaseStatus, { label: string; tone: Tone }> = {
  open: { label: 'Open · review due', tone: 'warning' },
  acknowledged: { label: 'Acknowledged', tone: 'info' },
  investigating: { label: 'Investigating', tone: 'info' },
  'support-plan': { label: 'Support plan', tone: 'success' },
  'insufficient-data': { label: 'Insufficient data', tone: 'neutral' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'neutral' },
};

export const REQUEST: Record<RequestStatus, { label: string; tone: Tone }> = {
  'awaiting-approval': { label: 'Awaiting decision', tone: 'warning' },
  'in-progress': { label: 'In progress', tone: 'info' },
  approved: { label: 'Confirmed', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  answered: { label: 'Answered', tone: 'success' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
};
