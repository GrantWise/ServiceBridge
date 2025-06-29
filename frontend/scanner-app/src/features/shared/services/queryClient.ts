import { QueryClient } from '@tanstack/react-query';

/**
 * Query Client Configuration
 * Following Single Responsibility Principle - handles only query cache configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: unknown) => {
        const err = error as { statusCode?: number };
        if (err?.statusCode === 404) {
          return false;
        }
        if (err?.statusCode === 401) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Query Keys Management
 * Following Open/Closed Principle - extensible for new query keys
 */
export const queryKeys = {
  all: ['queries'] as const,
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (params: unknown) => [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (code: string) => [...queryKeys.products.details(), code] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (params: unknown) => [...queryKeys.transactions.lists(), params] as const,
    recent: () => [...queryKeys.transactions.all, 'recent'] as const,
    byProduct: (code: string) => [...queryKeys.transactions.all, 'product', code] as const,
  },
  metrics: {
    all: ['metrics'] as const,
    live: () => [...queryKeys.metrics.all, 'live'] as const,
  },
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
} as const;