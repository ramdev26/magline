import type { InquiryFormData } from '../types';

export const MODE_OF_INQUIRY = ['Phone', 'Email', 'Walk-in', 'Website', 'Referral', 'Tender Portal', 'Other'];
export const ONGOING_TENDER = ['Ongoing', 'Tender'];

export const emptyInquiryForm = (): InquiryFormData => ({
  inquiryReceivedDate: new Date().toISOString().split('T')[0],
  modeOfInquiry: '',
  customerId: null,
  customerName: '',
  contactDetails: '',
  projectName: '',
  document: '',
  salesPersonId: null,
  quotationRequiredDate: '',
  engineer: '',
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
  category: 'LV',
});
