import { memo } from 'react';
import { Input } from '../../shared/components/input';
import { Label } from '../../shared/components/label';
import { getSemanticBorder } from '../../shared/utils/colors';
import type { Product } from '../../../types/api';

interface ProductCodeInputProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  product: Product | null;
  error?: string;
  register: any; // From react-hook-form - keeping as any for simplicity
}

/**
 * Component for product code input with validation styling
 * Follows Single Responsibility Principle - handles only product code input
 */
export const ProductCodeInput = memo(function ProductCodeInput({
  onChange,
  product,
  error,
  register,
}: ProductCodeInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="productCode">Product Code</Label>
      <Input
        id="productCode"
        placeholder="ABC123"
        {...register('productCode')}
        onChange={onChange}
        className={`scanner-input transition-all duration-200 ${
          error
            ? getSemanticBorder('error')
            : product
            ? getSemanticBorder('valid')
            : getSemanticBorder('default')
        }`}
        maxLength={6}
      />
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  );
});