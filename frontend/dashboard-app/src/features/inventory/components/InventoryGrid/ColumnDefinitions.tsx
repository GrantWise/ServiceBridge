import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/features/shared/types/api.types';
import { 
  getStockStatusColor, 
  getStockStatusLabel, 
  formatNumber,
  formatDaysRemaining 
} from '../../types/inventory.types';
import { cn } from '@/lib/utils';

interface ColumnConfig {
  onEdit?: (product: Product) => void;
  onScan?: (product: Product) => void;
  canEdit?: (product: Product) => boolean;
}

export function createInventoryColumns(config: ColumnConfig = {}): ColumnDef<Product>[] {
  const { onEdit, onScan, canEdit = () => true } = config;

  return [
    // Selection column
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    // Product Code
    {
      accessorKey: 'productCode',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Product Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue('productCode')}
        </div>
      ),
      size: 120,
    },

    // Description
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Description
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {row.getValue('description')}
        </div>
      ),
      size: 200,
    },

    // Quantity on Hand
    {
      accessorKey: 'quantityOnHand',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Qty on Hand
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatNumber(row.getValue('quantityOnHand'))}
        </div>
      ),
      size: 100,
    },

    // Average Monthly Consumption
    {
      accessorKey: 'averageMonthlyConsumption',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Avg Monthly Use
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue('averageMonthlyConsumption'), 1)}
        </div>
      ),
      size: 120,
    },

    // Days Cover Remaining
    {
      accessorKey: 'daysCoverRemaining',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Days Cover
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const days = row.getValue('daysCoverRemaining') as number;
        return (
          <div className={cn(
            'text-right font-medium',
            days < 7 ? 'text-red-600' : days < 30 ? 'text-yellow-600' : 'text-green-600'
          )}>
            {formatDaysRemaining(days)}
          </div>
        );
      },
      size: 100,
    },

    // Lead Time
    {
      accessorKey: 'leadTimeDays',
      header: 'Lead Time',
      cell: ({ row }) => (
        <div className="text-right">
          {row.getValue('leadTimeDays')} days
        </div>
      ),
      size: 80,
    },

    // Quantity on Order
    {
      accessorKey: 'quantityOnOrder',
      header: 'Qty on Order',
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue('quantityOnOrder'))}
        </div>
      ),
      size: 100,
    },

    // Stock Status
    {
      accessorKey: 'stockStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('stockStatus') as number;
        return (
          <Badge
            variant="outline"
            className={cn('font-medium', getStockStatusColor(status))}
          >
            {getStockStatusLabel(status)}
          </Badge>
        );
      },
      size: 100,
    },

    // Last Updated
    {
      accessorKey: 'lastUpdated',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Last Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('lastUpdated'));
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        );
      },
      size: 120,
    },

    // Actions
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const product = row.original;
        
        return (
          <div className="flex items-center gap-1">
            {onScan && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onScan(product)}
                className="h-8 w-8 p-0"
              >
                <Scan className="h-4 w-4" />
                <span className="sr-only">Scan product</span>
              </Button>
            )}
            
            {onEdit && canEdit(product) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(product)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit product</span>
              </Button>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 80,
    },
  ];
}