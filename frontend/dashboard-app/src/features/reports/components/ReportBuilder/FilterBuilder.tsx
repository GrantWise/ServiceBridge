import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import type { ReportFilter, ReportField, ReportTemplate } from '../../types/reports.types';

interface FilterBuilderProps {
  fields: ReportField[];
  onAddFilter: (filter: ReportFilter) => void;
  category: ReportTemplate['category'];
}

const OPERATOR_OPTIONS = {
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'in', label: 'In List' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'between', label: 'Between' }
  ],
  currency: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'between', label: 'Between' }
  ],
  date: [
    { value: 'equals', label: 'On Date' },
    { value: 'greater_than', label: 'After Date' },
    { value: 'less_than', label: 'Before Date' },
    { value: 'between', label: 'Between Dates' }
  ],
  boolean: [
    { value: 'equals', label: 'Equals' }
  ]
};

const PRESET_FILTERS = {
  inventory: [
    { field: 'quantity', operator: 'less_than', value: 10, label: 'Low Stock Items' },
    { field: 'isActive', operator: 'equals', value: true, label: 'Active Products Only' },
    { field: 'category', operator: 'equals', value: '', label: 'Specific Category' }
  ],
  analytics: [
    { field: 'date', operator: 'between', value: '', label: 'Date Range' },
    { field: 'revenue', operator: 'greater_than', value: 0, label: 'Revenue Above' },
    { field: 'salesCount', operator: 'greater_than', value: 1, label: 'Sales Count Above' }
  ],
  'user-activity': [
    { field: 'timestamp', operator: 'between', value: '', label: 'Time Range' },
    { field: 'action', operator: 'equals', value: '', label: 'Specific Action' }
  ],
  system: [
    { field: 'timestamp', operator: 'between', value: '', label: 'Time Range' },
    { field: 'status', operator: 'equals', value: 'error', label: 'Error Status Only' },
    { field: 'cpuUsage', operator: 'greater_than', value: 80, label: 'High CPU Usage' }
  ]
};

export function FilterBuilder({ fields, onAddFilter, category }: FilterBuilderProps) {
  const [selectedField, setSelectedField] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  const field = fields.find(f => f.name === selectedField);
  const availableOperators = field ? OPERATOR_OPTIONS[field.type] || [] : [];
  const presetFilters = PRESET_FILTERS[category] || [];

  const handleAddFilter = () => {
    if (!selectedField || !selectedOperator) return;

    const filter: ReportFilter = {
      field: selectedField,
      operator: selectedOperator as any,
      value: parseFilterValue(filterValue, field?.type),
      label: customLabel || `${field?.label} ${selectedOperator} ${filterValue}`
    };

    onAddFilter(filter);
    
    // Reset form
    setSelectedField('');
    setSelectedOperator('');
    setFilterValue('');
    setCustomLabel('');
  };

  const handleAddPresetFilter = (preset: ReportFilter) => {
    onAddFilter({
      ...preset,
      value: preset.value || ''
    });
  };

  const parseFilterValue = (value: string, type?: string) => {
    if (!type) return value;
    
    switch (type) {
      case 'number':
      case 'currency':
        return parseFloat(value) || 0;
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'date':
        return value; // Keep as string for date inputs
      default:
        return value;
    }
  };

  const getInputType = (fieldType?: string) => {
    switch (fieldType) {
      case 'number':
      case 'currency':
        return 'number';
      case 'date':
        return 'date';
      case 'boolean':
        return 'select';
      default:
        return 'text';
    }
  };

  return (
    <div className="space-y-4">
      {/* Preset Filters */}
      {presetFilters.length > 0 && (
        <div className="space-y-2">
          <Label>Quick Filters</Label>
          <div className="flex flex-wrap gap-2">
            {presetFilters.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleAddPresetFilter(preset)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Filter Builder */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Field</Label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.name} value={field.name}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Operator</Label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger>
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {availableOperators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            {getInputType(field?.type) === 'select' ? (
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={getInputType(field?.type)}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Enter value"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Custom Label (optional)</Label>
          <Input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Enter filter description"
          />
        </div>

        <Button
          onClick={handleAddFilter}
          disabled={!selectedField || !selectedOperator || !filterValue}
          size="sm"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      </div>
    </div>
  );
}