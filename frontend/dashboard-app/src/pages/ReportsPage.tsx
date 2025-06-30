import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Edit, Trash2, Calendar, Users } from 'lucide-react';
import { ReportBuilder } from '@/features/reports/components/ReportBuilder/ReportBuilder';
import { ExportManager } from '@/features/reports/components/ExportManager/ExportManager';
import { useReportTemplates, useDeleteReportTemplate } from '@/features/reports/hooks/useReports';
import type { ReportTemplate } from '@/features/reports/types/reports.types';

export function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [exportingTemplate, setExportingTemplate] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useReportTemplates();
  const deleteTemplate = useDeleteReportTemplate();

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsBuilding(true);
  };

  const handleEditTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setIsBuilding(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate.mutateAsync(templateId);
    }
  };

  const handleExportTemplate = (templateId: string) => {
    setExportingTemplate(templateId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'inventory':
        return '📦';
      case 'analytics':
        return '📊';
      case 'user-activity':
        return '👥';
      case 'system':
        return '⚙️';
      default:
        return '📄';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'inventory':
        return 'bg-blue-100 text-blue-800';
      case 'analytics':
        return 'bg-green-100 text-green-800';
      case 'user-activity':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isBuilding) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedTemplate ? 'Edit Report Template' : 'Create New Report'}
            </h1>
            <p className="text-muted-foreground">
              {selectedTemplate ? 'Modify existing report configuration' : 'Build a custom report template'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsBuilding(false)}>
            Back to Reports
          </Button>
        </div>
        
        <ReportBuilder 
          template={selectedTemplate || undefined}
          onSave={(template) => {
            setIsBuilding(false);
            setSelectedTemplate(null);
          }}
          onExecute={(templateId) => {
            setIsBuilding(false);
            setExportingTemplate(templateId);
          }}
        />
      </div>
    );
  }

  if (exportingTemplate) {
    const template = templates.find(t => t.id === exportingTemplate);
    if (!template) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Export Report</h1>
            <p className="text-muted-foreground">
              Generate and download report: {template.name}
            </p>
          </div>
          <Button variant="outline" onClick={() => setExportingTemplate(null)}>
            Back to Reports
          </Button>
        </div>
        
        <ExportManager
          templateId={exportingTemplate}
          templateName={template.name}
          onExportComplete={() => setExportingTemplate(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Create, manage, and export custom reports from your data
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading templates...</span>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Report Templates</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first report template to get started with custom reporting
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                      {template.isPublic && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="mb-4">
                      {template.description}
                    </CardDescription>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex justify-between">
                        <span>Fields:</span>
                        <span>{template.fields.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Filters:</span>
                        <span>{template.filters.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleExportTemplate(template.id)}
                        className="flex-1"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Automatically generated reports sent via email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scheduled Reports</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Set up automated report generation to receive reports on a regular schedule
                </p>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                Previously generated and downloaded reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Export History</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Export your first report to see the history here
                </p>
                <Button variant="outline" onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Technology Demo Section */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Report Builder Technology Demo</CardTitle>
          <CardDescription>
            Advanced reporting system with multi-protocol data integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Report Generation Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Drag-and-drop report builder interface</li>
                <li>• Dynamic field selection and aggregation</li>
                <li>• Advanced filtering with multiple operators</li>
                <li>• Real-time data export (CSV, Excel, PDF)</li>
                <li>• Template saving and reuse</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Data Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• REST API data fetching for standard reports</li>
                <li>• gRPC bulk operations for large datasets</li>
                <li>• SignalR real-time updates during generation</li>
                <li>• Cross-protocol error handling and fallbacks</li>
                <li>• Optimized data processing pipeline</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Try it:</strong> Create a new report template to see the drag-and-drop builder in action. 
              The system demonstrates how complex business intelligence features can be built using modern 
              web technologies with seamless backend integration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}