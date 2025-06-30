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
import { Product, StockStatus } from '@/features/shared/types/api.types';
import { useUpdateProduct } from '@/features/shared/hooks/useProducts';
import { 
  getProductName, 
  getStockLevel, 
  getProductPrice, 
  getProductCostPrice,
  getMinStockLevel,
  getMaxStockLevel,
  getProductCategory,
  getProductSupplier,
  getProductLocation 
} from '@/features/shared/utils/productUtils';

const productEditSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  price: z.number().min(0, 'Price must be positive'),
  costPrice: z.number().min(0, 'Cost price must be positive').optional(),
  stockLevel: z.number().int().min(0, 'Stock level must be non-negative'),
  minStockLevel: z.number().int().min(0, 'Minimum stock level must be non-negative'),
  maxStockLevel: z.number().int().min(1, 'Maximum stock level must be positive'),
  stockStatus: z.nativeEnum(StockStatus),
  category: z.string().max(50, 'Category too long').optional(),
  supplier: z.string().max(100, 'Supplier name too long').optional(),
  location: z.string().max(50, 'Location too long').optional(),
});

type ProductEditFormData = z.infer<typeof productEditSchema>;

interface ProductEditDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductEditDialog({ product, open, onOpenChange }: ProductEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateProductMutation = useUpdateProduct();

  const form = useForm<ProductEditFormData>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: product ? getProductName(product) : '',
      description: product?.description || '',
      price: product ? getProductPrice(product) : 0,
      costPrice: product ? getProductCostPrice(product) : 0,
      stockLevel: product ? getStockLevel(product) : 0,
      minStockLevel: product ? getMinStockLevel(product) : 0,
      maxStockLevel: product ? getMaxStockLevel(product) : 100,
      stockStatus: product?.stockStatus || StockStatus.InStock,
      category: product ? getProductCategory(product) : '',
      supplier: product ? getProductSupplier(product) : '',
      location: product ? getProductLocation(product) : '',
    },
  });

  // Reset form when product changes
  useState(() => {
    if (product) {
      form.reset({
        name: getProductName(product),
        description: product.description || '',
        price: getProductPrice(product),
        costPrice: getProductCostPrice(product),
        stockLevel: getStockLevel(product),
        minStockLevel: getMinStockLevel(product),
        maxStockLevel: getMaxStockLevel(product),
        stockStatus: product.stockStatus,
        category: getProductCategory(product),
        supplier: getProductSupplier(product),
        location: getProductLocation(product),
      });
    }
  });

  const onSubmit = async (data: ProductEditFormData) => {
    if (!product) return;

    setIsSubmitting(true);
    try {
      await updateProductMutation.mutateAsync({
        productCode: product.productCode,
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          costPrice: data.costPrice,
          stockLevel: data.stockLevel,
          quantityOnHand: data.stockLevel, // Include for API compatibility
          minStockLevel: data.minStockLevel,
          maxStockLevel: data.maxStockLevel,
          stockStatus: data.stockStatus,
          category: data.category,
          supplier: data.supplier,
          location: data.location,
        },
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product details. All changes will be saved to the database.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Electronics, Clothing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product description..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price *</FormLabel>
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
                    <FormDescription>Customer-facing price</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price</FormLabel>
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
                    <FormDescription>Internal cost price</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="stockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Stock *</FormLabel>
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

              <FormField
                control={form.control}
                name="minStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Stock Level *</FormLabel>
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

              <FormField
                control={form.control}
                name="maxStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Stock Level *</FormLabel>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stockStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Status</FormLabel>
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

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A1-B2, Warehouse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="Supplier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}