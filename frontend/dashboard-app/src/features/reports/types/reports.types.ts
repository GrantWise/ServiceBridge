export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'inventory' | 'analytics' | 'user-activity' | 'system';
  fields: ReportField[];
  filters: ReportFilter[];
  groupBy?: string[];
  sortBy?: ReportSort[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
}

export interface ReportField {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  required: boolean;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  format?: string;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
}

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportExecution {
  id: string;
  templateId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  downloadUrl?: string;
  totalRows?: number;
  executedBy: string;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeHeaders: boolean;
  includeFilters: boolean;
  filename?: string;
  email?: string;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
}

export interface ReportData {
  headers: string[];
  rows: any[][];
  totalCount: number;
  executionTime: number;
  generatedAt: Date;
}