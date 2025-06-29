import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
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
  RefreshTokenRequest,
  RefreshTokenResponse,
  LiveMetrics,
  ApiError,
} from '../../../types/api';
import { env } from '../../../config/env';
import { errorHandler } from './errorHandler';
import { logger } from './logger';
import { authService } from '../../auth/services/authService';
import { csrfService } from './csrfService';
import { requestSigner } from './requestSigner';
import { rateLimiter } from './rateLimiter';

// Extend the request config to include our custom property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

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
    // Request interceptor for auth token and security
    this.client.interceptors.request.use(
      async config => {
        // Add auth token from authService
        const token = authService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add CSRF token for state-changing requests
        if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
          Object.assign(config.headers, csrfService.getHeader());
        }
        
        // Add request signing for sensitive operations
        if (requestSigner.shouldSignRequest(config.method?.toUpperCase() || 'GET', config.url || '')) {
          const signatureHeaders = await requestSigner.signRequest(
            config.method?.toUpperCase() || 'GET',
            config.url || '',
            config.data,
            authService.getState().user?.id
          );
          Object.assign(config.headers, signatureHeaders);
        }
        
        // Check rate limits
        if (!rateLimiter.checkLimit(config.url || '')) {
          const error = new Error('Rate limit exceeded. Please try again later.');
          errorHandler.handleError(error, { operation: 'rateLimitExceeded' });
          return Promise.reject(error);
        }
        
        // Log API calls
        logger.logApiCall(
          config.method?.toUpperCase() || 'GET',
          config.url || '',
        );
        
        return config;
      },
      error => {
        errorHandler.handleError(error, { operation: 'apiRequest' });
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => {
        // Log successful response
        logger.logApiCall(
          response.config.method?.toUpperCase() || 'GET',
          response.config.url || '',
          response.status
        );
        return response;
      },
      async (error: AxiosError) => {
        // Log error response
        logger.logApiCall(
          error.config?.method?.toUpperCase() || 'GET',
          error.config?.url || '',
          error.response?.status
        );
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          logger.warn('Authentication required or expired');
          
          // Try to refresh token first
          try {
            await authService.forceRefresh();
            // Retry the original request with new token
            const originalRequest = error.config as ExtendedAxiosRequestConfig;
            if (originalRequest && !originalRequest._retry) {
              originalRequest._retry = true;
              const token = authService.getAccessToken();
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            }
          } catch (_refreshError) {
            // Refresh failed, logout user
            await authService.logout();
            window.location.href = '/login';
          }
        }
        
        // Handle authorization errors
        if (error.response?.status === 403) {
          logger.warn('Access forbidden', {
            url: error.config?.url,
            method: error.config?.method,
          });
          
          // Check if CSRF token needs refresh
          const errorData = error.response.data as { code?: string };
          if (errorData?.code === 'CSRF_INVALID') {
            await csrfService.refreshToken();
            logger.info('CSRF token refreshed, retry the request');
          }
        }
        
        errorHandler.handleError(error, { 
          operation: 'apiResponse',
          metadata: {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
          }
        });
        
        return Promise.reject(this.formatError(error as AxiosError<ApiError>));
      }
    );
  }

  private formatError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return {
        message: error.response.data.message || 'An error occurred',
        errors: error.response.data.errors,
        statusCode: error.response.status,
      };
    }
    
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timed out',
        statusCode: 0,
      };
    }
    
    return {
      message: error.message || 'Network error',
      statusCode: 0,
    };
  }

  protected get<T>(url: string, params?: unknown): Promise<T> {
    return this.client.get<T>(url, { params }).then(response => response.data);
  }

  protected post<T>(url: string, data?: unknown): Promise<T> {
    return this.client.post<T>(url, data).then(response => response.data);
  }

  protected put<T>(url: string, data?: unknown): Promise<T> {
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

  refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.post<RefreshTokenResponse>('/auth/refresh', data);
  }

  logout(): Promise<void> {
    // In the future, this might call a logout endpoint to invalidate the token server-side
    return this.post<void>('/auth/logout').catch(() => {
      // Even if logout fails, we proceed with local cleanup
    });
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
  baseURL: env.VITE_API_URL,
  timeout: 10000,
};

export const productsApi = new ProductsApiService(apiConfig);
export const transactionsApi = new TransactionsApiService(apiConfig);
export const authApi = new AuthApiService(apiConfig);
export const metricsApi = new MetricsApiService(apiConfig);