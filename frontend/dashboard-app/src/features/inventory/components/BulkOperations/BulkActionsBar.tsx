import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Download, 
  Scan, 
  ChevronDown, 
  FileText, 
  FileSpreadsheet,
  Package,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Product } from '@/features/shared/types/api.types';
import { BulkEditDialog } from './BulkEditDialog';
import { BulkScanDialog } from './BulkScanDialog';
import { ExportDialog } from './ExportDialog';

interface BulkActionsBarProps {
  selectedProducts: Product[];
  onClearSelection: () => void;
}

export function BulkActionsBar({ selectedProducts, onClearSelection }: BulkActionsBarProps) {
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkScan, setShowBulkScan] = useState(false);
  const [showExport, setShowExport] = useState(false);

  if (selectedProducts.length === 0) return null;

  const handleExportCSV = () => {
    const headers = ['Product Code', 'Name', 'Price', 'Stock Level', 'Category', 'Supplier'];
    const csvContent = [
      headers.join(','),
      ...selectedProducts.map(product => [
        product.productCode,
        `"${product.name}"`,
        product.price,
        product.stockLevel,
        product.category || '',
        product.supplier || ''
      ].join(','))
    ].join('\n');

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

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(selectedProducts, null, 2);
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

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <div>
            <h3 className="font-medium">Bulk Actions</h3>
            <p className="text-sm text-muted-foreground">
              <Badge variant="secondary" className="mr-2">
                {selectedProducts.length}
              </Badge>
              products selected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkEdit(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Bulk Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Bulk Scan
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowBulkScan(true)}>
                <Package className="h-4 w-4 mr-2" />
                Stock In
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBulkScan(true)}>
                <Package className="h-4 w-4 mr-2" />
                Stock Out
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBulkScan(true)}>
                <Package className="h-4 w-4 mr-2" />
                Stock Adjustment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                <FileText className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowExport(true)}>
                <Download className="h-4 w-4 mr-2" />
                Advanced Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={onClearSelection}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <BulkEditDialog
        products={selectedProducts}
        open={showBulkEdit}
        onOpenChange={setShowBulkEdit}
        onSuccess={onClearSelection}
      />

      <BulkScanDialog
        products={selectedProducts}
        open={showBulkScan}
        onOpenChange={setShowBulkScan}
        onSuccess={onClearSelection}
      />

      <ExportDialog
        products={selectedProducts}
        open={showExport}
        onOpenChange={setShowExport}
      />
    </>
  );
}