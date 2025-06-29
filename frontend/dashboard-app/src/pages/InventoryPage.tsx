import { useState } from 'react';
import { InventoryGrid } from '@/features/inventory/components/InventoryGrid/InventoryGrid';
import { Product } from '@/features/shared/types/api.types';
import { useSignalR } from '@/features/shared/hooks/useSignalR';

export function InventoryPage() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const { isConnected, connectionCount } = useSignalR();

  const handleProductEdit = (product: Product) => {
    console.log('Edit product:', product.productCode);
    // TODO: Open edit dialog/form
  };

  const handleProductScan = (product: Product) => {
    console.log('Scan product:', product.productCode);
    // TODO: Open scan dialog/form
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

      {selectedProducts.length > 0 && (
        <div className="rounded-lg border p-4 bg-muted/30">
          <h3 className="font-medium mb-2">Bulk Actions Available</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {selectedProducts.length} products selected: {selectedProducts.map(p => p.productCode).join(', ')}
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
              Bulk Edit
            </button>
            <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm">
              Export Selected
            </button>
            <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">
              Process Bulk Scan
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}