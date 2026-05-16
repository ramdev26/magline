export interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

export interface Order {
  id: string;
  customerId: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Shipped' | 'Cancelled';
  category: 'LV' | 'CMS' | 'MEP';
  date: string;
  salesPersonId: string;
}

export interface SalesPerson {
  id: string;
  name: string;
  performance: number;
  history: string[]; // Order IDs
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
}
