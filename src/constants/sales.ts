import type { SalesDesignation, SalesSuspensionReason, SalesTeamStatus } from '../types';

/** Single Head of Sales for the organisation (not addable via UI). */
export const DEFAULT_HEAD_OF_SALES_NAME = 'Lucky Gamage';
export const DEFAULT_HEAD_OF_SALES_DEPARTMENT = 'Sales Division';

/** Executive designations for sales persons (managers are separate roles in the hierarchy). */
export const SALES_DESIGNATIONS: SalesDesignation[] = [
  'ASSISTANT_SALES_MANAGER',
  'SENIOR_SALES_EXECUTIVE',
  'SALES_EXECUTIVE',
  'JUNIOR_SALES_EXECUTIVE',
];

export const DESIGNATION_LABELS: Record<SalesDesignation, string> = {
  ASSISTANT_SALES_MANAGER: 'Assistant Sales Manager',
  SENIOR_SALES_EXECUTIVE: 'Senior Sales Executive',
  SALES_EXECUTIVE: 'Sales Executive',
  JUNIOR_SALES_EXECUTIVE: 'Junior Sales Executive',
};

export const SUSPENSION_REASONS: SalesSuspensionReason[] = [
  'INACTIVE',
  'RESIGNED',
  'TERMINATED',
  'ON_LEAVE',
  'TRANSFERRED',
  'OTHER',
];

export const SUSPENSION_REASON_LABELS: Record<SalesSuspensionReason, string> = {
  INACTIVE: 'Inactive',
  RESIGNED: 'Resigned',
  TERMINATED: 'Terminated',
  ON_LEAVE: 'On leave',
  TRANSFERRED: 'Transferred',
  OTHER: 'Other',
};

export function isActiveMember(member: { status?: SalesTeamStatus }) {
  return (member.status ?? 'ACTIVE') === 'ACTIVE';
}
