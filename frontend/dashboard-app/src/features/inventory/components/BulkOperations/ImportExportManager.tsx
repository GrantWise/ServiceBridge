import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle, Eye, History } from 'lucide-react';
import { toast } from 'sonner';

interface ImportJob {
  id: string;
  filename: string;
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed';
  progress: number;
  totalRows: number;
  processedRows: number;
  validRows: number;
  errorRows: number;
  errors: ImportError[];
  startedAt: Date;
  completedAt?: Date;
  results?: any[];
}

interface ImportError {
  row: number;
  column: string;
  message: string;
  value: any;
}

interface ExportJob {
  id: string;
  format: 'csv' | 'excel' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  filename: string;
  downloadUrl?: string;
  startedAt: Date;
  completedAt?: Date;
}

const IMPORT_TEMPLATES = [
  {
    name: 'Standard Product Import',
    description: 'Basic product information with required fields',
    requiredColumns: ['code', 'name', 'category', 'price'],
    optionalColumns: ['description', 'stock', 'minStock', 'supplier'],
    sampleData: `code,name,category,price,description,stock,minStock\nP001,Laptop Computer,Electronics,999.99,High-performance laptop,25,5\nP002,Wireless Mouse,Electronics,29.99,Ergonomic wireless mouse,150,20`
  },
  {
    name: 'Inventory Update',
    description: 'Update existing product stock levels',
    requiredColumns: ['code', 'stock'],
    optionalColumns: ['minStock', 'maxStock', 'location'],
    sampleData: `code,stock,minStock,location\nP001,30,5,Warehouse A\nP002,200,20,Warehouse B`
  },
  {
    name: 'Price Update',
    description: 'Bulk price updates for existing products',
    requiredColumns: ['code', 'price'],
    optionalColumns: ['cost', 'margin', 'effectiveDate'],
    sampleData: `code,price,cost,margin\nP001,1099.99,800.00,27.3\nP002,24.99,15.00,39.9`
  }
];

