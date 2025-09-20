export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Customer {
  id: string;
  customerName: string;
  companyName: string;
  phone: string;
  email?: string;
  memo?: string;
  lastContactDate?: string;
  createdAt: string;
  updatedAt: string;
  addresses: CustomerAddress[];
  quotations?: Quotation[];
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  name: string;
  address: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerAddressId: string;
  status: 'DRAFT' | 'REVIEWED' | 'SENT' | 'CONTRACTED' | 'CANCELLED';
  materialCost: number;
  laborCost: number;
  travelCost: number;
  marginRate: number;
  subtotal: number;
  tax: number;
  total: number;
  createdBy: string;
  sentAt?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  customerAddress: CustomerAddress;
  creator: User;
  items: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  categoryId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  laborHours: number;
  category: PriceCategory;
}

export interface PriceCategory {
  id: string | number;
  name: string;
  description?: string; // 설명 필드 추가
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  creator?: User;
  items?: PriceItem[];
}

export interface PriceItem {
  id: string | number;
  categoryId: string | number;
  name: string;
  itemName?: string; // 기존 호환성을 위해 유지
  unit: string;
  unitPrice: number;
  baseCost?: number; // 원가 필드 추가
  laborHours?: number;
  description?: string; // 설명 필드 추가
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: PriceCategory;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type Language = 'ko' | 'vi';

