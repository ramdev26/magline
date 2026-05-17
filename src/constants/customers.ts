import type { CustomerStatus } from '../types';

/** Primary customer summary buckets shown on the registry. */
export const CUSTOMER_SUMMARY_STATUSES = ['NEW', 'ACTIVE', 'INACTIVE'] as const;

export type CustomerSummaryStatus = (typeof CUSTOMER_SUMMARY_STATUSES)[number];

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  NEW: 'New',
  OLD: 'Old',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const CUSTOMER_STATUS_BADGE: Record<CustomerStatus, string> = {
  NEW: 'bg-sky-50 text-sky-700 ring-sky-100',
  OLD: 'bg-amber-50 text-amber-700 ring-amber-100',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  INACTIVE: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export const CUSTOMER_SUMMARY_META: Record<
  CustomerSummaryStatus,
  { label: string; tone: string; filter: CustomerSummaryStatus }
> = {
  NEW: {
    label: 'New customers',
    tone: 'bg-sky-50 border-sky-100',
    filter: 'NEW',
  },
  ACTIVE: {
    label: 'Active customers',
    tone: 'bg-emerald-50 border-emerald-100',
    filter: 'ACTIVE',
  },
  INACTIVE: {
    label: 'Inactive customers',
    tone: 'bg-slate-50 border-slate-200',
    filter: 'INACTIVE',
  },
};

export const CUSTOMER_STATUS_HINT =
  'Counts follow each customer’s status (New, Active, or Inactive) within the selected period, by registration date.';
