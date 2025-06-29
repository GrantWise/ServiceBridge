import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Package } from 'lucide-react';

import { Button } from '../../shared/components/button';
import { 
  EnterpriseCard, 
  EnterpriseCardContent, 
  EnterpriseCardDescription, 
  EnterpriseCardHeader, 
  EnterpriseCardTitle 
} from '../../shared/components/enterprise-card';
import { ProductCodeInput } from './ProductCodeInput';
import { ProductInfo } from './ProductInfo';
import { QuantityInput } from './QuantityInput';
import { TransactionTypeSelect } from './TransactionTypeSelect';
import { ScanConfirmationDialog } from './ScanConfirmationDialog';

import { useProductLookup } from '../hooks/useProductLookup';
import { useScanner } from '../hooks/useScanner';
import { TransactionType } from '../../../types/api';
import type { SignalRService } from '../../shared/services/signalr';

// Form validation schema
const productCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}\d{3}$/, 'Format: 3 letters + 3 numbers (e.g., ABC123)')
  .length(6, 'Product code must be 6 characters');

const formSchema = z.object({
  productCode: productCodeSchema,
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(9999, 'Quantity cannot exceed 9999'),
  transactionType: z.nativeEnum(TransactionType),
});

type FormValues = z.infer<typeof formSchema>;

interface ScannerFormProps {
  onScanComplete?: (transaction: unknown) => void;
  signalRService: SignalRService;
}

/**
 * Main scanner form component - now focused and under 200 lines
 * Uses composition pattern with extracted sub-components
 * Uses custom hooks for business logic
 */
export function ScannerForm({ onScanComplete, signalRService: _signalRService }: ScannerFormProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<FormValues | null>(null);
  const [showKeypad, setShowKeypad] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      productCode: '',
      quantity: 1,
      transactionType: TransactionType.StockCount,
    },
  });

  const productCode = watch('productCode') || '';
  const quantity = watch('quantity');
  const transactionType = watch('transactionType');

  // Custom hooks for business logic
  const { product, isLoading, error } = useProductLookup(productCode);
  const { submitScan, submitting } = useScanner({ onScanComplete });

  // Event handlers
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setValue('productCode', value, { shouldValidate: true });
  };

  const adjustQuantity = (increment: number) => {
    const newQty = Math.max(1, Math.min(9999, quantity + increment));
    setValue('quantity', newQty);
  };

  const onSubmit = async (values: FormValues) => {
    if (!product) {
      return;
    }

    // Show confirmation for large quantity changes
    if (quantity > 100) {
      setPendingSubmit(values);
      setShowConfirmDialog(true);
      return;
    }

    await handleScanSubmit(values);
  };

  const handleScanSubmit = async (values: FormValues) => {
    if (!product) {
      return;
    }

    try {
      await submitScan(product, {
        productCode: values.productCode,
        quantity: values.quantity,
        transactionType: values.transactionType,
      });

      // Reset form after successful submission
      reset();
      setShowConfirmDialog(false);
      setPendingSubmit(null);
    } catch (error) {
      // Error handling is done in the custom hook
      console.error('Scan submission failed:', error);
    }
  };

  const handleConfirmSubmit = () => {
    if (pendingSubmit) {
      handleScanSubmit(pendingSubmit);
    }
  };

  return (
    <>
      <EnterpriseCard 
        className="w-full max-w-md mx-auto"
        elevation={3}
        variant="glass"
        hover="lift"
      >
        <EnterpriseCardHeader>
          <EnterpriseCardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Product Scanner
          </EnterpriseCardTitle>
          <EnterpriseCardDescription>
            Scan or enter product code to update inventory
          </EnterpriseCardDescription>
        </EnterpriseCardHeader>
        <EnterpriseCardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <ProductCodeInput
              onChange={onInputChange}
              product={product}
              error={errors.productCode?.message}
              register={register}
            />

            <ProductInfo
              product={product}
              loading={isLoading}
              error={error}
            />

            <QuantityInput
              quantity={quantity}
              onQuantityChange={(qty) => setValue('quantity', qty)}
              onAdjustQuantity={adjustQuantity}
              showKeypad={showKeypad}
              onShowKeypad={setShowKeypad}
              error={errors.quantity?.message}
              register={register}
            />

            <TransactionTypeSelect
              value={transactionType}
              onChange={(type) => setValue('transactionType', type)}
            />

            <Button
              type="submit"
              className="w-full h-12 text-lg scanner-button"
              disabled={!product || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Scan'
              )}
            </Button>
          </form>
        </EnterpriseCardContent>
      </EnterpriseCard>

      <ScanConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        quantity={pendingSubmit?.quantity}
        onConfirm={handleConfirmSubmit}
      />
    </>
  );
}