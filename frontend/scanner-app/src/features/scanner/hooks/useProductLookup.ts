import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../shared/services/api';
import { productCodeSchema } from '../../shared/utils/validation';

/**
 * Custom hook for product lookup functionality
 * Follows Single Responsibility Principle - handles only product lookup
 */
export function useProductLookup(productCode: string) {
  const [debouncedCode, setDebouncedCode] = useState('');
  
  // Debounce the product code to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productCodeSchema.safeParse(productCode).success) {
        setDebouncedCode(productCode);
      } else {
        setDebouncedCode('');
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [productCode]);
  
  // Use React Query for product lookup
  const {
    data: product,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['product', debouncedCode],
    queryFn: () => productsApi.getProduct(debouncedCode),
    enabled: !!debouncedCode && debouncedCode.length === 6,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const validateProductCode = useCallback((code: string): boolean => {
    return productCodeSchema.safeParse(code).success;
  }, []);
  
  return {
    product: product || null,
    isLoading,
    error: isError ? (error as Error).message : null,
    isValidCode: validateProductCode(productCode),
    validateProductCode,
  };
}