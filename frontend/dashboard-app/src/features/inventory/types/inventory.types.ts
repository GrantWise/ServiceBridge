import { Product, StockStatus, TransactionType } from '@/features/shared/types/api.types';

export interface InventoryGridColumn {
  id: string;
  header: string;
  accessorKey?: string;
  cell?: (value: any, row: Product) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
}

export interface InventoryFilter {
  search?: string;
  stockStatus?: StockStatus[];
  minQuantity?: number;
  maxQuantity?: number;
  minDaysCover?: number;
  maxDaysCover?: number;
  lastUpdatedBy?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface InventorySort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface InventoryGridState {
  filters: InventoryFilter;
  sort: InventorySort;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  selectedRows: Set<string>;
  editingRow: string | null;
  bulkEditMode: boolean;
}

export interface EditableProduct extends Product {
  isEditing?: boolean;
  hasChanges?: boolean;
  originalValues?: Partial<Product>;
}

export interface BulkEditData {
  selectedProductCodes: string[];
  changes: Partial<Pick<Product, 'description' | 'quantityOnHand' | 'averageMonthlyConsumption' | 'leadTimeDays' | 'quantityOnOrder'>>;
  updatedBy: string;
}

export interface QuickScanData {
  productCode: string;
  quantityScanned: number;
  transactionType: TransactionType;
  scannedBy: string;
  notes?: string;
}

export interface GridAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (productCode: string, product: Product) => void;
  disabled?: (product: Product) => boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

// Stock status utilities
export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case StockStatus.Adequate:
      return 'text-green-600 bg-green-50';
    case StockStatus.Low:
      return 'text-yellow-600 bg-yellow-50';
    case StockStatus.Overstocked:
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case StockStatus.Adequate:
      return 'Adequate';
    case StockStatus.Low:
      return 'Low Stock';
    case StockStatus.Overstocked:
      return 'Overstocked';
    default:
      return 'Unknown';
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) return 'Overdue';
  if (days < 1) return '< 1 day';
  if (days === 1) return '1 day';
  if (days < 30) return `${Math.round(days)} days`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}