import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Product, TransactionType } from '@/features/shared/types/api.types';
import { useProcessScan } from '@/features/shared/hooks/useProducts';
import { getProductName, getStockLevel, getProductLocation } from '@/features/shared/utils/productUtils';
import { Package, Minus, Plus, RotateCcw } from 'lucide-react';

const scanSchema = z.object({
  transactionType: z.nativeEnum(TransactionType),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  notes: z.string().max(500, 'Notes too long').optional(),
  location: z.string().max(50, 'Location too long').optional(),
});

type ScanFormData = z.infer<typeof scanSchema>;

interface ScanConfirmationDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getTransactionTypeInfo = (type: TransactionType) => {
  switch (type) {
    case TransactionType.StockIn:
      return { 
        label: 'Stock In', 
        icon: Plus, 
        color: 'bg-green-100 text-green-800',
        description: 'Add items to inventory'
      };
    case TransactionType.StockOut:
      return { 
        label: 'Stock Out', 
        icon: Minus, 
        color: 'bg-red-100 text-red-800',
        description: 'Remove items from inventory'
      };
    case TransactionType.StockAdjustment:
      return { 
        label: 'Adjustment', 
        icon: RotateCcw, 
        color: 'bg-blue-100 text-blue-800',
        description: 'Adjust inventory levels'
      };
    case TransactionType.StockTransfer:
      return { 
        label: 'Transfer', 
        icon: Package, 
        color: 'bg-purple-100 text-purple-800',
        description: 'Move items between locations'
      };
    default:
      return { 
        label: 'Unknown', 
        icon: Package, 
        color: 'bg-gray-100 text-gray-800',
        description: 'Unknown transaction type'
      };
  }
};

export function ScanConfirmationDialog({ product, open, onOpenChange }: ScanConfirmationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const processScanMutation = useProcessScan();

  const form = useForm<ScanFormData>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      transactionType: TransactionType.StockIn,
      quantity: 1,
      notes: '',
      location: product ? getProductLocation(product) : '',
    },
  });

  const transactionType = form.watch('transactionType');
  const quantity = form.watch('quantity');
  const typeInfo = getTransactionTypeInfo(transactionType);
  const Icon = typeInfo.icon;

  // Calculate new stock level preview
  const getNewStockLevel = () => {
    if (!product) return 0;
    
    const currentStock = getStockLevel(product);
    
    switch (transactionType) {
      case TransactionType.StockIn:
        return currentStock + quantity;
      case TransactionType.StockOut:
        return Math.max(0, currentStock - quantity);
      case TransactionType.StockAdjustment:
        return quantity; // Adjustment sets to absolute value
      case TransactionType.StockTransfer:
        return currentStock; // Transfer doesn't change total stock
      default:
        return currentStock;
    }
  };

  const onSubmit = async (data: ScanFormData) => {
    if (!product) return;

    setIsSubmitting(true);
    try {
      await processScanMutation.mutateAsync({
        productCode: product.productCode,
        data: {
          transactionType: data.transactionType,
          quantity: data.quantity,
          quantityScanned: data.quantity, // Include for API compatibility
          notes: data.notes,
          location: data.location,
        },
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  // Reset form when product changes
  useState(() => {
    if (product) {
      form.reset({
        transactionType: TransactionType.StockIn,
        quantity: 1,
        notes: '',
        location: getProductLocation(product),
      });
    }
  });

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Process Scan
          </DialogTitle>
          <DialogDescription>
            Record a transaction for {product.productCode}
          </DialogDescription>
        </DialogHeader>

        {/* Product Info */}
        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{getProductName(product)}</h4>
                <p className="text-sm text-muted-foreground">{product.productCode}</p>
              </div>
              <Badge variant="outline">
                Current: {getStockLevel(product)}
              </Badge>
            </div>
            {product.description && (
              <p className="text-sm text-muted-foreground">{product.description}</p>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TransactionType.StockIn.toString()}>
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-600" />
                          Stock In
                        </div>
                      </SelectItem>
                      <SelectItem value={TransactionType.StockOut.toString()}>
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-600" />
                          Stock Out
                        </div>
                      </SelectItem>
                      <SelectItem value={TransactionType.StockAdjustment.toString()}>
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-4 w-4 text-blue-600" />
                          Stock Adjustment
                        </div>
                      </SelectItem>
                      <SelectItem value={TransactionType.StockTransfer.toString()}>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-600" />
                          Stock Transfer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{typeInfo.description}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quantity
                    {transactionType === TransactionType.StockAdjustment && ' (New Total)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max={transactionType === TransactionType.StockOut ? getStockLevel(product) : undefined}
                      placeholder="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  {transactionType === TransactionType.StockOut && (
                    <FormDescription>
                      Available: {getStockLevel(product)} units
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {transactionType === TransactionType.StockTransfer && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A1-B2, Warehouse B" {...field} />
                    </FormControl>
                    <FormDescription>
                      Current location: {getProductLocation(product) || 'Not specified'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this transaction..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="rounded-lg border p-3 bg-accent/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{typeInfo.label}</span>
                  <Badge className={typeInfo.color}>{quantity}</Badge>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">New stock: </span>
                  <span className="font-medium">{getNewStockLevel()}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Process Scan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}