import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '../services/api/transactions.api';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import {
  ScanTransaction,
  GetTransactionsQuery,
  TransactionType,
} from '../types/api.types';

// Query Keys
export const TRANSACTIONS_QUERY_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTIONS_QUERY_KEYS.all, 'list'] as const,
  list: (params: GetTransactionsQuery) => [...TRANSACTIONS_QUERY_KEYS.lists(), params] as const,
  product: (productCode: string) => [...TRANSACTIONS_QUERY_KEYS.all, 'product', productCode] as const,
  user: (userId: string) => [...TRANSACTIONS_QUERY_KEYS.all, 'user', userId] as const,
  recent: (limit: number) => [...TRANSACTIONS_QUERY_KEYS.all, 'recent', limit] as const,
  stats: (startDate?: string, endDate?: string) => [...TRANSACTIONS_QUERY_KEYS.all, 'stats', startDate, endDate] as const,
};

// Hook for getting paginated transactions
export function useTransactions(query: GetTransactionsQuery = {}) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: TRANSACTIONS_QUERY_KEYS.list(query),
    queryFn: () => transactionsApi.getTransactions(query),
    enabled: authInitialized && isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for getting transactions for a specific product
export function useProductTransactions(productCode: string, limit: number = 20) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: TRANSACTIONS_QUERY_KEYS.product(productCode),
    queryFn: () => transactionsApi.getProductTransactions(productCode, limit),
    enabled: authInitialized && isAuthenticated && !!productCode,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook for getting recent transactions (for activity feed)
export function useRecentTransactions(limit: number = 50) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: TRANSACTIONS_QUERY_KEYS.recent(limit),
    queryFn: () => transactionsApi.getRecentTransactions(limit),
    enabled: authInitialized && isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds for real-time feel
    refetchInterval: 1000 * 60, // Auto-refetch every minute
  });
}

// Hook for getting user transactions
export function useUserTransactions(userId: string, limit: number = 50) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: TRANSACTIONS_QUERY_KEYS.user(userId),
    queryFn: () => transactionsApi.getUserTransactions(userId, limit),
    enabled: authInitialized && isAuthenticated && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for getting transaction statistics
export function useTransactionStats(startDate?: string, endDate?: string) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: TRANSACTIONS_QUERY_KEYS.stats(startDate, endDate),
    queryFn: () => transactionsApi.getTransactionStats(startDate, endDate),
    enabled: authInitialized && isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Helper function to format transaction type
export function formatTransactionType(type: TransactionType): string {
  switch (type) {
    case TransactionType.StockCount:
      return 'Stock Count';
    case TransactionType.Adjustment:
      return 'Adjustment';
    case TransactionType.Receiving:
      return 'Receiving';
    default:
      return 'Unknown';
  }
}

// Helper function to get transaction type color
export function getTransactionTypeColor(type: TransactionType): string {
  switch (type) {
    case TransactionType.StockCount:
      return 'blue';
    case TransactionType.Adjustment:
      return 'orange';
    case TransactionType.Receiving:
      return 'green';
    default:
      return 'gray';
  }
}