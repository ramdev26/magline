import type { InquiryFollowUpStatus, InquiryFormData } from '../types';

export const MODE_OF_INQUIRY = ['Phone', 'Email', 'Walk-in', 'Website', 'Referral', 'Tender Portal', 'Other'];
export const ONGOING_TENDER = ['Ongoing', 'Tender'];

export const INQUIRY_FOLLOW_UP_STATUSES = [
  'CONSULTANT_REVIEW',
  'DRAWING_CONFIRMATION_SENT',
  'DRAWING_APPROVAL_PENDING',
  'PRICE_NEGOTIATING',
  'PENDING_CONSULTANT_APPROVAL',
  'CHANGES_PROPOSED_BY_MAGLINE',
  'CHANGES_PROPOSED_BY_CLIENT',
  'PENDING_TENDER',
  'TENDER_LOSS',
  'TENDER_WON',
  'OTHER_MATTER',
] as const satisfies readonly InquiryFollowUpStatus[];

export const INQUIRY_FOLLOW_UP_LABELS: Record<InquiryFollowUpStatus, string> = {
  CONSULTANT_REVIEW: 'Consultant review',
  DRAWING_CONFIRMATION_SENT: 'Drawing confirmation sent',
  DRAWING_APPROVAL_PENDING: 'Drawing approval pending',
  PRICE_NEGOTIATING: 'Price negotiating',
  PENDING_CONSULTANT_APPROVAL: 'Pending consultant approval',
  CHANGES_PROPOSED_BY_MAGLINE: 'Changes proposed by Magline',
  CHANGES_PROPOSED_BY_CLIENT: 'Changes proposed by client',
  PENDING_TENDER: 'Pending tender',
  TENDER_LOSS: 'Tender loss',
  TENDER_WON: 'Tender won',
  OTHER_MATTER: 'Other matter',
};

export const emptyFollowUp = () => ({
  status: 'CONSULTANT_REVIEW' as InquiryFollowUpStatus,
  remarks: '',
  followUpDate: '',
  followUpBy: '',
});

export const emptyInquiryForm = (): InquiryFormData => ({
  inquiryReceivedDate: new Date().toISOString().split('T')[0],
  modeOfInquiry: '',
  customerId: null,
  customerName: '',
  contactDetails: '',
  contactPhone: '',
  contactEmail: '',
  projectName: '',
  projectRemark: '',
  documents: [],
  assignee: '',
  salesPersonId: null,
  quotationRequiredDate: '',
  engineerId: null,
  quotationNo: '',
  quotationAmount: null,
  quotationSubmittedDate: '',
  ongoingTender: '',
  jsbNo: '',
  poNo: '',
  poReceivedDate: '',
  awardedParty: '',
  awardedPrice: null,
  remarks: '',
  followUps: [],
  category: 'LV',
});
