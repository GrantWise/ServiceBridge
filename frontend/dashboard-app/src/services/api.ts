import axios, { AxiosInstance } from 'axios';
import {
  Product,
  ScanTransaction,
  CreateScanRequest,
  CreateScanResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  PaginatedResponse,
  ProductsQueryParams,
  TransactionsQueryParams,
  LoginRequest,
  LoginResponse,
  LiveMetrics,
  ApiError,
} from '@/types/api';

/**
 * API Configuration Interface
 * Following Interface Segregation Principle
 */
interface ApiConfig {
  baseURL: string;
  timeout: number;
}

/**
 * Base API Service Class
 * Following Single Responsibility Principle - handles only HTTP communication
 * Following Dependency Inversion Principle - depends on abstractions (interfaces)
 */
class BaseApiService {
  protected client: AxiosInstance;

  constructor(config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      config => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: any): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || 'An error occurred',
        errors: error.response.data?.errors,
        statusCode: error.response.status,
      };
    }
    return {
      message: error.message || 'Network error',
      statusCode: 0,
    };
  }

  protected get<T>(url: string, params?: any): Promise<T> {
    return this.client.get<T>(url, { params }).then(response => response.data);
  }

  protected post<T>(url: string, data?: any): Promise<T> {
    return this.client.post<T>(url, data).then(response => response.data);
  }

  protected put<T>(url: string, data?: any): Promise<T> {
    return this.client.put<T>(url, data).then(response => response.data);
  }

  protected delete<T>(url: string): Promise<T> {
    return this.client.delete<T>(url).then(response => response.data);
  }
}

/**
 * Products API Service
 * Following Single Responsibility Principle - handles only product-related API calls
 */
class ProductsApiService extends BaseApiService {
  getProducts(params?: ProductsQueryParams): Promise<PaginatedResponse<Product>> {
    return this.get<PaginatedResponse<Product>>('/products', params);
  }

  getProduct(productCode: string): Promise<Product> {
    return this.get<Product>(`/products/${productCode}`);
  }

  updateProduct(
    productCode: string,
    data: UpdateProductRequest
  ): Promise<UpdateProductResponse> {
    return this.put<UpdateProductResponse>(
      `/products/${productCode}`,
      data
    );
  }

  submitScan(
    productCode: string,
    data: CreateScanRequest
  ): Promise<CreateScanResponse> {
    return this.post<CreateScanResponse>(
      `/products/${productCode}/scan`,
      data
    );
  }
}

/**
 * Transactions API Service
 * Following Single Responsibility Principle - handles only transaction-related API calls
 */
class TransactionsApiService extends BaseApiService {
  getTransactions(
    params?: TransactionsQueryParams
  ): Promise<PaginatedResponse<ScanTransaction>> {
    return this.get<PaginatedResponse<ScanTransaction>>(
      '/transactions',
      params
    );
  }

  getRecentTransactions(): Promise<ScanTransaction[]> {
    return this.get<ScanTransaction[]>('/transactions/recent');
  }

  getProductTransactions(
    productCode: string
  ): Promise<PaginatedResponse<ScanTransaction>> {
    return this.get<PaginatedResponse<ScanTransaction>>(
      `/transactions/product/${productCode}`
    );
  }
}

/**
 * Authentication API Service
 * Following Single Responsibility Principle - handles only auth-related API calls
 */
class AuthApiService extends BaseApiService {
  login(data: LoginRequest): Promise<LoginResponse> {
    return this.post<LoginResponse>('/auth/login', data);
  }

  logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    return Promise.resolve();
  }
}

/**
 * Metrics API Service
 * Following Single Responsibility Principle - handles only metrics-related API calls
 */
class MetricsApiService extends BaseApiService {
  getLiveMetrics(): Promise<LiveMetrics> {
    return this.get<LiveMetrics>('/metrics/live');
  }
}

// Service instances - Following Dependency Injection pattern
const apiConfig: ApiConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5196/api/v1',
  timeout: 10000,
};

export const productsApi = new ProductsApiService(apiConfig);
export const transactionsApi = new TransactionsApiService(apiConfig);
export const authApi = new AuthApiService(apiConfig);
export const metricsApi = new MetricsApiService(apiConfig);