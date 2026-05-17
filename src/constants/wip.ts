export const WIP_PAYMENT_STATUSES = [
  'NOT_PAID',
  'PAID_0_10',
  'PAID_10_50',
  'PAID_50_75',
  'PAID_75_99',
  'PAID_FULLY',
  'CREDIT_30_DAYS',
  'FULLY_ON_DELIVERY',
] as const;

export type WipPaymentStatus = (typeof WIP_PAYMENT_STATUSES)[number];

export const WIP_PAYMENT_STATUS_LABELS: Record<WipPaymentStatus, string> = {
  NOT_PAID: 'Not paid',
  PAID_0_10: 'Paid 0–10%',
  PAID_10_50: 'Paid 10–50%',
  PAID_50_75: 'Paid 50–75%',
  PAID_75_99: 'Paid 75–99%',
  PAID_FULLY: 'Paid fully',
  CREDIT_30_DAYS: 'Credit 30 days',
  FULLY_ON_DELIVERY: 'Fully on delivery',
};

export const WIP_PAYMENT_STATUS_BADGE: Record<WipPaymentStatus, string> = {
  NOT_PAID: 'bg-slate-100 text-slate-600 ring-slate-200',
  PAID_0_10: 'bg-rose-50 text-rose-700 ring-rose-100',
  PAID_10_50: 'bg-orange-50 text-orange-700 ring-orange-100',
  PAID_50_75: 'bg-amber-50 text-amber-700 ring-amber-100',
  PAID_75_99: 'bg-lime-50 text-lime-700 ring-lime-100',
  PAID_FULLY: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  CREDIT_30_DAYS: 'bg-blue-50 text-blue-700 ring-blue-100',
  FULLY_ON_DELIVERY: 'bg-violet-50 text-violet-700 ring-violet-100',
};

export const WIP_PRODUCTION_STAGES = [
  'PENDING',
  'WELDING',
  'FABRICATION',
  'COLOR_CODE',
  'POWDER_COATING',
  'GALVANIZING',
  'FOAM_FILLING',
  'ELECTRICAL',
  'TO_OUTSOURCE',
] as const;

export type WipProductionStage = (typeof WIP_PRODUCTION_STAGES)[number];

export const WIP_PRODUCTION_STAGE_LABELS: Record<WipProductionStage, string> = {
  PENDING: 'Pending',
  WELDING: 'Welding',
  FABRICATION: 'Fabrication',
  COLOR_CODE: 'Color / Code',
  POWDER_COATING: 'Powder coating',
  GALVANIZING: 'Galvanizing',
  FOAM_FILLING: 'Foam filling',
  ELECTRICAL: 'Electrical',
  TO_OUTSOURCE: 'To outsource',
};

export const WIP_DELIVERY_STAGES = [
  'RECEIVING_FROM_OUTSOURCE',
  'ASKED_BY_CLIENT',
  'PLANNED_TO_CLIENT',
  'DELIVERED',
] as const;

export type WipDeliveryStage = (typeof WIP_DELIVERY_STAGES)[number];

export const WIP_DELIVERY_STAGE_LABELS: Record<WipDeliveryStage, string> = {
  RECEIVING_FROM_OUTSOURCE: 'Receiving from outsource',
  ASKED_BY_CLIENT: 'Asked by client',
  PLANNED_TO_CLIENT: 'Planned to client',
  DELIVERED: 'Delivered',
};

export const WIP_DELAY_REASONS = [
  'COLOR_MISMATCHED',
  'COST_ISSUES',
  'ITEM_MISTAKES',
  'FACTORY_PRODUCTION',
] as const;

export type WipDelayReason = (typeof WIP_DELAY_REASONS)[number];

export const WIP_DELAY_REASON_LABELS: Record<WipDelayReason, string> = {
  COLOR_MISMATCHED: 'Color mismatched',
  COST_ISSUES: 'Cost issues',
  ITEM_MISTAKES: 'Item mistakes',
  FACTORY_PRODUCTION: 'Factory production',
};

export const WIP_RETURN_REASONS = ['DAMAGED', 'WRONG_CHANNEL', 'PRODUCTION'] as const;

export type WipReturnReason = (typeof WIP_RETURN_REASONS)[number];

export const WIP_RETURN_REASON_LABELS: Record<WipReturnReason, string> = {
  DAMAGED: 'Damaged',
  WRONG_CHANNEL: 'Wrong channel',
  PRODUCTION: 'Production',
};

export const WIP_CATEGORIES = ['LV', 'CMS', 'MEP'] as const;
export type WipCategory = (typeof WIP_CATEGORIES)[number];

export type WipSummaryStatus = 'in_production' | 'awaiting_delivery' | 'delivered' | 'delayed';

export const WIP_SUMMARY_ORDER: WipSummaryStatus[] = [
  'in_production',
  'awaiting_delivery',
  'delivered',
  'delayed',
];

export const WIP_SUMMARY_META: Record<
  WipSummaryStatus,
  { label: string; tone: string }
> = {
  in_production: {
    label: 'In production',
    tone: 'bg-sky-50 border-sky-100',
  },
  awaiting_delivery: {
    label: 'Awaiting delivery',
    tone: 'bg-amber-50 border-amber-100',
  },
  delivered: {
    label: 'Delivered',
    tone: 'bg-emerald-50 border-emerald-100',
  },
  delayed: {
    label: 'Delayed / returned',
    tone: 'bg-rose-50 border-rose-100',
  },
};

export const WIP_SUMMARY_HINT =
  'Auto status: In production while production stages are active; Awaiting delivery once delivery starts; Delivered when marked delivered; Delayed if a delay reason or return is set.';
