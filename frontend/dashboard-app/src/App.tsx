import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

import { DashboardLayout } from '@/features/shared/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/features/auth';
import { useAuth } from '@/features/auth';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ActivityPage } from '@/pages/ActivityPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AdvancedAnalyticsPage } from '@/pages/AdvancedAnalyticsPage';
import { UsersPage } from '@/pages/UsersPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AppContent() {
  const { checkAuth, isLoading } = useAuth();

  // Check authentication on app start
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading ServiceBridge Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          
          {/* Implemented routes */}
          <Route path="inventory" element={
            <ProtectedRoute requiredRole="Operator">
              <InventoryPage />
            </ProtectedRoute>
          } />
          
          <Route path="analytics" element={
            <ProtectedRoute requiredRole="Manager">
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          
          <Route path="activity" element={
            <ProtectedRoute requiredRole="Viewer">
              <ActivityPage />
            </ProtectedRoute>
          } />
          
          <Route path="reports" element={
            <ProtectedRoute requiredRole="Manager">
              <ReportsPage />
            </ProtectedRoute>
          } />
          
          <Route path="users" element={
            <ProtectedRoute requiredRole="Admin">
              <UsersPage />
            </ProtectedRoute>
          } />
          
          <Route path="advanced-analytics" element={
            <ProtectedRoute requiredRole="Manager">
              <AdvancedAnalyticsPage />
            </ProtectedRoute>
          } />
          
          <Route path="security" element={
            <ProtectedRoute requiredRole="Admin">
              <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Security Center</h2>
                  <p className="text-muted-foreground mt-2">Coming in Phase 4</p>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="settings" element={
            <ProtectedRoute requiredRole="Manager">
              <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Settings</h2>
                  <p className="text-muted-foreground mt-2">Coming in Phase 4</p>
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
        <Toaster richColors position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;