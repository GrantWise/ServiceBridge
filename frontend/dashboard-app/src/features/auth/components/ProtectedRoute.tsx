import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredRoles,
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, checkAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (user && (requiredRole || requiredRoles)) {
    const hasRequiredRole = () => {
      if (requiredRole) {
        return hasRole(user.role, requiredRole);
      }
      if (requiredRoles) {
        return requiredRoles.some(role => hasRole(user.role, role));
      }
      return true;
    };

    if (!hasRequiredRole()) {
      return (
        <div className="flex h-screen flex-col items-center justify-center space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Required role: {requiredRole || requiredRoles?.join(', ')}
            </p>
            <p className="text-sm text-muted-foreground">
              Your role: {user.role}
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:underline"
          >
            Go Back
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Helper function to check role hierarchy
function hasRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'Viewer': 1,
    'Operator': 2,
    'Manager': 3,
    'Admin': 4
  };

  const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userRoleLevel >= requiredRoleLevel;
}