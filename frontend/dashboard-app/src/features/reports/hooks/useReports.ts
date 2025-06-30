import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsService } from '../services/reportsService';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import type { ReportTemplate, ReportExecution, ExportOptions } from '../types/reports.types';
import { toast } from 'sonner';

// Templates
export function useReportTemplates() {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: ['report-templates'],
    queryFn: () => reportsService.getTemplates(),
    enabled: authInitialized && isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useReportTemplate(id: string) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: ['report-template', id],
    queryFn: () => reportsService.getTemplate(id),
    enabled: authInitialized && isAuthenticated && !!id,
  });
}

export function useSaveReportTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) =>
      reportsService.saveTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success('Report template saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save report template');
      console.error('Save template error:', error);
    },
  });
}

export function useDeleteReportTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => reportsService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success('Report template deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete report template');
      console.error('Delete template error:', error);
    },
  });
}

// Report Execution
export function useExecuteReport() {
  return useMutation({
    mutationFn: ({ templateId, options }: { templateId: string; options?: Partial<ExportOptions> }) =>
      reportsService.executeReport(templateId, options),
    onSuccess: () => {
      toast.success('Report execution started');
    },
    onError: (error) => {
      toast.error('Failed to execute report');
      console.error('Execute report error:', error);
    },
  });
}

export function useReportExecutionStatus(executionId: string, enabled: boolean = true) {
  const authInitialized = useAuthStore(state => state.authInitialized);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: ['report-execution', executionId],
    queryFn: () => reportsService.getExecutionStatus(executionId),
    enabled: authInitialized && isAuthenticated && enabled && !!executionId,
    refetchInterval: (data) => {
      // Refetch every 2 seconds if still running
      return data?.status === 'running' || data?.status === 'pending' ? 2000 : false;
    },
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: (executionId: string) => reportsService.downloadReport(executionId),
    onSuccess: (blob, executionId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${executionId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to download report');
      console.error('Download report error:', error);
    },
  });
}