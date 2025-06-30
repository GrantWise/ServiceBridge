import { useState } from 'react';
import { InventoryGrid } from '@/features/inventory/components/InventoryGrid/InventoryGrid';
import { ProductEditDialog } from '@/features/inventory/components/ProductEditDialog/ProductEditDialog';
import { ScanConfirmationDialog } from '@/features/inventory/components/ScanConfirmationDialog/ScanConfirmationDialog';
import { BulkActionsBar } from '@/features/inventory/components/BulkOperations/BulkActionsBar';
import { Product } from '@/features/shared/types/api.types';
import { useSignalR } from '@/features/shared/hooks/useSignalR';

export function InventoryPage() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [scanningProduct, setScanningProduct] = useState<Product | null>(null);
  const { isConnected, connectionCount } = useSignalR();

  const handleProductEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleProductScan = (product: Product) => {
    setScanningProduct(product);
  };

  const handleBulkActions = (products: Product[]) => {
    setSelectedProducts(products);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">
          Real-time inventory grid with multi-protocol integration demo
        </p>
        {isConnected && (
          <p className="text-sm text-green-600 mt-1">
            ✓ Live updates enabled • {connectionCount} active connections
          </p>
        )}
      </div>

      <InventoryGrid
        onProductEdit={handleProductEdit}
        onProductScan={handleProductScan}
        onBulkActions={handleBulkActions}
      />

      <BulkActionsBar
        selectedProducts={selectedProducts}
        onClearSelection={() => setSelectedProducts([])}
      />

      {/* Technology Demo Info */}
      <div className="rounded-lg border p-6 bg-card">
        <h3 className="font-semibold mb-3">🔧 Technology Integration Demo</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">REST API</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Product CRUD operations</li>
              <li>• Paginated data loading</li>
              <li>• Search and filtering</li>
              <li>• Optimistic updates</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">SignalR Real-time</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Live inventory updates</li>
              <li>• User presence tracking</li>
              <li>• Collaborative editing</li>
              <li>• Connection monitoring</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">gRPC (Future)</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Business calculations</li>
              <li>• Bulk operations</li>
              <li>• Performance metrics</li>
              <li>• Streaming responses</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ProductEditDialog
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      />
      
      <ScanConfirmationDialog
        product={scanningProduct}
        open={!!scanningProduct}
        onOpenChange={(open) => !open && setScanningProduct(null)}
      />
    </div>
  );
}