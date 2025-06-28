import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';
import { ScannerForm } from './components/scanner/ScannerForm';
import { SignalRService } from './services/signalr';
import { LiveNotifications } from './components/scanner/LiveNotifications';
import { OfflineQueue } from './components/scanner/OfflineQueue';
import { PullToRefresh } from './components/ui/PullToRefresh';
import { ConnectionIndicator } from './components/scanner/ConnectionIndicator';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { Toaster } from 'sonner';
import { env } from './config/env';
import { errorHandler } from './services/error/errorHandler';
import { logger } from './services/error/logger';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { UserRole } from './types/api';

// Create a singleton SignalRService instance
const signalRService = new SignalRService(env.VITE_SIGNALR_URL);

function Header() {
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };
  
  return (
    <header className="w-full flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0 z-10">
      <div className="font-bold text-lg">{env.VITE_APP_TITLE}</div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {user.username} ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
        <LiveNotifications signalRService={signalRService} />
        <ConnectionIndicator signalRService={signalRService} />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full px-4 py-2 border-t bg-background text-xs text-muted-foreground text-center sticky bottom-0">
      <div className="flex flex-col items-center gap-2">
        <span>Recent activity summary (coming soon)</span>
        <OfflineQueue />
      </div>
    </footer>
  );
}

function ScanPage() {
  // SignalR connection is now handled by authService on login/logout
  // No need to duplicate the connection logic here

  // Optionally, add pull-to-refresh for mobile
  const handleRefresh = async () => {
    window.location.reload(); // Or trigger a data refetch
  };
  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
        <div className="w-full space-y-4">
          <h1 className="text-2xl font-semibold mb-4 text-center">Scan Product</h1>
          <ScannerForm signalRService={signalRService} />
        </div>
      </main>
    </PullToRefresh>
  );
}

function App() {
  // Initialize app-wide services
  useEffect(() => {
    logger.info('Scanner App initialized', {
      environment: import.meta.env.MODE,
      apiUrl: env.VITE_API_URL,
      appTitle: env.VITE_APP_TITLE,
    });

    // Set page title
    document.title = env.VITE_APP_TITLE;

    // Cleanup on unmount
    return () => {
      logger.info('Scanner App unmounting');
      signalRService.disconnect();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-background scanner-app">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute
                    requiredRoles={[UserRole.Scanner, UserRole.Manager, UserRole.Admin]}
                  >
                    <>
                      <Header />
                      <ScanPage />
                      <Footer />
                    </>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                },
              }}
            />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
