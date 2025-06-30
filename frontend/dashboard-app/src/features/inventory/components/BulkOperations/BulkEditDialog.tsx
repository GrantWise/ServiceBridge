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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Product, StockStatus } from '@/features/shared/types/api.types';
import { useBulkUpdateProducts } from '@/features/shared/hooks/useProducts';
import { AlertTriangle, Package } from 'lucide-react';

const bulkEditSchema = z.object({
  updatePrice: z.boolean().default(false),
  price: z.number().min(0, 'Price must be positive').optional(),
  updateCostPrice: z.boolean().default(false),
  costPrice: z.number().min(0, 'Cost price must be positive').optional(),
  updateMinStockLevel: z.boolean().default(false),
  minStockLevel: z.number().int().min(0, 'Minimum stock level must be non-negative').optional(),
  updateMaxStockLevel: z.boolean().default(false),
  maxStockLevel: z.number().int().min(1, 'Maximum stock level must be positive').optional(),
  updateStockStatus: z.boolean().default(false),
  stockStatus: z.nativeEnum(StockStatus).optional(),
  updateCategory: z.boolean().default(false),
  category: z.string().max(50, 'Category too long').optional(),
  updateSupplier: z.boolean().default(false),
  supplier: z.string().max(100, 'Supplier name too long').optional(),
  updateLocation: z.boolean().default(false),
  location: z.string().max(50, 'Location too long').optional(),
});

type BulkEditFormData = z.infer<typeof bulkEditSchema>;

interface BulkEditDialogProps {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkEditDialog({ products, open, onOpenChange, onSuccess }: BulkEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bulkUpdateMutation = useBulkUpdateProducts();

  const form = useForm<BulkEditFormData>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: {
      updatePrice: false,
      price: 0,
      updateCostPrice: false,
      costPrice: 0,
      updateMinStockLevel: false,
      minStockLevel: 0,
      updateMaxStockLevel: false,
      maxStockLevel: 100,
      updateStockStatus: false,
      stockStatus: StockStatus.InStock,
      updateCategory: false,
      category: '',
      updateSupplier: false,
      supplier: '',
      updateLocation: false,
      location: '',
    },
  });

  const watchedFields = form.watch();

  const onSubmit = async (data: BulkEditFormData) => {
    setIsSubmitting(true);
    try {
      const updates = products.map(product => {
        const updateRequest: any = {
          productCode: product.productCode,
        };

        if (data.updatePrice && data.price !== undefined) {
          updateRequest.price = data.price;
        }
        if (data.updateCostPrice && data.costPrice !== undefined) {
          updateRequest.costPrice = data.costPrice;
        }
        if (data.updateMinStockLevel && data.minStockLevel !== undefined) {
          updateRequest.minStockLevel = data.minStockLevel;
        }
        if (data.updateMaxStockLevel && data.maxStockLevel !== undefined) {
          updateRequest.maxStockLevel = data.maxStockLevel;
        }
        if (data.updateStockStatus && data.stockStatus !== undefined) {
          updateRequest.stockStatus = data.stockStatus;
        }
        if (data.updateCategory && data.category !== undefined) {
          updateRequest.category = data.category;
        }
        if (data.updateSupplier && data.supplier !== undefined) {
          updateRequest.supplier = data.supplier;
        }
        if (data.updateLocation && data.location !== undefined) {
          updateRequest.location = data.location;
        }

        return updateRequest;
      });

      await bulkUpdateMutation.mutateAsync({ updates });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
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

  const getUpdatedCount = () => {
    return Object.entries(watchedFields).filter(([key, value]) => 
      key.startsWith('update') && value === true
    ).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bulk Edit Products
          </DialogTitle>
          <DialogDescription>
            Update multiple products at once. Only selected fields will be changed.
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
                  <span className="text-muted-foreground">{product.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Price Updates */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm border-b pb-2">Pricing</h4>
                
                <div className="flex items-center space-x-3">
                  <FormField
                    control={form.control}
                    name="updatePrice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Update Sale Price
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchedFields.updatePrice && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <FormField
                    control={form.control}
                    name="updateCostPrice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Update Cost Price
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchedFields.updateCostPrice && (
                    <FormField
                      control={form.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Stock Levels */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm border-b pb-2">Stock Levels</h4>
                
                <div className="flex items-center space-x-3">
                  <FormField
                    control={form.control}
                    name="updateMinStockLevel"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Min Stock Level
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchedFields.updateMinStockLevel && (
                    <FormField
                      control={form.control}
                      name="minStockLevel"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <FormField
                    control={form.control}
                    name="updateMaxStockLevel"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Max Stock Level
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchedFields.updateMaxStockLevel && (
                    <FormField
                      control={form.control}
                      name="maxStockLevel"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <FormField
                    control={form.control}
                    name="updateStockStatus"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Stock Status
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchedFields.updateStockStatus && (
                    <FormField
                      control={form.control}
                      name="stockStatus"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={StockStatus.InStock.toString()}>In Stock</SelectItem>
                              <SelectItem value={StockStatus.LowStock.toString()}>Low Stock</SelectItem>
                              <SelectItem value={StockStatus.OutOfStock.toString()}>Out of Stock</SelectItem>
                              <SelectItem value={StockStatus.Discontinued.toString()}>Discontinued</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Product Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <FormField
                    control={form.control}
                    name="updateCategory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Category
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchedFields.updateCategory && (
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Category" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <FormField
                    control={form.control}
                    name="updateSupplier"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Supplier
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchedFields.updateSupplier && (
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Supplier" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <FormField
                    control={form.control}
                    name="updateLocation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Location
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchedFields.updateLocation && (
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            {getUpdatedCount() === 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Please select at least one field to update.</span>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || getUpdatedCount() === 0}
              >
                {isSubmitting ? 'Updating...' : `Update ${products.length} Products`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}