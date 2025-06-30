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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useSignalR, useAutoRefreshSettings } from '@/features/shared/hooks/useSignalR';
import { ConnectionIndicator } from '@/features/shared/components/ConnectionIndicator';
import { Product, StockStatus } from '@/features/shared/types/api.types';
import { createInventoryColumns } from './ColumnDefinitions';
import { AdvancedFilters, AdvancedFilterState } from './AdvancedFilters';
import { ColumnVisibilityControls } from './ColumnVisibilityControls';
import { ExportManager } from './ExportManager';
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
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({});

  // SignalR connection for real-time updates
  const { isConnected, autoRefreshEnabled } = useSignalR();
  const { toggleAutoRefresh, setRefreshInterval, autoRefreshInterval } = useAutoRefreshSettings();

  // Build query parameters
  const queryParams = useMemo(() => {
    let searchQuery = globalFilter;
    
    // Append advanced filters to search query for basic filtering
    if (advancedFilters.productCode) {
      searchQuery = searchQuery ? `${searchQuery} code:${advancedFilters.productCode}` : `code:${advancedFilters.productCode}`;
    }
    if (advancedFilters.description) {
      searchQuery = searchQuery ? `${searchQuery} desc:${advancedFilters.description}` : `desc:${advancedFilters.description}`;
    }
    
    return {
      pageNumber: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: searchQuery,
      stockStatus: advancedFilters.stockStatus,
      sortBy: sorting[0]?.id,
      sortDirection: sorting[0]?.desc ? 'desc' : 'asc',
    };
  }, [pagination, globalFilter, sorting, advancedFilters]);

  // Fetch products with real-time updates
  const { 
    data: productsData, 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching 
  } = useProducts(queryParams);

  // Apply client-side filtering for numeric ranges
  const filteredProducts = useMemo(() => {
    let products = productsData?.data || [];
    
    // Apply quantity range filter
    if (advancedFilters.quantityRange?.min !== undefined || advancedFilters.quantityRange?.max !== undefined) {
      products = products.filter(product => {
        const quantity = product.quantityOnHand;
        if (advancedFilters.quantityRange?.min !== undefined && quantity < advancedFilters.quantityRange.min) {
          return false;
        }
        if (advancedFilters.quantityRange?.max !== undefined && quantity > advancedFilters.quantityRange.max) {
          return false;
        }
        return true;
      });
    }
    
    // Apply days range filter
    if (advancedFilters.daysRange?.min !== undefined || advancedFilters.daysRange?.max !== undefined) {
      products = products.filter(product => {
        const days = product.daysCoverRemaining;
        if (advancedFilters.daysRange?.min !== undefined && days < advancedFilters.daysRange.min) {
          return false;
        }
        if (advancedFilters.daysRange?.max !== undefined && days > advancedFilters.daysRange.max) {
          return false;
        }
        return true;
      });
    }
    
    return products;
  }, [productsData?.data, advancedFilters]);

  const products = filteredProducts;
  const totalCount = products.length;

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


  // Handle advanced filters
  const handleAdvancedFiltersChange = (filters: AdvancedFilterState) => {
    setAdvancedFilters(filters);
    // Reset pagination when filters change
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({});
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Auto-refresh
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Auto-refresh Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={autoRefreshEnabled}
                onCheckedChange={toggleAutoRefresh}
              >
                Enable auto-refresh
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Refresh Interval</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setRefreshInterval(1)}>
                1 minute {autoRefreshInterval === 1 && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefreshInterval(5)}>
                5 minutes {autoRefreshInterval === 5 && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefreshInterval(10)}>
                10 minutes {autoRefreshInterval === 10 && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefreshInterval(30)}>
                30 minutes {autoRefreshInterval === 30 && '✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ExportManager 
            table={table}
            selectedProducts={selectedProducts}
            allProducts={productsData?.data || []}
          />
          
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
        
        <AdvancedFilters
          filters={advancedFilters}
          onFiltersChange={handleAdvancedFiltersChange}
          onClearFilters={handleClearAdvancedFilters}
        />
        
        <ColumnVisibilityControls table={table} />
      </div>

      {/* Real-time status */}
      {isConnected && (
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Real-time connection active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "h-2 w-2 rounded-full", 
              autoRefreshEnabled ? "bg-blue-500" : "bg-gray-400"
            )} />
            <span>
              Auto-refresh {autoRefreshEnabled ? `enabled (${autoRefreshInterval}min)` : 'disabled'}
            </span>
          </div>
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
                      : typeof header.column.columnDef.header === 'function'
                      ? header.column.columnDef.header(header.getContext())
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