import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScannerForm } from './ScannerForm';
import { AuthProvider } from '../../auth';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
vi.mock('../hooks/useProductLookup', () => ({
  useProductLookup: vi.fn(() => ({ product: null, isLoading: false, error: null })),
}));

vi.mock('../hooks/useScanner', () => ({
  useScanner: vi.fn(() => ({ submitScan: vi.fn(), submitting: false })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('ScannerForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form elements', () => {
    render(<ScannerForm signalRService={{} as any} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText('Product Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Transaction Type')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit scan/i })).toBeInTheDocument();
  });
});
