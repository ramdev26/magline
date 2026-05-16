export interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

export interface Inquiry {
  id: string;
  serialNo: number;
  inquiryReceivedDate: string | null;
  modeOfInquiry: string | null;
  customerId: string | null;
  customerName: string;
  contactDetails: string | null;
  projectName: string | null;
  document: string | null;
  salesPersonId: string | null;
  salesPersonName: string | null;
  quotationRequiredDate: string | null;
  engineer: string | null;
  quotationNo: string | null;
  quotationAmount: number | null;
  quotationSubmittedDate: string | null;
  ongoingTender: string | null;
  jsbNo: string | null;
  poNo: string | null;
  poReceivedDate: string | null;
  awardedParty: string | null;
  awardedPrice: number | null;
  remarks: string | null;
  category: 'LV' | 'CMS' | 'MEP' | null;
}

export type InquiryFormData = Omit<Inquiry, 'id' | 'serialNo' | 'salesPersonName'>;

export interface SalesPerson {
  id: string;
  name: string;
  performance: number;
  history: string[];
  managerId?: string | null;
  managerName?: string | null;
  totalSales?: number;
}

export interface SalesManager {
  id: string;
  name: string;
  department: string;
}

export interface DashboardStats {
  totalSales: number;
  activeOrders: number;
  totalCustomers: number;
  statsByCategory: { name: string; value: number }[];
  recentOrders: {
    id: string;
    serialNo: number;
    customerName: string;
    projectName: string | null;
    amount: number;
    date: string;
    ongoingTender: string | null;
    category: string | null;
  }[];
  topSalesPersons: {
    id: string;
    name: string;
    performance: number;
    totalSales: number;
  }[];
}
