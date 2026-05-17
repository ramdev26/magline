import type { Inquiry } from '../types';

export type InquiryWorkflowStatus = 'in_preparation' | 'delay' | 'sent' | 'po_received';

const MS_24H = 24 * 60 * 60 * 1000;

type WorkflowFields = Pick<
  Inquiry,
  'poNo' | 'poReceivedDate' | 'quotationSubmittedDate' | 'inquiryReceivedDate'
>;

export function hasQuotationSubmitted(row: { quotationSubmittedDate: string | null }) {
  return Boolean(row.quotationSubmittedDate?.trim());
}

export function hasPoReceived(row: { poNo: string | null; poReceivedDate?: string | null }) {
  return Boolean(row.poNo?.trim() || row.poReceivedDate?.trim());
}

/** No quotation submitted and inquiry received more than 24 hours ago. */
export function isInquiryDelayed(row: WorkflowFields, nowMs: number = Date.now()) {
  if (hasQuotationSubmitted(row) || hasPoReceived(row)) return false;
  if (!row.inquiryReceivedDate?.trim()) return false;
  const received = new Date(row.inquiryReceivedDate);
  if (Number.isNaN(received.getTime())) return false;
  return nowMs - received.getTime() > MS_24H;
}

/** Derived automatically from inquiry / quotation / PO dates — never stored manually. */
export function getInquiryWorkflowStatus(
  row: WorkflowFields,
  nowMs: number = Date.now()
): InquiryWorkflowStatus {
  if (hasPoReceived(row)) return 'po_received';
  if (hasQuotationSubmitted(row)) return 'sent';
  if (isInquiryDelayed(row, nowMs)) return 'delay';
  return 'in_preparation';
}

export const INQUIRY_WORKFLOW_AUTO_HINT =
  'Status is calculated automatically from inquiry received, quotation submitted, and PO dates.';

export const INQUIRY_WORKFLOW_META: Record<
  InquiryWorkflowStatus,
  { label: string; className: string; tone: string; filter: InquiryWorkflowStatus }
> = {
  in_preparation: {
    label: 'In Preparation',
    className: 'bg-slate-100 text-slate-800 border-slate-200',
    tone: 'bg-slate-50 border-slate-200',
    filter: 'in_preparation',
  },
  delay: {
    label: 'Delay',
    className: 'bg-red-100 text-red-800 border-red-200',
    tone: 'bg-red-50 border-red-100',
    filter: 'delay',
  },
  sent: {
    label: 'Sent',
    className: 'bg-sky-100 text-sky-800 border-sky-200',
    tone: 'bg-sky-50 border-sky-100',
    filter: 'sent',
  },
  po_received: {
    label: 'PO Received',
    className: 'bg-green-100 text-green-800 border-green-200',
    tone: 'bg-green-50 border-green-100',
    filter: 'po_received',
  },
};

export const INQUIRY_WORKFLOW_ORDER: InquiryWorkflowStatus[] = [
  'in_preparation',
  'delay',
  'sent',
  'po_received',
];
