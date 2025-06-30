import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Product } from '@/features/shared/types/api.types';
import { Table } from '@tanstack/react-table';
import { toast } from 'sonner';

interface ExportManagerProps {
  table: Table<Product>;
  selectedProducts: Product[];
  allProducts: Product[];
}

type ExportFormat = 'csv' | 'excel' | 'json';
type ExportScope = 'selected' | 'filtered' | 'all';

interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  includeHeaders: boolean;
  selectedColumns: string[];
}

const defaultColumns = [
  'productCode',
  'description', 
  'quantityOnHand',
  'averageMonthlyConsumption',
  'daysCoverRemaining',
  'leadTimeDays',
  'quantityOnOrder',
  'stockStatus',
  'lastUpdated'
];

export function ExportManager({ table, selectedProducts, allProducts }: ExportManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    scope: 'filtered',
    includeHeaders: true,
    selectedColumns: defaultColumns,
  });

  const visibleColumns = table.getAllColumns().filter(col => col.getIsVisible() && col.id !== 'select' && col.id !== 'actions');
  const filteredProducts = table.getFilteredRowModel().rows.map(row => row.original);

  const getExportData = (): Product[] => {
    switch (exportOptions.scope) {
      case 'selected':
        return selectedProducts;
      case 'filtered':
        return filteredProducts;
      case 'all':
        return allProducts;
      default:
        return filteredProducts;
    }
  };

  const getColumnDisplayName = (columnId: string): string => {
    const displayNames: Record<string, string> = {
      productCode: 'Product Code',
      description: 'Description',
      quantityOnHand: 'Quantity on Hand',
      averageMonthlyConsumption: 'Average Monthly Consumption',
      daysCoverRemaining: 'Days Cover Remaining',
      leadTimeDays: 'Lead Time (Days)',
      quantityOnOrder: 'Quantity on Order',
      stockStatus: 'Stock Status',
      lastUpdated: 'Last Updated',
    };
    return displayNames[columnId] || columnId;
  };

  const formatCellValue = (value: any, columnId: string): string => {
    if (value === null || value === undefined) return '';
    
    switch (columnId) {
      case 'stockStatus':
        const statusLabels = ['Out of Stock', 'Low Stock', 'In Stock', 'Overstocked'];
        return statusLabels[value] || 'Unknown';
      case 'lastUpdated':
        return new Date(value).toLocaleString();
      case 'quantityOnHand':
      case 'averageMonthlyConsumption':
      case 'quantityOnOrder':
        return value.toLocaleString();
      case 'daysCoverRemaining':
        return value === -1 ? 'Unlimited' : value.toString();
      default:
        return value.toString();
    }
  };

  const exportToCSV = (data: Product[]): string => {
    const headers = exportOptions.includeHeaders 
      ? exportOptions.selectedColumns.map(col => getColumnDisplayName(col))
      : [];
    
    const rows = data.map(product => 
      exportOptions.selectedColumns.map(col => {
        const value = product[col as keyof Product];
        const formattedValue = formatCellValue(value, col);
        // Escape quotes and wrap in quotes if contains comma
        return formattedValue.includes(',') || formattedValue.includes('"') 
          ? `"${formattedValue.replace(/"/g, '""')}"` 
          : formattedValue;
      })
    );

    const csvContent = exportOptions.includeHeaders 
      ? [headers, ...rows].map(row => row.join(',')).join('\n')
      : rows.map(row => row.join(',')).join('\n');
    
    return csvContent;
  };

  const exportToJSON = (data: Product[]): string => {
    const exportData = data.map(product => {
      const filteredProduct: Partial<Product> = {};
      exportOptions.selectedColumns.forEach(col => {
        const key = col as keyof Product;
        filteredProduct[key] = product[key];
      });
      return filteredProduct;
    });
    
    return JSON.stringify(exportData, null, 2);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const data = getExportData();
      
      if (data.length === 0) {
        toast.error('No data to export');
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const scopeLabel = exportOptions.scope === 'selected' ? 'selected' : 
                        exportOptions.scope === 'filtered' ? 'filtered' : 'all';
      
      switch (exportOptions.format) {
        case 'csv':
          const csvContent = exportToCSV(data);
          downloadFile(csvContent, `inventory-${scopeLabel}-${timestamp}.csv`, 'text/csv');
          break;
        
        case 'json':
          const jsonContent = exportToJSON(data);
          downloadFile(jsonContent, `inventory-${scopeLabel}-${timestamp}.json`, 'application/json');
          break;
        
        case 'excel':
          // For Excel, we'll use CSV format with Excel-friendly headers
          const excelContent = exportToCSV(data);
          downloadFile(excelContent, `inventory-${scopeLabel}-${timestamp}.csv`, 'application/vnd.ms-excel');
          break;
      }
      
      toast.success(`Exported ${data.length} products to ${exportOptions.format.toUpperCase()}`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = (format: ExportFormat) => {
    setExportOptions(prev => ({ ...prev, format, scope: 'filtered' }));
    // Perform immediate export with current settings
    const data = filteredProducts;
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    switch (format) {
      case 'csv':
        const csvContent = exportToCSV(data);
        downloadFile(csvContent, `inventory-${timestamp}.csv`, 'text/csv');
        break;
      case 'json':
        const jsonContent = exportToJSON(data);
        downloadFile(jsonContent, `inventory-${timestamp}.json`, 'application/json');
        break;
    }
    
    toast.success(`Exported ${data.length} products to ${format.toUpperCase()}`);
  };

  const getScopeLabel = (scope: ExportScope): string => {
    switch (scope) {
      case 'selected':
        return `Selected Products (${selectedProducts.length})`;
      case 'filtered':
        return `Filtered Results (${filteredProducts.length})`;
      case 'all':
        return `All Products (${allProducts.length})`;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Quick Export</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
            <FileDown className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('json')}>
            <FileDown className="mr-2 h-4 w-4" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Advanced Export...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Advanced Export</DialogTitle>
            <DialogDescription>
              Configure your export settings and choose which data to include.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value: ExportFormat) => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                  <SelectItem value="excel">Excel Compatible CSV</SelectItem>
                  <SelectItem value="json">JSON (Data Format)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <Label>Export Scope</Label>
              <Select 
                value={exportOptions.scope} 
                onValueChange={(value: ExportScope) => 
                  setExportOptions(prev => ({ ...prev, scope: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filtered">{getScopeLabel('filtered')}</SelectItem>
                  <SelectItem value="selected" disabled={selectedProducts.length === 0}>
                    {getScopeLabel('selected')}
                  </SelectItem>
                  <SelectItem value="all">{getScopeLabel('all')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Column Selection */}
            <div className="space-y-2">
              <Label>Columns to Export</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {visibleColumns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={exportOptions.selectedColumns.includes(column.id)}
                      onCheckedChange={(checked) => {
                        setExportOptions(prev => ({
                          ...prev,
                          selectedColumns: checked
                            ? [...prev.selectedColumns, column.id]
                            : prev.selectedColumns.filter(col => col !== column.id)
                        }));
                      }}
                    />
                    <Label htmlFor={column.id} className="text-xs">
                      {getColumnDisplayName(column.id)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Include Headers */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeHeaders"
                checked={exportOptions.includeHeaders}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeHeaders: !!checked }))
                }
              />
              <Label htmlFor="includeHeaders">Include column headers</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || exportOptions.selectedColumns.length === 0}
            >
              {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Export {getExportData().length} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}