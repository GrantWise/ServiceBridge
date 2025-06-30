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
import { Package, Plus, Minus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const bulkScanSchema = z.object({
  transactionType: z.nativeEnum(TransactionType),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

type BulkScanFormData = z.infer<typeof bulkScanSchema>;

interface BulkScanDialogProps {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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
    default:
      return { 
        label: 'Unknown', 
        icon: Package, 
        color: 'bg-gray-100 text-gray-800',
        description: 'Unknown transaction type'
      };
  }
};

export function BulkScanDialog({ products, open, onOpenChange, onSuccess }: BulkScanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const processScanMutation = useProcessScan();

  const form = useForm<BulkScanFormData>({
    resolver: zodResolver(bulkScanSchema),
    defaultValues: {
      transactionType: TransactionType.StockIn,
      quantity: 1,
      notes: '',
    },
  });

  const transactionType = form.watch('transactionType');
  const quantity = form.watch('quantity');
  const typeInfo = getTransactionTypeInfo(transactionType);
  const Icon = typeInfo.icon;

  const onSubmit = async (data: BulkScanFormData) => {
    setIsSubmitting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Process each product individually
      for (const product of products) {
        try {
          await processScanMutation.mutateAsync({
            productCode: product.productCode,
            data: {
              transactionType: data.transactionType,
              quantity: data.quantity,
              notes: data.notes,
            },
          });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} scans`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to process ${errorCount} scans`);
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handling is done above
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bulk Scan Processing
          </DialogTitle>
          <DialogDescription>
            Process the same transaction for multiple products
          </DialogDescription>
        </DialogHeader>

        {/* Products Preview */}
        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Selected Products</h4>
            <Badge variant="secondary">{products.length} products</Badge>
          </div>
          <div className="max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {products.map(product => (
                <div key={product.productCode} className="flex justify-between text-sm">
                  <span>{product.productCode}</span>
                  <span className="text-muted-foreground">Current: {product.stockLevel}</span>
                </div>
              ))}
            </div>
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
                    Quantity {transactionType === TransactionType.StockAdjustment && '(New Total)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    This quantity will be applied to all selected products
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this bulk operation..."
                      className="resize-none"
                      rows={3}
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
                  <span className="text-muted-foreground">Will affect </span>
                  <span className="font-medium">{products.length} products</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : `Process ${products.length} Scans`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}