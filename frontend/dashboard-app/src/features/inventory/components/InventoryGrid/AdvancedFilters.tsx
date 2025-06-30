import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { StockStatus } from '@/features/shared/types/api.types';
import { getStockStatusLabel } from '../../types/inventory.types';

export interface AdvancedFilterState {
  stockStatus?: StockStatus;
  quantityRange?: {
    min?: number;
    max?: number;
  };
  daysRange?: {
    min?: number;
    max?: number;
  };
  productCode?: string;
  description?: string;
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  onClearFilters: () => void;
}

export function AdvancedFilters({ filters, onFiltersChange, onClearFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<AdvancedFilterState>(filters);

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof AdvancedFilterState];
    if (key === 'quantityRange' || key === 'daysRange') {
      return value && (value.min !== undefined || value.max !== undefined);
    }
    return value !== undefined && value !== '';
  });

  const activeFilterCount = Object.keys(filters).reduce((count, key) => {
    const value = filters[key as keyof AdvancedFilterState];
    if (key === 'quantityRange' || key === 'daysRange') {
      if (value && (value.min !== undefined || value.max !== undefined)) {
        return count + 1;
      }
    } else if (value !== undefined && value !== '') {
      return count + 1;
    }
    return count;
  }, 0);

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setTempFilters({});
    onClearFilters();
    setIsOpen(false);
  };

  const updateTempFilter = (key: keyof AdvancedFilterState, value: any) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-4 space-y-4">
          {/* Stock Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Stock Status</Label>
            <Select
              value={tempFilters.stockStatus?.toString() || ''}
              onValueChange={(value) => 
                updateTempFilter('stockStatus', value ? parseInt(value) as StockStatus : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any status</SelectItem>
                <SelectItem value="0">{getStockStatusLabel(0)}</SelectItem>
                <SelectItem value="1">{getStockStatusLabel(1)}</SelectItem>
                <SelectItem value="2">{getStockStatusLabel(2)}</SelectItem>
                <SelectItem value="3">{getStockStatusLabel(3)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quantity on Hand</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={tempFilters.quantityRange?.min || ''}
                onChange={(e) => 
                  updateTempFilter('quantityRange', {
                    ...tempFilters.quantityRange,
                    min: e.target.value ? parseInt(e.target.value) : undefined
                  })
                }
                className="w-20"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={tempFilters.quantityRange?.max || ''}
                onChange={(e) => 
                  updateTempFilter('quantityRange', {
                    ...tempFilters.quantityRange,
                    max: e.target.value ? parseInt(e.target.value) : undefined
                  })
                }
                className="w-20"
              />
            </div>
          </div>

          {/* Days Cover Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Days Cover Remaining</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={tempFilters.daysRange?.min || ''}
                onChange={(e) => 
                  updateTempFilter('daysRange', {
                    ...tempFilters.daysRange,
                    min: e.target.value ? parseInt(e.target.value) : undefined
                  })
                }
                className="w-20"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={tempFilters.daysRange?.max || ''}
                onChange={(e) => 
                  updateTempFilter('daysRange', {
                    ...tempFilters.daysRange,
                    max: e.target.value ? parseInt(e.target.value) : undefined
                  })
                }
                className="w-20"
              />
            </div>
          </div>

          {/* Product Code Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Product Code</Label>
            <Input
              placeholder="Enter product code"
              value={tempFilters.productCode || ''}
              onChange={(e) => updateTempFilter('productCode', e.target.value || undefined)}
            />
          </div>

          {/* Description Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description</Label>
            <Input
              placeholder="Search description"
              value={tempFilters.description || ''}
              onChange={(e) => updateTempFilter('description', e.target.value || undefined)}
            />
          </div>
        </div>

        <DropdownMenuSeparator />
        
        <div className="flex items-center justify-between p-4">
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button size="sm" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}