import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productsApi } from '../services/api/products.api';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import {
  Product,
  GetProductsQuery,
  UpdateProductRequest,
  BulkUpdateRequest,
  CreateScanRequest,
  StockStatus,
} from '../types/api.types';

// Query Keys
export const PRODUCTS_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCTS_QUERY_KEYS.all, 'list'] as const,
  list: (params: GetProductsQuery) => [...PRODUCTS_QUERY_KEYS.lists(), params] as const,
  details: () => [...PRODUCTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (code: string) => [...PRODUCTS_QUERY_KEYS.details(), code] as const,
  search: (query: string) => [...PRODUCTS_QUERY_KEYS.all, 'search', query] as const,
  byStatus: (status: StockStatus) => [...PRODUCTS_QUERY_KEYS.all, 'status', status] as const,
};

// Hook for getting paginated products
export function useProducts(query: GetProductsQuery = {}) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.list(query),
    queryFn: () => productsApi.getProducts(query),
    enabled: authInitialized && isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for getting a single product
export function useProduct(productCode: string) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.detail(productCode),
    queryFn: () => productsApi.getProduct(productCode),
    enabled: authInitialized && isAuthenticated && !!productCode,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for searching products
export function useProductSearch(searchQuery: string, enabled: boolean = true) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.search(searchQuery),
    queryFn: () => productsApi.searchProducts(searchQuery),
    enabled: authInitialized && isAuthenticated && enabled && searchQuery.length > 0,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook for getting products by stock status
export function useProductsByStatus(stockStatus: StockStatus) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.byStatus(stockStatus),
    queryFn: () => productsApi.getProductsByStockStatus(stockStatus),
    enabled: authInitialized && isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Mutation hooks
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productCode, data }: { productCode: string; data: UpdateProductRequest }) =>
      productsApi.updateProduct(productCode, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        toast.success('Product updated successfully');
        
        // Invalidate and refetch related queries
        queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
        
        // Update the specific product in cache if we have the updated data
        if (response.updatedProduct) {
          queryClient.setQueryData(
            PRODUCTS_QUERY_KEYS.detail(variables.productCode),
            response.updatedProduct
          );
        }
      } else {
        toast.error(response.message || 'Failed to update product');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update product';
      toast.error(message);
    },
  });
}

export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateRequest) => productsApi.bulkUpdateProducts(data),
    onSuccess: (response) => {
      const { successfulUpdates, results } = response;
      const totalUpdates = results.length;
      const failedUpdates = totalUpdates - successfulUpdates;

      if (successfulUpdates > 0) {
        toast.success(`Successfully updated ${successfulUpdates} product(s)`);
      }
      
      if (failedUpdates > 0) {
        toast.error(`Failed to update ${failedUpdates} product(s)`);
      }

      // Invalidate all product queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update products';
      toast.error(message);
    },
  });
}

export function useProcessScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productCode, data }: { productCode: string; data: CreateScanRequest }) =>
      productsApi.processScan(productCode, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        toast.success('Scan processed successfully');
        
        // Invalidate queries to show updated data
        queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        
        // Specifically update the product that was scanned
        queryClient.invalidateQueries({ 
          queryKey: PRODUCTS_QUERY_KEYS.detail(variables.productCode) 
        });
      } else {
        toast.error(response.message || 'Failed to process scan');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to process scan';
      toast.error(message);
    },
  });
}

// Optimistic update hook for better UX
export function useOptimisticProductUpdate() {
  const queryClient = useQueryClient();

  const updateProductOptimistically = (productCode: string, updates: Partial<Product>) => {
    // Cancel any outgoing refetches
    queryClient.cancelQueries({ queryKey: PRODUCTS_QUERY_KEYS.detail(productCode) });

    // Snapshot the previous value
    const previousProduct = queryClient.getQueryData(PRODUCTS_QUERY_KEYS.detail(productCode));

    // Optimistically update the cache
    queryClient.setQueryData(PRODUCTS_QUERY_KEYS.detail(productCode), (old: Product | undefined) => {
      if (!old) return old;
      return { ...old, ...updates };
    });

    // Return a rollback function
    return () => {
      queryClient.setQueryData(PRODUCTS_QUERY_KEYS.detail(productCode), previousProduct);
    };
  };

  return { updateProductOptimistically };
}