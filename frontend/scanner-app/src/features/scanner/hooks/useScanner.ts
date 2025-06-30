import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productsApi } from '../../shared/services/api';
import { addScan as addOfflineScan } from '../components/OfflineQueue';
import { authService } from '../../auth/services/authService';
import type { Product, CreateScanRequest, TransactionType } from '../../../types/api';

interface UseScannerOptions {
  onScanComplete?: (transaction: unknown) => void;
}

interface ScanFormData {
  productCode: string;
  quantity: number;
  transactionType: TransactionType;
}

/**
 * Custom hook for scanner functionality
 * Follows Single Responsibility Principle - handles only scanning logic
 */
export function useScanner(options: UseScannerOptions = {}) {
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { onScanComplete } = options;

  const submitScan = useCallback(async (product: Product, data: ScanFormData) => {
    setSubmitting(true);
    
    try {
      const currentUser = authService.getState().user;
      const scanRequest: CreateScanRequest = {
        productCode: product.productCode,
        quantityScanned: data.quantity,
        transactionType: data.transactionType,
        scannedBy: currentUser?.fullName || currentUser?.username || 'Unknown User',
      };

      const response = await productsApi.submitScan(product.productCode, scanRequest);
      
      // Invalidate related queries
      await queryClient.invalidateQueries({ queryKey: ['product', product.productCode] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast.success('Scan submitted successfully!', {
        description: `${response.updatedProduct.description} - New quantity: ${response.updatedProduct.quantityOnHand}`,
      });
      
      onScanComplete?.(response.transaction);
      
      return response;
    } catch (err: unknown) {
      // Handle offline scenario
      if (!navigator.onLine) {
        const currentUser = authService.getState().user;
        await addOfflineScan({
          id: Date.now().toString(),
          productCode: product.productCode,
          quantityScanned: data.quantity,
          transactionType: data.transactionType,
          scannedBy: currentUser?.fullName || currentUser?.username || 'Unknown User',
          createdAt: new Date().toISOString(),
        });
        toast('Scan queued for sync when online');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to submit scan';
        toast.error(errorMessage);
        throw err;
      }
    } finally {
      setSubmitting(false);
    }
  }, [queryClient, onScanComplete]);

  return {
    submitScan,
    submitting,
  };
}