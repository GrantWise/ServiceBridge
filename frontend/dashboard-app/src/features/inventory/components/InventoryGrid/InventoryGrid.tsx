import { useState, useMemo, useEffect } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Download, 
  Plus,
  Search,
  Filter,
  Settings
} from 'lucide-react';
import { useProducts } from '@/features/shared/hooks/useProducts';
import { useSignalR } from '@/features/shared/hooks/useSignalR';
import { ConnectionIndicator } from '@/features/shared/components/ConnectionIndicator';
import { Product, StockStatus } from '@/features/shared/types/api.types';
import { createInventoryColumns } from './ColumnDefinitions';
import { InventoryFilter } from '../../types/inventory.types';
import { cn } from '@/lib/utils';

interface InventoryGridProps {
  className?: string;
  onProductEdit?: (product: Product) => void;
  onProductScan?: (product: Product) => void;
  onBulkActions?: (selectedProducts: Product[]) => void;
}

export function InventoryGrid({ 
  className, 
  onProductEdit, 
  onProductScan,
  onBulkActions 
}: InventoryGridProps) {
  // State
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [globalFilter, setGlobalFilter] = useState('');

  // SignalR connection for real-time updates
  const { isConnected } = useSignalR();

  // Build query parameters
  const queryParams = useMemo(() => ({
    pageNumber: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: globalFilter,
    sortBy: sorting[0]?.id,
    sortDirection: sorting[0]?.desc ? 'desc' : 'asc',
  }), [pagination, globalFilter, sorting]);

  // Fetch products with real-time updates
  const { 
    data: productsData, 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching 
  } = useProducts(queryParams);

  const products = productsData?.items || [];
  const totalCount = productsData?.totalCount || 0;

  // Table columns
  const columns = useMemo(
    () => createInventoryColumns({
      onEdit: onProductEdit,
      onScan: onProductScan,
      canEdit: (product) => true, // Add role-based logic here
    }),
    [onProductEdit, onProductScan]
  );

  // React Table configuration
  const table = useReactTable({
    data: products,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  // Get selected products for bulk actions
  const selectedProducts = useMemo(() => {
    return table.getFilteredSelectedRowModel().rows.map(row => row.original);
  }, [table, rowSelection]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onBulkActions && selectedProducts.length > 0) {
      onBulkActions(selectedProducts);
    }
  }, [selectedProducts, onBulkActions]);

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle export (placeholder)
  const handleExport = () => {
    console.log('Exporting products...', selectedProducts.length > 0 ? selectedProducts : products);
    // TODO: Implement export functionality
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Failed to load inventory</h3>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <Badge variant="secondary">
            {totalCount.toLocaleString()} products
          </Badge>
          <ConnectionIndicator className="ml-2" />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          {selectedProducts.length > 0 && (
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Bulk Actions ({selectedProducts.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </div>

      {/* Real-time status */}
      {isConnected && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>Real-time updates active</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : header.column.getCanSort()
                      ? header.column.columnDef.header?.(header.getContext())
                      : typeof header.column.columnDef.header === 'string'
                      ? header.column.columnDef.header
                      : null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {cell.column.columnDef.cell?.(cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount)} of{' '}
            {totalCount} products
          </span>
          {selectedProducts.length > 0 && (
            <span>({selectedProducts.length} selected)</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <span className="text-sm font-medium">
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}