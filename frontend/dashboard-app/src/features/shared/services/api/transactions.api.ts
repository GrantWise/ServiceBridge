import { apiClient } from './apiClient';
import {
  ScanTransaction,
  PaginatedResponse,
  GetTransactionsQuery,
} from '../types/api.types';

export const transactionsApi = {
  // Get paginated list of transactions
  async getTransactions(query: GetTransactionsQuery = {}): Promise<PaginatedResponse<ScanTransaction>> {
    const params = {
      pageNumber: query.pageNumber || 1,
      pageSize: query.pageSize || 50,
      productCode: query.productCode,
      startDate: query.startDate,
      endDate: query.endDate,
      transactionType: query.transactionType,
      scannedBy: query.scannedBy,
    };

    return apiClient.get<PaginatedResponse<ScanTransaction>>('/api/v1/transactions', { params });
  },

  // Get transactions for a specific product
  async getProductTransactions(productCode: string, limit: number = 20): Promise<ScanTransaction[]> {
    const response = await apiClient.get<PaginatedResponse<ScanTransaction>>('/api/v1/transactions', {
      params: {
        productCode,
        pageSize: limit,
        pageNumber: 1,
      },
    });
    
    return response.items;
  },

  // Get recent transactions (for activity feed)
  async getRecentTransactions(limit: number = 50): Promise<ScanTransaction[]> {
    const response = await apiClient.get<PaginatedResponse<ScanTransaction>>('/api/v1/transactions', {
      params: {
        pageSize: limit,
        pageNumber: 1,
        sortBy: 'scanDateTime',
        sortDirection: 'desc',
      },
    });
    
    return response.items;
  },

  // Get transactions by user
  async getUserTransactions(userId: string, limit: number = 50): Promise<ScanTransaction[]> {
    const response = await apiClient.get<PaginatedResponse<ScanTransaction>>('/api/v1/transactions', {
      params: {
        scannedBy: userId,
        pageSize: limit,
        pageNumber: 1,
        sortBy: 'scanDateTime',
        sortDirection: 'desc',
      },
    });
    
    return response.items;
  },

  // Get transaction statistics
  async getTransactionStats(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    // Note: This endpoint doesn't exist yet in backend, but would be useful
    // return apiClient.get('/api/v1/transactions/stats', { params });
    
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