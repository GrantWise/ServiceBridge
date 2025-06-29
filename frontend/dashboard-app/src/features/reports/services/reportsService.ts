import { apiClient } from '@/features/shared/services/api/apiClient';
import type { 
  ReportTemplate, 
  ReportExecution, 
  ExportOptions, 
  ReportData 
} from '../types/reports.types';

class ReportsService {
  // Template Management
  async getTemplates(): Promise<ReportTemplate[]> {
    try {
      const response = await apiClient.get('/api/v1/reports/templates');
      return response.data;
    } catch (error) {
      // Mock data for demo - replace when backend is available
      return this.getMockTemplates();
    }
  }

  async getTemplate(id: string): Promise<ReportTemplate> {
    try {
      const response = await apiClient.get(`/api/v1/reports/templates/${id}`);
      return response.data;
    } catch (error) {
      const templates = this.getMockTemplates();
      const template = templates.find(t => t.id === id);
      if (!template) throw new Error('Template not found');
      return template;
    }
  }

  async saveTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    try {
      const response = await apiClient.post('/api/v1/reports/templates', template);
      return response.data;
    } catch (error) {
      // Mock save for demo
      return {
        ...template,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as ReportTemplate;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/reports/templates/${id}`);
    } catch (error) {
      // Mock delete for demo
      console.log(`Template ${id} deleted`);
    }
  }

  // Report Execution
  async executeReport(templateId: string, options?: Partial<ExportOptions>): Promise<ReportExecution> {
    try {
      const response = await apiClient.post(`/api/v1/reports/execute/${templateId}`, options);
      return response.data;
    } catch (error) {
      // Mock execution for demo
      return {
        id: crypto.randomUUID(),
        templateId,
        status: 'running',
        progress: 0,
        startedAt: new Date(),
        executedBy: 'current-user'
      };
    }
  }

  async getExecutionStatus(executionId: string): Promise<ReportExecution> {
    try {
      const response = await apiClient.get(`/api/v1/reports/executions/${executionId}`);
      return response.data;
    } catch (error) {
      // Mock status for demo
      return {
        id: executionId,
        templateId: 'template-1',
        status: 'completed',
        progress: 100,
        startedAt: new Date(Date.now() - 5000),
        completedAt: new Date(),
        downloadUrl: '/api/v1/reports/download/' + executionId,
        totalRows: 1247,
        executedBy: 'current-user'
      };
    }
  }

  async downloadReport(executionId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`/api/v1/reports/download/${executionId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      // Mock CSV data for demo
      const csvData = this.generateMockCSV();
      return new Blob([csvData], { type: 'text/csv' });
    }
  }

  // Data Export
  async exportData(data: ReportData, options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'csv':
        return this.exportToCSV(data, options);
      case 'excel':
        return this.exportToExcel(data, options);
      case 'pdf':
        return this.exportToPDF(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private exportToCSV(data: ReportData, options: ExportOptions): Blob {
    let csv = '';
    
    if (options.includeHeaders) {
      csv += data.headers.join(',') + '\n';
    }
    
    data.rows.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  private async exportToExcel(data: ReportData, options: ExportOptions): Promise<Blob> {
    // For demo purposes, return CSV with Excel MIME type
    // In production, use a library like xlsx
    const csv = this.exportToCSV(data, options);
    return new Blob([await csv.text()], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }

  private exportToPDF(data: ReportData, options: ExportOptions): Blob {
    // For demo purposes, return a simple text representation
    // In production, use a library like jsPDF or PDFKit
    let content = 'Report Generated\n\n';
    
    if (options.includeHeaders) {
      content += data.headers.join(' | ') + '\n';
      content += '-'.repeat(data.headers.join(' | ').length) + '\n';
    }
    
    data.rows.slice(0, 50).forEach(row => { // Limit rows for demo
      content += row.join(' | ') + '\n';
    });
    
    return new Blob([content], { type: 'application/pdf' });
  }

  // Mock Data for Demo
  private getMockTemplates(): ReportTemplate[] {
    return [
      {
        id: 'inventory-summary',
        name: 'Inventory Summary Report',
        description: 'Complete overview of current inventory levels and stock status',
        category: 'inventory',
        fields: [
          { id: 'code', name: 'code', label: 'Product Code', type: 'string', required: true },
          { id: 'name', name: 'name', label: 'Product Name', type: 'string', required: true },
          { id: 'quantity', name: 'quantity', label: 'Current Stock', type: 'number', required: true },
          { id: 'value', name: 'value', label: 'Total Value', type: 'currency', required: false, aggregation: 'sum' }
        ],
        filters: [
          { field: 'category', operator: 'equals', value: '', label: 'Product Category' },
          { field: 'quantity', operator: 'less_than', value: 10, label: 'Low Stock Threshold' }
        ],
        groupBy: ['category'],
        sortBy: [{ field: 'quantity', direction: 'asc' }],
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-25'),
        createdBy: 'admin',
        isPublic: true
      },
      {
        id: 'sales-analytics',
        name: 'Sales Analytics Report',
        description: 'Detailed analysis of sales performance and trends',
        category: 'analytics',
        fields: [
          { id: 'date', name: 'date', label: 'Sale Date', type: 'date', required: true },
          { id: 'product', name: 'product', label: 'Product', type: 'string', required: true },
          { id: 'quantity', name: 'quantity', label: 'Quantity Sold', type: 'number', required: true, aggregation: 'sum' },
          { id: 'revenue', name: 'revenue', label: 'Revenue', type: 'currency', required: true, aggregation: 'sum' }
        ],
        filters: [
          { field: 'date', operator: 'between', value: '', label: 'Date Range' },
          { field: 'revenue', operator: 'greater_than', value: 0, label: 'Minimum Revenue' }
        ],
        groupBy: ['date'],
        sortBy: [{ field: 'date', direction: 'desc' }],
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-28'),
        createdBy: 'manager',
        isPublic: false
      }
    ];
  }

  private generateMockCSV(): string {
    const headers = ['Product Code', 'Product Name', 'Current Stock', 'Total Value'];
    const rows = [
      ['P001', 'Laptop Computer', '25', '$24,999.75'],
      ['P002', 'Wireless Mouse', '150', '$3,747.00'],
      ['P003', 'USB Cable', '89', '$445.50'],
      ['P004', 'Monitor Stand', '34', '$1,190.00']
    ];
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    return csv;
  }
}

export const reportsService = new ReportsService();