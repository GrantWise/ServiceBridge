import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import type { ReportField, ReportTemplate } from '../../types/reports.types';

interface FieldSelectorProps {
  onAddField: (field: ReportField) => void;
  category: ReportTemplate['category'];
}

const AVAILABLE_FIELDS = {
  inventory: [
    { name: 'code', label: 'Product Code', type: 'string' as const },
    { name: 'name', label: 'Product Name', type: 'string' as const },
    { name: 'category', label: 'Category', type: 'string' as const },
    { name: 'quantity', label: 'Current Stock', type: 'number' as const },
    { name: 'minStock', label: 'Minimum Stock', type: 'number' as const },
    { name: 'value', label: 'Unit Value', type: 'currency' as const },
    { name: 'totalValue', label: 'Total Value', type: 'currency' as const },
    { name: 'lastUpdated', label: 'Last Updated', type: 'date' as const },
    { name: 'isActive', label: 'Active Status', type: 'boolean' as const }
  ],
  analytics: [
    { name: 'date', label: 'Date', type: 'date' as const },
    { name: 'productCode', label: 'Product Code', type: 'string' as const },
    { name: 'productName', label: 'Product Name', type: 'string' as const },
    { name: 'salesCount', label: 'Sales Count', type: 'number' as const },
    { name: 'revenue', label: 'Revenue', type: 'currency' as const },
    { name: 'profit', label: 'Profit', type: 'currency' as const },
    { name: 'growthRate', label: 'Growth Rate', type: 'number' as const }
  ],
  'user-activity': [
    { name: 'userId', label: 'User ID', type: 'string' as const },
    { name: 'userName', label: 'User Name', type: 'string' as const },
    { name: 'action', label: 'Action', type: 'string' as const },
    { name: 'timestamp', label: 'Timestamp', type: 'date' as const },
    { name: 'sessionDuration', label: 'Session Duration', type: 'number' as const },
    { name: 'ipAddress', label: 'IP Address', type: 'string' as const }
  ],
  system: [
    { name: 'timestamp', label: 'Timestamp', type: 'date' as const },
    { name: 'component', label: 'System Component', type: 'string' as const },
    { name: 'status', label: 'Status', type: 'string' as const },
    { name: 'cpuUsage', label: 'CPU Usage', type: 'number' as const },
    { name: 'memoryUsage', label: 'Memory Usage', type: 'number' as const },
    { name: 'errorCount', label: 'Error Count', type: 'number' as const }
  ]
};

const AGGREGATION_OPTIONS = {
  number: ['sum', 'avg', 'min', 'max', 'count'],
  currency: ['sum', 'avg', 'min', 'max', 'count'],
  string: ['count'],
  date: ['count'],
  boolean: ['count']
};

export function FieldSelector({ onAddField, category }: FieldSelectorProps) {
  const [selectedFieldName, setSelectedFieldName] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [aggregation, setAggregation] = useState('');
  const [format, setFormat] = useState('');

  const availableFields = AVAILABLE_FIELDS[category] || [];
  const selectedField = availableFields.find(f => f.name === selectedFieldName);
  const availableAggregations = selectedField ? AGGREGATION_OPTIONS[selectedField.type] : [];

  const handleAddField = () => {
    if (!selectedField) return;

    const field: ReportField = {
      id: crypto.randomUUID(),
      name: selectedField.name,
      label: customLabel || selectedField.label,
      type: selectedField.type,
      required: isRequired,
      ...(aggregation && { aggregation: aggregation as any }),
      ...(format && { format })
    };

    onAddField(field);
    
    // Reset form
    setSelectedFieldName('');
    setCustomLabel('');
    setIsRequired(false);
    setAggregation('');
    setFormat('');
  };

  return (
    <div className=\"space-y-4 p-4 border rounded-lg bg-muted/50\">
      <div className=\"grid gap-4 md:grid-cols-2\">
        <div className=\"space-y-2\">
          <Label>Field</Label>
          <Select value={selectedFieldName} onValueChange={setSelectedFieldName}>
            <SelectTrigger>
              <SelectValue placeholder=\"Select a field\" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.name} value={field.name}>
                  {field.label} ({field.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className=\"space-y-2\">
          <Label>Custom Label (optional)</Label>
          <Input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder={selectedField?.label || 'Enter custom label'}
          />
        </div>
      </div>

      {selectedField && availableAggregations.length > 0 && (
        <div className=\"grid gap-4 md:grid-cols-2\">
          <div className=\"space-y-2\">
            <Label>Aggregation (optional)</Label>
            <Select value={aggregation} onValueChange={setAggregation}>
              <SelectTrigger>
                <SelectValue placeholder=\"Select aggregation\" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=\"\">None</SelectItem>
                {availableAggregations.map((agg) => (
                  <SelectItem key={agg} value={agg}>
                    {agg.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className=\"space-y-2\">
            <Label>Format (optional)</Label>
            <Input
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder={selectedField.type === 'currency' ? '$#,##0.00' : '#,##0'}
            />
          </div>
        </div>
      )}

      <div className=\"flex items-center space-x-2\">
        <Checkbox
          id=\"required\"
          checked={isRequired}
          onCheckedChange={(checked) => setIsRequired(!!checked)}
        />
        <Label htmlFor=\"required\">Required field</Label>
      </div>

      <Button
        onClick={handleAddField}
        disabled={!selectedField}
        size=\"sm\"
        className=\"w-full\"
      >
        <Plus className=\"h-4 w-4 mr-2\" />
        Add Field
      </Button>
    </div>
  );
}