import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProductLookup } from './useProductLookup';
import { productsApi } from '../../shared/services/api';
import { productCodeSchema } from '../../shared/utils/validation';

// Mock the API
vi.mock('../../shared/services/api', () => ({
  productsApi: {
    getProduct: vi.fn(),
  },
}));

// Mock validation utility
vi.mock('../../shared/utils/validation', () => ({
  productCodeSchema: {
    safeParse: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProductLookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    (productCodeSchema.safeParse as any).mockReturnValue({ success: false });

    const { result } = renderHook(() => useProductLookup(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.product).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isValidCode).toBe(false);
  });

  it('should validate product code correctly', () => {
    // Use the imported mocked productCodeSchema
    (productCodeSchema.safeParse as any).mockReturnValue({ success: true });

    const { result } = renderHook(() => useProductLookup('ABC123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isValidCode).toBe(true);
  });

  it('should fetch product when valid code is provided', async () => {
    // Use the imported mocked productCodeSchema
    (productCodeSchema.safeParse as any).mockReturnValue({ success: true });

    const mockProduct = {
      productCode: 'ABC123',
      description: 'Test Product',
      quantityOnHand: 100,
    };

    (productsApi.getProduct as any).mockResolvedValue(mockProduct);

    const { result } = renderHook(() => useProductLookup('ABC123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.product).toEqual(mockProduct);
    });

    expect(productsApi.getProduct).toHaveBeenCalledWith('ABC123');
  });

  it('should handle API errors', async () => {
    // Use the imported mocked productCodeSchema
    (productCodeSchema.safeParse as any).mockReturnValue({ success: true });

    const mockError = new Error('Product not found');
    (productsApi.getProduct as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useProductLookup('XYZ789'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Product not found');
    });
  });

  it('should debounce product code changes', async () => {
    // Use the imported mocked productCodeSchema
    (productCodeSchema.safeParse as any).mockReturnValue({ success: true });

    const { rerender } = renderHook(
      ({ productCode }) => useProductLookup(productCode),
      {
        wrapper: createWrapper(),
        initialProps: { productCode: 'ABC' },
      }
    );

    // Change product code multiple times quickly
    rerender({ productCode: 'ABC1' });
    rerender({ productCode: 'ABC12' });
    rerender({ productCode: 'ABC123' });

    // Should not call API immediately due to debouncing
    expect(productsApi.getProduct).not.toHaveBeenCalled();

    // Wait for debounce
    await waitFor(() => {
      expect(productsApi.getProduct).toHaveBeenCalledWith('ABC123');
    }, { timeout: 500 });
  });
});