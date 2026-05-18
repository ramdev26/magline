export type CustomerLifecycleStatus = 'NEW' | 'OLD';
export type CustomerActivityStatus = 'ACTIVE' | 'INACTIVE';
/** @deprecated Legacy combined status; prefer lifecycleStatus + activityStatus */
export type CustomerStatus = CustomerLifecycleStatus | CustomerActivityStatus | 'ACTIVE' | 'INACTIVE';

export interface CustomerContact {
  id: string;
  contact: string;
  designation: string;
  email: string;
  phone: string;
}

export type SalesAssigneeType = 'person' | 'manager' | 'head';

export interface Customer {
  id: string;
  name: string;
  contact: string;
  contactDesignation: string;
  email: string;
  phone: string;
  address: string;
  lifecycleStatus: CustomerLifecycleStatus;
  activityStatus: CustomerActivityStatus;
  assigneeType: SalesAssigneeType | null;
  assigneeId: string | null;
  salesPersonId: string | null;
  salesPersonName: string | null;
  createdAt?: string;
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

export interface WorkInProgress {
  id: string;
  serialNo: number;
  date: string | null;
  jobNo: string | null;
  poNo: string | null;
  quotationNo: string | null;
  customerId: string | null;
  customerName: string;
  salesPersonId: string | null;
  salesPersonName: string | null;
  category: 'LV' | 'CMS' | 'MEP' | null;
  orderDescription: string;
  unit: string;
  quantity: number;
  rate: number;
  discount: number;
  vatPercent: number;
  amount: number;
  vat: number;
  total: number;
  paymentStatus:
    | 'NOT_PAID'
    | 'PAID_0_10'
    | 'PAID_10_50'
    | 'PAID_50_75'
    | 'PAID_75_99'
    | 'PAID_FULLY'
    | 'CREDIT_30_DAYS'
    | 'FULLY_ON_DELIVERY';
  productionStages: string[];
  deliveryStages: string[];
  delayReason: 'COLOR_MISMATCHED' | 'COST_ISSUES' | 'ITEM_MISTAKES' | 'FACTORY_PRODUCTION' | null;
  delayNote: string | null;
  returnReason: 'DAMAGED' | 'WRONG_CHANNEL' | 'PRODUCTION' | null;
  returnNote: string | null;
  notes: string | null;
  createdAt?: string;
}

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
