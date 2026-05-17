export type CustomerStatus = 'NEW' | 'OLD' | 'ACTIVE' | 'INACTIVE';

export interface CustomerContact {
  id: string;
  contact: string;
  email: string;
  phone: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
  salesPersonId: string | null;
  salesPersonName: string | null;
  additionalContacts?: CustomerContact[];
}

export interface Engineer {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
}

export interface Inquiry {
  id: string;
  serialNo: number;
  inquiryReceivedDate: string | null;
  modeOfInquiry: string | null;
  customerId: string | null;
  customerName: string;
  contactDetails: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  projectName: string | null;
  document: string | null;
  salesPersonId: string | null;
  salesPersonName: string | null;
  quotationRequiredDate: string | null;
  engineerId: string | null;
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

export type InquiryFormData = Omit<Inquiry, 'id' | 'serialNo' | 'salesPersonName' | 'engineer'>;

export type SalesDesignation =
  | 'ASSISTANT_SALES_MANAGER'
  | 'SENIOR_SALES_EXECUTIVE'
  | 'SALES_EXECUTIVE'
  | 'JUNIOR_SALES_EXECUTIVE';

export type SalesTeamStatus = 'ACTIVE' | 'SUSPENDED';

export type SalesSuspensionReason =
  | 'INACTIVE'
  | 'RESIGNED'
  | 'TERMINATED'
  | 'ON_LEAVE'
  | 'TRANSFERRED'
  | 'OTHER';

export interface HeadOfSales {
  id: string;
  name: string;
  department: string;
  createdAt?: string;
  managerCount?: number;
  totalTeamSales?: number;
  salesManagers?: SalesManager[];
}

export interface SalesInquirySummary {
  id: string;
  serialNo: number;
  customerName: string;
  projectName: string | null;
  quotationAmount: number | null;
  inquiryReceivedDate: string | null;
}

export interface SalesPerson {
  id: string;
  name: string;
  designation: SalesDesignation;
  status: SalesTeamStatus;
  suspensionReason?: SalesSuspensionReason | null;
  suspensionNote?: string | null;
  suspendedAt?: string | null;
  history: string[];
  managerId?: string | null;
  managerName?: string | null;
  totalSales?: number;
  inquiries?: SalesInquirySummary[];
}

export interface SalesManager {
  id: string;
  name: string;
  department: string;
  status: SalesTeamStatus;
  suspensionReason?: SalesSuspensionReason | null;
  suspensionNote?: string | null;
  suspendedAt?: string | null;
  headOfSalesId?: string | null;
  headOfSalesName?: string | null;
  createdAt?: string;
  teamSize?: number;
  totalTeamSales?: number;
  salesPersons?: SalesPerson[];
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
    designation: SalesDesignation;
    totalSales: number;
  }[];
}
