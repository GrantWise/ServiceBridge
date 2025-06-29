import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import './App.css';
import { SignalRService, ErrorBoundary, logger } from './features/shared';
import { AuthProvider, useAuth, ProtectedRoute } from './features/auth';
import { Toaster } from 'sonner';
import { env } from './config/env';
import { UserRole } from './types/api';

// Lazy load components for code splitting
const LoginPage = lazy(() => import('./features/auth').then(module => ({ default: module.LoginPage })));
const ScannerForm = lazy(() => import('./features/scanner').then(module => ({ default: module.ScannerForm })));
const LiveNotifications = lazy(() => import('./features/scanner').then(module => ({ default: module.LiveNotifications })));
const OfflineQueue = lazy(() => import('./features/scanner').then(module => ({ default: module.OfflineQueue })));
const PullToRefresh = lazy(() => import('./features/shared').then(module => ({ default: module.PullToRefresh })));
const ConnectionIndicator = lazy(() => import('./features/scanner').then(module => ({ default: module.ConnectionIndicator })));

// Create a singleton SignalRService instance
const signalRService = new SignalRService(env.VITE_SIGNALR_URL);

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

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
        <Suspense fallback={<div className="w-6 h-6 animate-pulse bg-muted rounded" />}>
          <LiveNotifications signalRService={signalRService} />
        </Suspense>
        <Suspense fallback={<div className="w-6 h-6 animate-pulse bg-muted rounded" />}>
          <ConnectionIndicator signalRService={signalRService} />
        </Suspense>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full px-4 py-2 border-t bg-background text-xs text-muted-foreground text-center sticky bottom-0">
      <div className="flex flex-col items-center gap-2">
        <span>Recent activity summary (coming soon)</span>
        <Suspense fallback={<div className="w-full h-4 animate-pulse bg-muted rounded" />}>
          <OfflineQueue />
        </Suspense>
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
    <Suspense fallback={<LoadingFallback />}>
      <PullToRefresh onRefresh={handleRefresh}>
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
          <div className="w-full space-y-4">
            <h1 className="text-2xl font-semibold mb-4 text-center">Scan Product</h1>
            <ScannerForm signalRService={signalRService} />
          </div>
        </main>
      </PullToRefresh>
    </Suspense>
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
