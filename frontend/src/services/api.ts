import axios, { AxiosResponse } from 'axios';
import { ApiResponse, LoginRequest, LoginResponse, User, Customer, Quotation, PriceCategory, PriceItem, PaginationParams, PaginatedResponse } from '../types';

// Auto-detect production environment for Netlify deployment
const isProduction = window.location.hostname.includes('netlify.app') || window.location.hostname.includes('suanhasaigon247-manager');
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (isProduction ? 'https://suanhasaigon247-manager.onrender.com/api' : 'http://localhost:8000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug logging for login requests
    if (config.url === '/auth/login') {
      console.log('🔧 REQUEST INTERCEPTOR - Full config:', config);
      console.log('🔧 REQUEST INTERCEPTOR - Request data:', config.data);
      console.log('🔧 REQUEST INTERCEPTOR - Data type:', typeof config.data);
      console.log('🔧 REQUEST INTERCEPTOR - Data stringified:', JSON.stringify(config.data));
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    console.log('🚀 API login called with:', credentials);
    console.log('🚀 Sending POST to:', '/auth/login');
    console.log('🚀 Request data:', JSON.stringify(credentials));
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Customer API
export const customerAPI = {
  getCustomers: async (params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Customer>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Customer>>> = await api.get('/customers', { params });
    return response.data;
  },

  getCustomer: async (id: string): Promise<ApiResponse<Customer>> => {
    const response: AxiosResponse<ApiResponse<Customer>> = await api.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> => {
    const response: AxiosResponse<ApiResponse<Customer>> = await api.post('/customers', customer);
    return response.data;
  },

  updateCustomer: async (id: string, customer: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const response: AxiosResponse<ApiResponse<Customer>> = await api.put(`/customers/${id}`, customer);
    return response.data;
  },

  deleteCustomer: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(`/customers/${id}`);
    return response.data;
  }
};

// Quotation API
export const quotationAPI = {
  getQuotations: async (params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Quotation>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Quotation>>> = await api.get('/quotations', { params });
    return response.data;
  },

  getQuotation: async (id: string): Promise<ApiResponse<Quotation>> => {
    const response: AxiosResponse<ApiResponse<Quotation>> = await api.get(`/quotations/${id}`);
    return response.data;
  },

  createQuotation: async (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Quotation>> => {
    const response: AxiosResponse<ApiResponse<Quotation>> = await api.post('/quotations', quotation);
    return response.data;
  },

  updateQuotation: async (id: string, quotation: Partial<Quotation>): Promise<ApiResponse<Quotation>> => {
    const response: AxiosResponse<ApiResponse<Quotation>> = await api.put(`/quotations/${id}`, quotation);
    return response.data;
  },

  deleteQuotation: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(`/quotations/${id}`);
    return response.data;
  }
};

// Price API
export const priceAPI = {
  getCategories: async (params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<PriceCategory>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<PriceCategory>>> = await api.get('/prices/categories', { params });
    return response.data;
  },

  getCategory: async (id: string): Promise<ApiResponse<PriceCategory>> => {
    const response: AxiosResponse<ApiResponse<PriceCategory>> = await api.get(`/prices/categories/${id}`);
    return response.data;
  },

  createCategory: async (category: Omit<PriceCategory, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'creator'>): Promise<ApiResponse<PriceCategory>> => {
    const response: AxiosResponse<ApiResponse<PriceCategory>> = await api.post('/prices/categories', category);
    return response.data;
  },

  updateCategory: async (id: string, category: Partial<PriceCategory>): Promise<ApiResponse<PriceCategory>> => {
    const response: AxiosResponse<ApiResponse<PriceCategory>> = await api.put(`/prices/categories/${id}`, category);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(`/prices/categories/${id}`);
    return response.data;
  },

  getItems: async (params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<PriceItem>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<PriceItem>>> = await api.get('/prices/items', { params });
    return response.data;
  },

  createItem: async (item: Omit<PriceItem, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<ApiResponse<PriceItem>> => {
    const response: AxiosResponse<ApiResponse<PriceItem>> = await api.post('/prices/items', item);
    return response.data;
  },

  updateItem: async (id: string, item: Partial<PriceItem>): Promise<ApiResponse<PriceItem>> => {
    const response: AxiosResponse<ApiResponse<PriceItem>> = await api.put(`/prices/items/${id}`, item);
    return response.data;
  },

  deleteItem: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(`/prices/items/${id}`);
    return response.data;
  }
};

// User API
export const userAPI = {
  getUsers: async (params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<User>>> = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.post('/users', user);
    return response.data;
  },

  updateUser: async (id: string, user: Partial<User>): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/users/${id}`, user);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(`/users/${id}`);
    return response.data;
  },

  changePassword: async (id: string, passwords: { currentPassword: string; newPassword: string }): Promise<ApiResponse<void>> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.put(`/users/${id}/change-password`, passwords);
    return response.data;
  },

  toggleUserStatus: async (id: string): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/users/${id}/toggle-status`);
    return response.data;
  }
};

export { api };
export default api;

