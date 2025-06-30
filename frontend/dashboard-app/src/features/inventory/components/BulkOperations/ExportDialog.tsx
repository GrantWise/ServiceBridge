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
import { Product } from '@/features/shared/types/api.types';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

const exportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']),
  includeProductCode: z.boolean().default(true),
  includeName: z.boolean().default(true),
  includeDescription: z.boolean().default(false),
  includePrice: z.boolean().default(true),
  includeCostPrice: z.boolean().default(false),
  includeStockLevel: z.boolean().default(true),
  includeStockStatus: z.boolean().default(true),
  includeCategory: z.boolean().default(false),
  includeSupplier: z.boolean().default(false),
  includeLocation: z.boolean().default(false),
  includeTimestamps: z.boolean().default(false),
});

type ExportFormData = z.infer<typeof exportSchema>;

interface ExportDialogProps {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ products, open, onOpenChange }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);

  const form = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format: 'csv',
      includeProductCode: true,
      includeName: true,
      includeDescription: false,
      includePrice: true,
      includeCostPrice: false,
      includeStockLevel: true,
      includeStockStatus: true,
      includeCategory: false,
      includeSupplier: false,
      includeLocation: false,
      includeTimestamps: false,
    },
  });

  const watchedFields = form.watch();

  const getSelectedFields = () => {
    const fields = [];
    if (watchedFields.includeProductCode) fields.push({ key: 'productCode', label: 'Product Code' });
    if (watchedFields.includeName) fields.push({ key: 'name', label: 'Name' });
    if (watchedFields.includeDescription) fields.push({ key: 'description', label: 'Description' });
    if (watchedFields.includePrice) fields.push({ key: 'price', label: 'Price' });
    if (watchedFields.includeCostPrice) fields.push({ key: 'costPrice', label: 'Cost Price' });
    if (watchedFields.includeStockLevel) fields.push({ key: 'stockLevel', label: 'Stock Level' });
    if (watchedFields.includeStockStatus) fields.push({ key: 'stockStatus', label: 'Stock Status' });
    if (watchedFields.includeCategory) fields.push({ key: 'category', label: 'Category' });
    if (watchedFields.includeSupplier) fields.push({ key: 'supplier', label: 'Supplier' });
    if (watchedFields.includeLocation) fields.push({ key: 'location', label: 'Location' });
    if (watchedFields.includeTimestamps) {
      fields.push({ key: 'createdAt', label: 'Created At' });
      fields.push({ key: 'updatedAt', label: 'Updated At' });
    }
    return fields;
  };

  const exportToCSV = (fields: any[]) => {
    const headers = fields.map(f => f.label);
    const rows = products.map(product => 
      fields.map(field => {
        const value = (product as any)[field.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
        if (value instanceof Date) return value.toISOString();
        return value.toString();
      })
    );

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = (fields: any[]) => {
    const exportData = products.map(product => {
      const filtered: any = {};
      fields.forEach(field => {
        filtered[field.key] = (product as any)[field.key];
      });
      return filtered;
    });

    const jsonContent = JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalRecords: products.length,
      products: exportData
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const onSubmit = async (data: ExportFormData) => {
    setIsExporting(true);
    try {
      const fields = getSelectedFields();
      
      if (fields.length === 0) {
        toast.error('Please select at least one field to export');
        return;
      }

      switch (data.format) {
        case 'csv':
          exportToCSV(fields);
          break;
        case 'json':
          exportToJSON(fields);
          break;
        case 'xlsx':
          // For XLSX, we'd need a library like xlsx or exceljs
          toast.error('XLSX export not implemented yet');
          return;
      }

      toast.success(`Successfully exported ${products.length} products as ${data.format.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to export products');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const selectedFieldsCount = getSelectedFields().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Advanced Export
          </DialogTitle>
          <DialogDescription>
            Choose export format and select which fields to include
          </DialogDescription>
        </DialogHeader>

        {/* Export Info */}
        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{products.length} products</Badge>
              <Badge variant="outline">{selectedFieldsCount} fields</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Export ready
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Export Format</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV (Comma Separated Values)
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          JSON (JavaScript Object Notation)
                        </div>
                      </SelectItem>
                      <SelectItem value="xlsx" disabled>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          XLSX (Excel Spreadsheet) - Coming Soon
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h4 className="font-medium text-sm">Select Fields to Export</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-muted-foreground">Basic Information</h5>
                  <FormField
                    control={form.control}
                    name="includeProductCode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Product Code
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="includeName"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Product Name
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="includeDescription"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Description
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="includeCategory"
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
                </div>

                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-muted-foreground">Business Data</h5>
                  <FormField
                    control={form.control}
                    name="includePrice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Sale Price
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="includeCostPrice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Cost Price
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="includeStockLevel"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Stock Level
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="includeStockStatus"
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
                </div>

                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-muted-foreground">Additional</h5>
                  <FormField
                    control={form.control}
                    name="includeSupplier"
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
                  <FormField
                    control={form.control}
                    name="includeLocation"
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
                  <FormField
                    control={form.control}
                    name="includeTimestamps"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Timestamps
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isExporting || selectedFieldsCount === 0}
              >
                {isExporting ? 'Exporting...' : `Export ${products.length} Products`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}