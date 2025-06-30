import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { grpcClient } from '../services/grpc/grpcClient';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import {
  ProcessScanRequest,
  UpdateProductRequest,
  BulkUpdateRequest,
  BulkScanRequest,
  ProductCalculationRequest,
  MetricsRequest,
} from '../services/grpc/types';

// Query Keys for gRPC operations
export const GRPC_QUERY_KEYS = {
  all: ['grpc'] as const,
  health: () => [...GRPC_QUERY_KEYS.all, 'health'] as const,
  metrics: (params: MetricsRequest) => [...GRPC_QUERY_KEYS.all, 'metrics', params] as const,
  calculations: (productCode: string) => [...GRPC_QUERY_KEYS.all, 'calculations', productCode] as const,
};

// Hook for gRPC health check
export function useGrpcHealth() {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: GRPC_QUERY_KEYS.health(),
    queryFn: () => grpcClient.healthCheck(),
    enabled: authInitialized && isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Check every minute
  });
}

// Hook for system metrics via gRPC
export function useGrpcMetrics(request: MetricsRequest = {}) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: GRPC_QUERY_KEYS.metrics(request),
    queryFn: () => grpcClient.getSystemMetrics(request),
    enabled: authInitialized && isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for product calculations via gRPC
export function useProductCalculations(request: ProductCalculationRequest) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: GRPC_QUERY_KEYS.calculations(request.productCode),
    queryFn: () => grpcClient.calculateProductMetrics(request),
    enabled: authInitialized && isAuthenticated && !!request.productCode && request.currentQuantity > 0,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Mutation hooks for gRPC operations
export function useGrpcProcessScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ProcessScanRequest) => grpcClient.processScan(request),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Scan processed via gRPC');
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: GRPC_QUERY_KEYS.all });
      } else {
        toast.error(response.message || 'gRPC scan processing failed');
      }
    },
    onError: (error: any) => {
      console.error('gRPC ProcessScan error:', error);
      toast.error('Failed to process scan via gRPC');
    },
  });
}

export function useGrpcUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateProductRequest) => grpcClient.updateProduct(request),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Product updated via gRPC');
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: GRPC_QUERY_KEYS.all });
      } else {
        toast.error(response.message || 'gRPC product update failed');
      }
    },
    onError: (error: any) => {
      console.error('gRPC UpdateProduct error:', error);
      toast.error('Failed to update product via gRPC');
    },
  });
}

export function useGrpcBulkUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkUpdateRequest) => grpcClient.bulkUpdateProducts(request),
    onSuccess: (response) => {
      const { updatedCount, errors } = response;
      
      if (updatedCount > 0) {
        toast.success(`gRPC: Successfully updated ${updatedCount} product(s)`);
      }
      
      if (errors.length > 0) {
        toast.error(`gRPC: ${errors.length} error(s) occurred`);
      }

      // Invalidate all product queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: GRPC_QUERY_KEYS.all });
    },
    onError: (error: any) => {
      console.error('gRPC BulkUpdate error:', error);
      toast.error('Failed to perform bulk update via gRPC');
    },
  });
}

export function useGrpcBulkScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkScanRequest) => grpcClient.processBulkScan(request),
    onSuccess: (response) => {
      const { processedCount, errors } = response;
      
      if (processedCount > 0) {
        toast.success(`gRPC: Successfully processed ${processedCount} scan(s)`);
      }
      
      if (errors.length > 0) {
        toast.error(`gRPC: ${errors.length} scan error(s) occurred`);
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: GRPC_QUERY_KEYS.all });
    },
    onError: (error: any) => {
      console.error('gRPC BulkScan error:', error);
      toast.error('Failed to process bulk scan via gRPC');
    },
  });
}

// Hook for testing gRPC connection
export function useGrpcConnectionTest() {
  return useMutation({
    mutationFn: () => grpcClient.testConnection(),
    onSuccess: (isConnected) => {
      if (isConnected) {
        toast.success('gRPC connection test successful');
      } else {
        toast.warning('gRPC connection test failed - using fallback');
      }
    },
    onError: (error: any) => {
      console.error('gRPC connection test error:', error);
      toast.error('gRPC connection test failed');
    },
  });
}

// Custom hook for demonstrating protocol selection strategy
export function useProtocolStrategy() {
  const grpcHealth = useGrpcHealth();
  
  const selectOptimalProtocol = (operation: string): 'rest' | 'grpc' | 'signalr' => {
    // Business logic for selecting the best protocol
    switch (operation) {
      case 'simple-crud':
        return 'rest'; // REST for simple CRUD operations
      
      case 'bulk-operations':
      case 'complex-calculations':
        return grpcHealth.data?.status === 'healthy' ? 'grpc' : 'rest'; // gRPC for performance-critical ops
      
      case 'real-time-updates':
        return 'signalr'; // SignalR for real-time communication
      
      default:
        return 'rest'; // Default to REST
    }
  };

  return {
    selectOptimalProtocol,
    grpcAvailable: grpcHealth.data?.status === 'healthy',
    isLoading: grpcHealth.isLoading,
  };
}