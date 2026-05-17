import type { WipSummaryStatus } from '../constants/wip';
import type { WorkInProgress } from '../types';

export function getWipSummaryStatus(row: WorkInProgress): WipSummaryStatus {
  if (row.delayReason || row.returnReason) return 'delayed';
  if (row.deliveryStages?.includes('DELIVERED')) return 'delivered';
  if ((row.deliveryStages?.length ?? 0) > 0) return 'awaiting_delivery';
  return 'in_production';
}

export function computeWipTotals(row: {
  quantity: number | string | null | undefined;
  rate: number | string | null | undefined;
  discount: number | string | null | undefined;
  vatPercent: number | string | null | undefined;
}) {
  const qty = Number(row.quantity ?? 0) || 0;
  const rate = Number(row.rate ?? 0) || 0;
  const discount = Number(row.discount ?? 0) || 0;
  const vatPercent = Number(row.vatPercent ?? 0) || 0;
  const subtotal = qty * rate;
  const amount = Math.max(0, subtotal - discount);
  const vat = (amount * vatPercent) / 100;
  const total = amount + vat;
  return { subtotal, amount, vat, total };
}
