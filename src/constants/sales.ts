import type { SalesDesignation } from '../types';

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
