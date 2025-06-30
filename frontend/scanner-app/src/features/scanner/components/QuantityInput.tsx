import { useRef, memo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '../../shared/components/button';
import { Input } from '../../shared/components/input';
import { Label } from '../../shared/components/label';
import { NumericKeypad } from './NumericKeypad';
import { isMobile } from '../../shared/utils/isMobile';

interface QuantityInputProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAdjustQuantity: (increment: number) => void;
  showKeypad: boolean;
  onShowKeypad: (show: boolean) => void;
  error?: string;
  register: any; // From react-hook-form - keeping as any for simplicity
  allowNegative?: boolean;
}

/**
 * Component for quantity input with mobile-friendly numeric keypad
 * Follows Single Responsibility Principle - handles only quantity input
 */
export const QuantityInput = memo(function QuantityInput({
  quantity,
  onQuantityChange,
  onAdjustQuantity,
  showKeypad,
  onShowKeypad,
  error,
  register,
  allowNegative = false,
}: QuantityInputProps) {
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const handleQuantityFocus = () => {
    if (isMobile()) {
      onShowKeypad(true);
    }
  };

  const handleKeypadNumberPress = (num: number) => {
    const newQuantity = allowNegative 
      ? Math.max(-9999, Math.min(9999, quantity * 10 + num))
      : Math.max(1, Math.min(9999, quantity * 10 + num));
    onQuantityChange(newQuantity);
  };

  const handleKeypadBackspace = () => {
    const newQuantity = Math.floor(quantity / 10) || (allowNegative ? 0 : 1);
    onQuantityChange(newQuantity);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="quantity">Quantity</Label>
      <div className="flex items-center gap-2">
        {allowNegative && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onQuantityChange(-quantity)}
            className="h-12 w-12"
            aria-label="Toggle positive/negative"
            title="Toggle positive/negative"
          >
            <span className="font-mono text-lg">±</span>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onAdjustQuantity(-10)}
          disabled={allowNegative ? Math.abs(quantity) >= 9990 : quantity <= 10}
          className="h-12 w-12"
          aria-label="Decrease quantity by 10"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onAdjustQuantity(-1)}
          disabled={allowNegative ? Math.abs(quantity) >= 9999 : quantity <= 1}
          className="h-12 w-12"
          aria-label="Decrease quantity by 1"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          id="quantity"
          type="number"
          {...register('quantity', { valueAsNumber: true })}
          value={quantity}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val) && (allowNegative || val > 0)) {
              onQuantityChange(val);
            }
          }}
          className="text-center text-lg font-semibold h-12 w-20 scanner-input"
          min={allowNegative ? -9999 : 1}
          max={9999}
          ref={quantityInputRef}
          onFocus={handleQuantityFocus}
          readOnly={isMobile()}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onAdjustQuantity(1)}
          disabled={Math.abs(quantity) >= 9999}
          className="h-12 w-12"
          aria-label="Increase quantity by 1"
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onAdjustQuantity(10)}
          disabled={Math.abs(quantity) >= 9990}
          className="h-12 w-12"
          aria-label="Increase quantity by 10"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      <NumericKeypad
        isVisible={showKeypad}
        onClose={() => onShowKeypad(false)}
        onNumberPress={handleKeypadNumberPress}
        onBackspace={handleKeypadBackspace}
        onEnter={() => onShowKeypad(false)}
      />
    </div>
  );
});