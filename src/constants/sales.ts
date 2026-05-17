import type { SalesDesignation } from '../types';

export const SALES_DESIGNATIONS: SalesDesignation[] = [
  'SALES_MANAGER',
  'ASSISTANT_SALES_MANAGER',
  'SENIOR_SALES_EXECUTIVE',
  'SALES_EXECUTIVE',
  'JUNIOR_SALES_EXECUTIVE',
];

export const DESIGNATION_LABELS: Record<SalesDesignation, string> = {
  SALES_MANAGER: 'Sales Manager',
  ASSISTANT_SALES_MANAGER: 'Assistant Sales Manager',
  SENIOR_SALES_EXECUTIVE: 'Senior Sales Executive',
  SALES_EXECUTIVE: 'Sales Executive',
  JUNIOR_SALES_EXECUTIVE: 'Junior Sales Executive',
};
