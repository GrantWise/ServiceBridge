import { memo } from 'react';
import { Label } from '../../shared/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/select';
import { TransactionType } from '../../../types/api';

interface TransactionTypeSelectProps {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
}

/**
 * Component for selecting transaction type
 * Follows Single Responsibility Principle - handles only transaction type selection
 */
export const TransactionTypeSelect = memo(function TransactionTypeSelect({ value, onChange }: TransactionTypeSelectProps) {
  const handleValueChange = (stringValue: string) => {
    onChange(parseInt(stringValue) as TransactionType);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="transactionType">Transaction Type</Label>
      <Select
        value={value.toString()}
        onValueChange={handleValueChange}
      >
        <SelectTrigger id="transactionType">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TransactionType.StockCount.toString()}>
            Stock Count
          </SelectItem>
          <SelectItem value={TransactionType.Adjustment.toString()}>
            Adjustment
          </SelectItem>
          <SelectItem value={TransactionType.Receiving.toString()}>
            Receiving
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});