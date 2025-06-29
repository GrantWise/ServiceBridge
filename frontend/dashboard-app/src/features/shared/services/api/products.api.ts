import { apiClient } from './apiClient';
import {
  Product,
  PaginatedResponse,
  GetProductsQuery,
  UpdateProductRequest,
  UpdateProductResponse,
  BulkUpdateRequest,
  BulkUpdateResponse,
  CreateScanRequest,
  CreateScanResponse,
} from '../types/api.types';

export const productsApi = {
  // Get paginated list of products
  async getProducts(query: GetProductsQuery = {}): Promise<PaginatedResponse<Product>> {
    const params = {
      pageNumber: query.pageNumber || 1,
      pageSize: query.pageSize || 50,
      search: query.search,
      stockStatus: query.stockStatus,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    };

    return apiClient.get<PaginatedResponse<Product>>('/api/v1/products', { params });
  },

  // Get single product by code
  async getProduct(productCode: string): Promise<Product> {
    return apiClient.get<Product>(`/api/v1/products/${encodeURIComponent(productCode)}`);
  },

  // Update single product
  async updateProduct(productCode: string, request: UpdateProductRequest): Promise<UpdateProductResponse> {
    return apiClient.put<UpdateProductResponse>(
      `/api/v1/products/${encodeURIComponent(productCode)}`,
      request
    );
  },

  // Bulk update products
  async bulkUpdateProducts(request: BulkUpdateRequest): Promise<BulkUpdateResponse> {
    return apiClient.put<BulkUpdateResponse>('/api/v1/products/bulk', request);
  },

  // Process scan transaction
  async processScan(productCode: string, request: CreateScanRequest): Promise<CreateScanResponse> {
    return apiClient.post<CreateScanResponse>(
      `/api/v1/products/${encodeURIComponent(productCode)}/scan`,
      request
    );
  },

  // Search products (for autocomplete/typeahead)
  async searchProducts(search: string, limit: number = 10): Promise<Product[]> {
    const response = await apiClient.get<PaginatedResponse<Product>>('/api/v1/products', {
      params: {
        search,
        pageSize: limit,
        pageNumber: 1,
      },
    });
    
    return response.items;
  },

  // Get products by stock status
  async getProductsByStockStatus(stockStatus: number): Promise<Product[]> {
    const response = await apiClient.get<PaginatedResponse<Product>>('/api/v1/products', {
      params: {
        stockStatus,
        pageSize: 1000, // Get all products with this status
        pageNumber: 1,
      },
    });
    
    return response.items;
  },
};

export default productsApi;