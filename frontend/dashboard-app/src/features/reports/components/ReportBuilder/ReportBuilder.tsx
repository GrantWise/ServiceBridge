import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Play } from 'lucide-react';
import { FieldSelector } from './FieldSelector';
import { FilterBuilder } from './FilterBuilder';
import { useSaveReportTemplate, useExecuteReport } from '../../hooks/useReports';
import type { ReportTemplate, ReportField, ReportFilter } from '../../types/reports.types';

interface ReportBuilderProps {
  template?: ReportTemplate;
  onSave?: (template: ReportTemplate) => void;
  onExecute?: (templateId: string) => void;
}

export function ReportBuilder({ template, onSave, onExecute }: ReportBuilderProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState<string>(template?.category || 'inventory');
  const [fields, setFields] = useState<ReportField[]>(template?.fields || []);
  const [filters, setFilters] = useState<ReportFilter[]>(template?.filters || []);
  const [groupBy, setGroupBy] = useState<string[]>(template?.groupBy || []);

  const saveTemplate = useSaveReportTemplate();
  const executeReport = useExecuteReport();

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    const templateData = {
      name,
      description,
      category: category as ReportTemplate['category'],
      fields,
      filters,
      groupBy,
      sortBy: [],
      createdBy: 'current-user',
      isPublic: false
    };

    try {
      const saved = await saveTemplate.mutateAsync(templateData);
      onSave?.(saved);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleExecute = async () => {
    if (template?.id) {
      try {
        await executeReport.mutateAsync({ templateId: template.id });
        onExecute?.(template.id);
      } catch (error) {
        console.error('Failed to execute report:', error);
      }
    } else {
      // Save first, then execute
      await handleSave();
    }
  };

  const addField = (field: ReportField) => {
    setFields(prev => [...prev, field]);
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const addFilter = (filter: ReportFilter) => {
    setFilters(prev => [...prev, filter]);
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>
            Configure basic report settings and metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter report name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="user-activity">User Activity</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-description">Description</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this report shows"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Field Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Report Fields</CardTitle>
          <CardDescription>
            Select the data fields to include in your report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldSelector onAddField={addField} category={category as ReportTemplate['category']} />
          
          <div className="space-y-2">
            <Label>Selected Fields</Label>
            <div className="space-y-2">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fields selected</p>
              ) : (
                fields.map((field, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{field.type}</Badge>
                      <div>
                        <div className="font-medium">{field.label}</div>
                        <div className="text-sm text-muted-foreground">{field.name}</div>
                      </div>
                      {field.aggregation && (
                        <Badge variant="secondary">{field.aggregation}</Badge>
                      )}
                      {field.required && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Add filters to limit the data in your report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBuilder 
            fields={fields} 
            onAddFilter={addFilter}
            category={category as ReportTemplate['category']}
          />
          
          <div className="space-y-2">
            <Label>Active Filters</Label>
            <div className="space-y-2">
              {filters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No filters applied</p>
              ) : (
                filters.map((filter, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{filter.operator}</Badge>
                      <div>
                        <div className="font-medium">{filter.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {filter.field} {filter.operator} {String(filter.value)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button 
              onClick={handleSave}
              disabled={!name.trim() || fields.length === 0 || saveTemplate.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleExecute}
              disabled={!name.trim() || fields.length === 0 || executeReport.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Execute Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}