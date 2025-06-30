import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { Table } from '@tanstack/react-table';
import { Product } from '@/features/shared/types/api.types';

interface ColumnVisibilityControlsProps {
  table: Table<Product>;
}

export function ColumnVisibilityControls({ table }: ColumnVisibilityControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const allColumns = table.getAllColumns();
  const hiddenCount = allColumns.filter(column => !column.getIsVisible() && column.getCanHide()).length;
  const toggleableColumns = allColumns.filter(column => column.getCanHide());

  const handleShowAll = () => {
    toggleableColumns.forEach(column => {
      column.toggleVisibility(true);
    });
  };

  const handleHideAll = () => {
    toggleableColumns.forEach(column => {
      column.toggleVisibility(false);
    });
  };

  const handleResetToDefault = () => {
    // Reset to default visibility - show all columns except selection
    toggleableColumns.forEach(column => {
      if (column.id === 'select') {
        column.toggleVisibility(true);
      } else {
        column.toggleVisibility(true);
      }
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Settings className="mr-2 h-4 w-4" />
          Columns
          {hiddenCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              {hiddenCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Column Visibility</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-2 space-y-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShowAll}
              className="h-7 px-2 text-xs"
            >
              <Eye className="mr-1 h-3 w-3" />
              Show All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleHideAll}
              className="h-7 px-2 text-xs"
            >
              <EyeOff className="mr-1 h-3 w-3" />
              Hide All
            </Button>
          </div>
          
          <DropdownMenuSeparator />
          
          {toggleableColumns.map((column) => {
            const columnDisplayName = getColumnDisplayName(column.id);
            
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {columnDisplayName}
              </DropdownMenuCheckboxItem>
            );
          })}
          
          <DropdownMenuSeparator />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleResetToDefault}
            className="w-full h-7 text-xs"
          >
            Reset to Default
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to get user-friendly column names
function getColumnDisplayName(columnId: string): string {
  const displayNames: Record<string, string> = {
    select: 'Selection',
    productCode: 'Product Code',
    description: 'Description',
    quantityOnHand: 'Qty on Hand',
    averageMonthlyConsumption: 'Avg Monthly Use',
    daysCoverRemaining: 'Days Cover',
    leadTimeDays: 'Lead Time',
    quantityOnOrder: 'Qty on Order',
    stockStatus: 'Status',
    lastUpdated: 'Last Updated',
    actions: 'Actions',
  };
  
  return displayNames[columnId] || columnId;
}