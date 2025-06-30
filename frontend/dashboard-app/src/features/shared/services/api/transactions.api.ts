import { apiClient } from './apiClient';
import {
  ScanTransaction,
  PaginatedResponse,
  GetTransactionsQuery,
} from '../types/api.types';

export const transactionsApi = {
  // Get paginated list of transactions
  async getTransactions(query: GetTransactionsQuery = {}): Promise<PaginatedResponse<ScanTransaction>> {
    try {
      const params = {
        pageNumber: query.pageNumber || 1,
        pageSize: query.pageSize || 50,
        productCode: query.productCode,
        startDate: query.startDate,
        endDate: query.endDate,
        transactionType: query.transactionType,
        scannedBy: query.scannedBy,
      };

      const response = await apiClient.get<PaginatedResponse<ScanTransaction>>('/transactions', { params });
      
      // Ensure consistent response structure
      return {
        data: Array.isArray(response.data) ? response.data : [],
        totalCount: response.totalCount || 0,
        pageNumber: response.pageNumber || 1,
        pageSize: response.pageSize || 50,
        totalPages: response.totalPages || 1,
        hasNextPage: response.hasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || false,
      };
    } catch (error) {
      console.warn('Failed to fetch transactions:', error);
      // Return empty paginated response on error
      return {
        data: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: query.pageSize || 50,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
  },

  // Get transactions for a specific product
  async getProductTransactions(productCode: string, limit: number = 20): Promise<ScanTransaction[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<ScanTransaction>>('/transactions', {
        params: {
          productCode,
          pageSize: limit,
          pageNumber: 1,
        },
      });
      
      // Use data property (backend standard) - apiClient unwrapper provides both data and items
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('Failed to fetch product transactions:', error);
      return [];
    }
  },

  // Get recent transactions (for activity feed)
  async getRecentTransactions(limit: number = 50): Promise<ScanTransaction[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<ScanTransaction>>('/transactions', {
        params: {
          pageSize: limit,
          pageNumber: 1,
          sortBy: 'scanDateTime',
          sortDirection: 'desc',
        },
      });
      
      // Use data property (backend standard) - apiClient unwrapper provides both data and items
      // Ensure we always return an array, never undefined
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('Failed to fetch recent transactions:', error);
      // Return empty array on error to prevent undefined issues
      return [];
    }
  },

  // Get transactions by user
  async getUserTransactions(userId: string, limit: number = 50): Promise<ScanTransaction[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<ScanTransaction>>('/transactions', {
        params: {
          scannedBy: userId,
          pageSize: limit,
          pageNumber: 1,
          sortBy: 'scanDateTime',
          sortDirection: 'desc',
        },
      });
      
      // Use data property (backend standard) - apiClient unwrapper provides both data and items
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('Failed to fetch user transactions:', error);
      return [];
    }
  },

  // Get transaction statistics
  async getTransactionStats(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    // Note: This endpoint doesn't exist yet in backend, but would be useful
    // return apiClient.get('/transactions/stats', { params });
    
    // For now, return mock data
    return {
      totalTransactions: 1247,
      todayTransactions: 89,
      averageDailyTransactions: 156,
      topProducts: [
        { productCode: 'ABC123', transactionCount: 45 },
        { productCode: 'DEF456', transactionCount: 38 },
        { productCode: 'GHI789', transactionCount: 32 },
      ],
    };
  },
};

export default transactionsApi;