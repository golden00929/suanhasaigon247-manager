import { Request } from 'express';
import { User, Role } from '@prisma/client';
export interface AuthenticatedRequest extends Request {
    user?: User;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    role?: Role;
}
export interface CustomerCreateRequest {
    customerName: string;
    companyName: string;
    phone: string;
    email?: string;
    memo?: string;
    addresses: {
        name: string;
        address: string;
        isMain: boolean;
    }[];
}
export interface CustomerUpdateRequest extends Partial<CustomerCreateRequest> {
    id: string;
}
export interface QuotationCreateRequest {
    customerId: string;
    customerAddressId: string;
    items: {
        categoryId: string;
        itemName: string;
        quantity: number;
        unitPrice: number;
    }[];
    materialCost?: number;
    laborCost?: number;
    travelCost?: number;
    marginRate?: number;
    validUntil?: Date;
}
export interface QuotationUpdateRequest extends Partial<QuotationCreateRequest> {
    id: string;
    status?: 'DRAFT' | 'REVIEWED' | 'SENT' | 'CONTRACTED' | 'CANCELLED';
}
export interface PriceCategoryCreateRequest {
    name: string;
    items: {
        itemName: string;
        unit: string;
        unitPrice: number;
        laborHours?: number;
    }[];
}
export interface PriceCategoryUpdateRequest extends Partial<PriceCategoryCreateRequest> {
    id: string;
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
//# sourceMappingURL=index.d.ts.map