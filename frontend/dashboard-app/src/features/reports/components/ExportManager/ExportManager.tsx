import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, FileSpreadsheet, FileImage, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useExecuteReport, useReportExecutionStatus, useDownloadReport } from '../../hooks/useReports';
import type { ExportOptions, ReportExecution } from '../../types/reports.types';

interface ExportManagerProps {
  templateId: string;
  templateName: string;
  onExportComplete?: (execution: ReportExecution) => void;
}

export function ExportManager({ templateId, templateName, onExportComplete }: ExportManagerProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeHeaders: true,
    includeFilters: true,
    filename: `${templateName.toLowerCase().replace(/\s+/g, '-')}`
  });
  const [currentExecution, setCurrentExecution] = useState<string | null>(null);

  const executeReport = useExecuteReport();
  const downloadReport = useDownloadReport();
  const executionStatus = useReportExecutionStatus(currentExecution || '', !!currentExecution);

  const handleExport = async () => {
    try {
      const execution = await executeReport.mutateAsync({
        templateId,
        options: exportOptions
      });
      setCurrentExecution(execution.id);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDownload = async () => {
    if (!currentExecution) return;
    
    try {
      await downloadReport.mutateAsync(currentExecution);
      onExportComplete?.(executionStatus.data!);
      setCurrentExecution(null);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'pdf':
        return <FileImage className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
          <CardDescription>
            Configure export settings for "{templateName}"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV (Comma Separated Values)
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel Spreadsheet
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      PDF Document
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File Name</Label>
              <Input
                value={exportOptions.filename}
                onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
                placeholder="Enter filename"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-headers"
                checked={exportOptions.includeHeaders}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeHeaders: !!checked }))
                }
              />
              <Label htmlFor="include-headers">Include column headers</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-filters"
                checked={exportOptions.includeFilters}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeFilters: !!checked }))
                }
              />
              <Label htmlFor="include-filters">Include filter information</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email Delivery (optional)</Label>
            <Input
              type="email"
              value={exportOptions.email || ''}
              onChange={(e) => setExportOptions(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
            />
          </div>

          <Button 
            onClick={handleExport}
            disabled={executeReport.isPending || !!currentExecution}
            className="w-full"
          >
            {getFormatIcon(exportOptions.format)}
            <span className="ml-2">
              {executeReport.isPending ? 'Starting Export...' : 'Export Report'}
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* Export Status */}
      {currentExecution && executionStatus.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(executionStatus.data.status)}
              Export Status
            </CardTitle>
            <CardDescription>
              Execution ID: {currentExecution}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <Badge variant={executionStatus.data.status === 'completed' ? 'default' : 'secondary'}>
                {executionStatus.data.status}
              </Badge>
            </div>

            <Progress value={executionStatus.data.progress} className="w-full" />

            {executionStatus.data.status === 'running' && (
              <p className="text-sm text-muted-foreground">
                Processing report data... {executionStatus.data.progress}% complete
              </p>
            )}

            {executionStatus.data.status === 'completed' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Total rows processed:</span>
                  <span className="font-medium">{executionStatus.data.totalRows?.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Execution time:</span>
                  <span className="font-medium">
                    {Math.round((new Date(executionStatus.data.completedAt!).getTime() - 
                              new Date(executionStatus.data.startedAt).getTime()) / 1000)}s
                  </span>
                </div>

                <Button 
                  onClick={handleDownload}
                  disabled={downloadReport.isPending}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadReport.isPending ? 'Downloading...' : 'Download Report'}
                </Button>
              </div>
            )}

            {executionStatus.data.status === 'failed' && (
              <div className="p-3 bg-destructive/10 rounded-lg">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <XCircle className="h-4 w-4" />
                  Export Failed
                </div>
                <p className="text-sm text-destructive mt-1">
                  {executionStatus.data.errorMessage || 'An unknown error occurred during export.'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentExecution(null)}
                  className="mt-2"
                >
                  Reset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
          <CardDescription>
            Your recently generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock history data - replace with real data */}
            {[
              {
                id: '1',
                filename: 'inventory-summary-2024-06-29.csv',
                format: 'csv',
                status: 'completed',
                createdAt: new Date(Date.now() - 1000 * 60 * 30),
                size: '2.4 MB'
              },
              {
                id: '2',
                filename: 'sales-analytics-2024-06-28.xlsx',
                format: 'excel',
                status: 'completed',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
                size: '1.8 MB'
              }
            ].map((export_) => (
              <div key={export_.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getFormatIcon(export_.format)}
                  <div>
                    <div className="font-medium">{export_.filename}</div>
                    <div className="text-sm text-muted-foreground">
                      {export_.createdAt.toLocaleDateString()} • {export_.size}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{export_.status}</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Empty state */}
            <p className="text-sm text-muted-foreground text-center py-6">
              No export history available
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}