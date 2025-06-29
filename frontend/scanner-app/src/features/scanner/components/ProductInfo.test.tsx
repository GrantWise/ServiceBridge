import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProductInfo } from './ProductInfo';

const mockProduct = {
  productCode: 'ABC123',
  description: 'Test Product',
  quantityOnHand: 100,
  averageMonthlyConsumption: 20,
  leadTimeDays: 5,
  quantityOnOrder: 0,
  daysCoverRemaining: 150,
  reorderPoint: 3,
  stockStatus: 1,
};

describe('ProductInfo', () => {
  it('should show loading skeleton when loading', () => {
    render(<ProductInfo product={null} loading={true} error={null} />);
    
    // Check for skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display product information when product is available', () => {
    render(<ProductInfo product={mockProduct} loading={false} error={null} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Current Stock: 100 units')).toBeInTheDocument();
    
    // Check for success icon
    const successIcon = document.querySelector('.text-green-500');
    expect(successIcon).toBeInTheDocument();
  });

  it('should display error message when error occurs', () => {
    const errorMessage = 'Product not found';
    render(<ProductInfo product={null} loading={false} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    
    // Check for error styling
    const errorContainer = document.querySelector('.bg-destructive\\/10');
    expect(errorContainer).toBeInTheDocument();
  });

  it('should not display anything when no product, not loading, and no error', () => {
    const { container } = render(
      <ProductInfo product={null} loading={false} error={null} />
    );
    
    // Container should be empty or have minimal content
    expect(container.firstChild?.textContent).toBeFalsy();
  });

  it('should show loading when loading is true, even with error', () => {
    const errorMessage = 'Network error';
    render(<ProductInfo product={null} loading={true} error={errorMessage} />);
    
    // Should show loading skeleton when loading
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should prioritize product over error when both are present', () => {
    render(<ProductInfo product={mockProduct} loading={false} error="Some error" />);
    
    // Should show product info, not error (error is only shown when no product)
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.queryByText('Some error')).not.toBeInTheDocument();
  });
});