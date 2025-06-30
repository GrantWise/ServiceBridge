import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5196/api/v1';

export class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Use httpOnly cookies for authentication
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for logging
    this.instance.interceptors.request.use(
      (config) => {
        // Log request for debugging
        console.debug('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for unified response handling and error handling
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.debug('API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        
        // Unified response unwrapping - handle backend inconsistencies
        response.data = this.unwrapResponse(response.data);
        
        return response;
      },
      async (error) => {
        // Handle authentication errors
        if (error.response?.status === 401) {
          // Unauthorized - emit event for auth system to handle
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        
        // Log error for debugging
        console.error('API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<boolean> {
    try {
      // Note: Backend doesn't currently have refresh endpoint
      // This is a placeholder for when it's implemented
      console.warn('Token refresh not implemented on backend yet');
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  /**
   * Unified response unwrapping to handle backend inconsistencies
   * This centralizes the logic for different response structures
   */
  private unwrapResponse<T = any>(data: any): T {
    // Handle null/undefined data
    if (data === null || data === undefined) {
      return data;
    }
    
    // Handle non-object data (primitives, arrays, etc.)
    if (typeof data !== 'object') {
      return data;
    }
    
    // Handle wrapped success response: { success: true, data: {...} }
    if ('success' in data && 'data' in data && data.success) {
      return data.data;
    }
    
    // Handle paginated response with array data
    if ('data' in data && Array.isArray(data.data)) {
      return {
        ...data,
        items: data.data, // Add expected 'items' property
        data: data.data   // Keep original 'data' property for backward compatibility
      } as T;
    }
    
    // Handle direct object responses (most common case)
    return data;
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  // Utility methods
  getBaseURL(): string {
    return API_BASE_URL;
  }

  // Create URL with query parameters
  createUrl(path: string, params?: Record<string, any>): string {
    const url = new URL(path, API_BASE_URL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }
}

// Create singleton instance
export const apiClient = new ApiClient();