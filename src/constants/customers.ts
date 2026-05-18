import type { CustomerActivityStatus, CustomerLifecycleStatus } from '../types';

/** Primary customer summary buckets shown on the registry. */
export const CUSTOMER_SUMMARY_STATUSES = ['NEW', 'ACTIVE', 'INACTIVE'] as const;

export type CustomerSummaryStatus = (typeof CUSTOMER_SUMMARY_STATUSES)[number];

export const CUSTOMER_LIFECYCLE_LABELS: Record<CustomerLifecycleStatus, string> = {
  NEW: 'New',
  OLD: 'Old',
};

export const CUSTOMER_ACTIVITY_LABELS: Record<CustomerActivityStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const CUSTOMER_LIFECYCLE_BADGE: Record<CustomerLifecycleStatus, string> = {
  NEW: 'bg-sky-50 text-sky-700 ring-sky-100',
  OLD: 'bg-amber-50 text-amber-700 ring-amber-100',
};

export const CUSTOMER_ACTIVITY_BADGE: Record<CustomerActivityStatus, string> = {
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
  'New = recently registered; Active/Inactive = engagement. A customer can be New and Active (or Inactive) at the same time. Counts use the selected registration period.';
