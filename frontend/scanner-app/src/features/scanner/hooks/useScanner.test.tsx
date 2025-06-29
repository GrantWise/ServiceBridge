import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScanner } from './useScanner';
import { productsApi } from '../../shared/services/api';
import { toast } from 'sonner';
import { addScan } from '../components/OfflineQueue';

// Mock dependencies
vi.mock('../../shared/services/api', () => ({
  productsApi: {
    submitScan: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../components/OfflineQueue', () => ({
  addScan: vi.fn(),
}));



// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

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

describe('useScanner', () => {
  const mockProduct = {
    productCode: 'ABC123',
    description: 'Test Product',
    quantityOnHand: 100,
  };

  const mockScanData = {
    productCode: 'ABC123',
    quantity: 5,
    transactionType: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (navigator as any).onLine = true;
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useScanner(), {
      wrapper: createWrapper(),
    });

    expect(result.current.submitting).toBe(false);
    expect(typeof result.current.submitScan).toBe('function');
  });

  it('should submit scan successfully', async () => {
    const mockResponse = {
      transaction: { id: '1', productCode: 'ABC123' },
      updatedProduct: { ...mockProduct, quantityOnHand: 105 },
    };

    (productsApi.submitScan as any).mockResolvedValue(mockResponse);

    const onScanComplete = vi.fn();
    const { result } = renderHook(() => useScanner({ onScanComplete }), {
      wrapper: createWrapper(),
    });

    await result.current.submitScan(mockProduct, mockScanData);

    expect(productsApi.submitScan).toHaveBeenCalledWith('ABC123', {
      productCode: 'ABC123',
      quantityScanned: 5,
      transactionType: 0,
      scannedBy: 'Current User',
    });

    expect(toast.success).toHaveBeenCalledWith('Scan submitted successfully!', {
      description: 'Test Product - New quantity: 105',
    });

    expect(onScanComplete).toHaveBeenCalledWith(mockResponse.transaction);
  });

  it('should handle online API errors', async () => {
    const mockError = new Error('Server error');
    (productsApi.submitScan as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useScanner(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.submitScan(mockProduct, mockScanData)
    ).rejects.toThrow('Server error');

    expect(toast.error).toHaveBeenCalledWith('Server error');
  });

  it('should handle offline scenario', async () => {
    (navigator as any).onLine = false;
    
    const mockError = new Error('Network error');
    (productsApi.submitScan as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useScanner(), {
      wrapper: createWrapper(),
    });

    await result.current.submitScan(mockProduct, mockScanData);

    expect(addScan).toHaveBeenCalledWith({
      id: expect.any(String),
      productCode: 'ABC123',
      quantityScanned: 5,
      transactionType: 0,
      scannedBy: 'Current User',
      createdAt: expect.any(String),
    });

    expect(toast.info).toHaveBeenCalledWith('Scan queued for sync when online');
  });

  it('should track submitting state', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (productsApi.submitScan as any).mockReturnValue(promise);

    const { result } = renderHook(() => useScanner(), {
      wrapper: createWrapper(),
    });

    // Start submission
    const submitPromise = result.current.submitScan(mockProduct, mockScanData);
    
    await waitFor(() => {
      expect(result.current.submitting).toBe(true);
    });

    // Complete submission
    resolvePromise!({ 
      transaction: { id: '1' },
      updatedProduct: mockProduct,
    });

    await submitPromise;

    // Should no longer be submitting
    await waitFor(() => {
      expect(result.current.submitting).toBe(false);
    });
  });
});