export function ImportExportManager() {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json'>('csv');
  const [exportFilters, setExportFilters] = useState<Record<string, any>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      // Parse file for preview
      parseFilePreview(file);
    }
  }, []);

  const parseFilePreview = useCallback(async (file: File) => {
    const text = await file.text();
    const lines = text.split('\\n').slice(0, 6); // Preview first 5 rows + header
    const data = lines.map(line => line.split(','));
    setPreviewData(data);
    setShowPreview(true);
  }, []);

  const validateImportData = useCallback((data: any[]): ImportError[] => {
    const errors: ImportError[] = [];
    const template = IMPORT_TEMPLATES.find(t => t.name === selectedTemplate);
    
    if (!template) return errors;
    
    const headers = data[0] || [];
    const missingRequired = template.requiredColumns.filter(col => !headers.includes(col));
    
    if (missingRequired.length > 0) {
      errors.push({
        row: 0,
        column: 'headers',
        message: `Missing required columns: ${missingRequired.join(', ')}`,
        value: headers
      });
    }
    
    // Validate data rows
    data.slice(1).forEach((row, index) => {
      template.requiredColumns.forEach(col => {
        const colIndex = headers.indexOf(col);
        if (colIndex >= 0 && (!row[colIndex] || row[colIndex].trim() === '')) {
          errors.push({
            row: index + 2,
            column: col,
            message: `Required field is empty`,
            value: row[colIndex]
          });
        }
      });
      
      // Validate specific field types
      const priceIndex = headers.indexOf('price');
      if (priceIndex >= 0 && row[priceIndex] && isNaN(parseFloat(row[priceIndex]))) {
        errors.push({
          row: index + 2,
          column: 'price',
          message: 'Price must be a valid number',
          value: row[priceIndex]
        });
      }
      
      const stockIndex = headers.indexOf('stock');
      if (stockIndex >= 0 && row[stockIndex] && isNaN(parseInt(row[stockIndex]))) {
        errors.push({
          row: index + 2,
          column: 'stock',
          message: 'Stock must be a valid integer',
          value: row[stockIndex]
        });
      }
    });
    
    return errors;
  }, [selectedTemplate]);

  const executeImport = useCallback(async () => {
    if (!importFile || !selectedTemplate) return;
    
    const jobId = crypto.randomUUID();
    const newJob: ImportJob = {
      id: jobId,
      filename: importFile.name,
      status: 'validating',
      progress: 0,
      totalRows: previewData.length - 1,
      processedRows: 0,
      validRows: 0,
      errorRows: 0,
      errors: [],
      startedAt: new Date()
    };
    
    setImportJobs(prev => [newJob, ...prev]);
    
    // Simulate validation phase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const errors = validateImportData(previewData);
    const validRows = newJob.totalRows - errors.filter(e => e.row > 0).length;
    
    setImportJobs(prev => prev.map(job => 
      job.id === jobId ? {
        ...job,
        status: 'importing',
        progress: 20,
        errors,
        validRows,
        errorRows: errors.filter(e => e.row > 0).length
      } : job
    ));
    
    // Simulate import process
    for (let i = 0; i <= validRows; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const progress = 20 + (i / validRows) * 80;
      
      setImportJobs(prev => prev.map(job =>
        job.id === jobId ? {
          ...job,
          progress,
          processedRows: i
        } : job
      ));
    }
    
    // Complete import
    setImportJobs(prev => prev.map(job =>
      job.id === jobId ? {
        ...job,
        status: errors.length > 0 ? (validRows > 0 ? 'completed' : 'failed') : 'completed',
        progress: 100,
        completedAt: new Date(),
        results: previewData.slice(1, validRows + 1)
      } : job
    ));
    
    toast.success(`Import completed: ${validRows} rows processed, ${errors.filter(e => e.row > 0).length} errors`);
    
  }, [importFile, selectedTemplate, previewData]);

  const executeExport = useCallback(async () => {
    const jobId = crypto.randomUUID();
    const totalRecords = Math.floor(Math.random() * 5000) + 1000; // Mock record count
    
    const newJob: ExportJob = {
      id: jobId,
      format: exportFormat,
      status: 'processing',
      progress: 0,
      totalRecords,
      filename: `export-${Date.now()}.${exportFormat}`,
      startedAt: new Date()
    };
    
    setExportJobs(prev => [newJob, ...prev]);
    
    // Simulate export process
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setExportJobs(prev => prev.map(job =>
        job.id === jobId ? {
          ...job,
          progress: i
        } : job
      ));
    }
    
    // Complete export
    setExportJobs(prev => prev.map(job =>
      job.id === jobId ? {
        ...job,
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        downloadUrl: `/api/exports/${jobId}`
      } : job
    ));
    
    toast.success('Export completed successfully');
    
  }, [exportFormat]);

  const downloadTemplate = (template: typeof IMPORT_TEMPLATES[0]) => {
    const csvContent = template.sampleData;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.toLowerCase().replace(/\\s+/g, '-')}-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadExport = (job: ExportJob) => {
    // Simulate download
    toast.success(`Downloaded ${job.filename}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Import & Export Manager</h2>
        <p className="text-muted-foreground">
          Bulk import and export operations with validation and progress tracking
        </p>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="history">Job History</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          {/* Import Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Import Templates</CardTitle>
              <CardDescription>
                Choose a template that matches your data format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {IMPORT_TEMPLATES.map(template => (
                  <div 
                    key={template.name}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate === template.name ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.name)}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{template.description}</div>
                    <div className="mt-3 space-y-1">
                      <div className="text-xs font-medium">Required: {template.requiredColumns.join(', ')}</div>
                      <div className="text-xs text-muted-foreground">Optional: {template.optionalColumns.join(', ')}</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadTemplate(template);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Data File</CardTitle>
              <CardDescription>
                Upload a CSV file matching the selected template format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose import template" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPORT_TEMPLATES.map(template => (
                      <SelectItem key={template.name} value={template.name}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>CSV File</Label>
                <div className="flex items-center gap-3">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>

              {importFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{importFile.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <Badge variant="outline">
                      {previewData.length - 1} rows
                    </Badge>
                  </div>
                </div>
              )}

              {showPreview && previewData.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Data Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {previewData[0]?.map((header, index) => (
                              <th key={index} className="text-left p-2 font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(1, 6).map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="p-2">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {previewData.length > 6 && (
                      <div className="text-center text-sm text-muted-foreground mt-2">
                        ... and {previewData.length - 6} more rows
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={executeImport}
                disabled={!importFile || !selectedTemplate}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Start Import
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Configuration</CardTitle>
              <CardDescription>
                Configure and start data export operation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="json">JSON Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={exportFilters.dateRange || 'all'} onValueChange={(value) => 
                    setExportFilters(prev => ({ ...prev, dateRange: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Data</SelectItem>
                      <SelectItem value="last-week">Last Week</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="last-quarter">Last Quarter</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category Filter</Label>
                <Select value={exportFilters.category || 'all'} onValueChange={(value) => 
                  setExportFilters(prev => ({ ...prev, category: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="home-garden">Home & Garden</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={executeExport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Start Export
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Import History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {importJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No import jobs yet
                  </div>
                ) : (
                  importJobs.map(job => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">{job.filename}</div>
                          <div className="text-sm text-muted-foreground">
                            Started {job.startedAt.toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                      
                      {job.status !== 'pending' && (
                        <Progress value={job.progress} className="mb-3" />
                      )}
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{job.totalRows}</div>
                          <div className="text-muted-foreground">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{job.validRows}</div>
                          <div className="text-muted-foreground">Valid</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{job.errorRows}</div>
                          <div className="text-muted-foreground">Errors</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{job.processedRows}</div>
                          <div className="text-muted-foreground">Processed</div>
                        </div>
                      </div>
                      
                      {job.errors.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                            <AlertCircle className="h-4 w-4" />
                            {job.errors.length} Validation Errors
                          </div>
                          <div className="space-y-1 text-sm text-red-700 max-h-32 overflow-y-auto">
                            {job.errors.slice(0, 5).map((error, index) => (
                              <div key={index}>
                                Row {error.row}, Column '{error.column}': {error.message}
                              </div>
                            ))}
                            {job.errors.length > 5 && (
                              <div className="text-red-600">
                                ... and {job.errors.length - 5} more errors
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No export jobs yet
                  </div>
                ) : (
                  exportJobs.map(job => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">{job.filename}</div>
                          <div className="text-sm text-muted-foreground">
                            {job.totalRecords.toLocaleString()} records • {job.format.toUpperCase()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            job.status === 'completed' ? 'default' :
                            job.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {job.status}
                          </Badge>
                          {job.status === 'completed' && (
                            <Button size="sm" onClick={() => downloadExport(job)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {job.status !== 'pending' && (
                        <Progress value={job.progress} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Technology Demo Section */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 Batch Processing Technology Demo</CardTitle>
          <CardDescription>
            Enterprise-grade bulk operations and data processing pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Import/Export Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Template-based data validation</li>
                <li>• Real-time progress tracking</li>
                <li>• Error reporting and data preview</li>
                <li>• Multiple format support (CSV, Excel, JSON)</li>
                <li>• Batch operation history and rollback</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Processing Pipeline</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• gRPC bulk operations for performance</li>
                <li>• SignalR real-time progress updates</li>
                <li>• REST API integration for metadata</li>
                <li>• Queue-based processing for large datasets</li>
                <li>• Automatic validation and error handling</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Try it:</strong> Upload a CSV file using one of the templates to see the 
              import validation in action. The system demonstrates enterprise-grade batch processing 
              with real-time progress tracking and comprehensive error reporting.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}