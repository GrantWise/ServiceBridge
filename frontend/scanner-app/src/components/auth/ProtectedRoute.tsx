import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserRole } from '@/types/api';

interface IProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  requiredPermissions,
  fallback 
}: IProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyRole, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || <LoadingScreen />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = hasAnyRole(requiredRoles);
    if (!hasRequiredRole) {
      return <AccessDenied type="role" required={requiredRoles} />;
    }
  }

  // Check permission requirements
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    if (!hasAllPermissions) {
      return <AccessDenied type="permission" required={requiredPermissions} />;
    }
  }

  // All checks passed - render children
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-1/2 mx-auto" />
      </div>
    </div>
  );
}

interface IAccessDeniedProps {
  type: 'role' | 'permission';
  required: string[];
}

function AccessDenied({ type, required }: IAccessDeniedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don't have the required {type}s to access this page.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Required {type}s: {required.join(', ')}
        </p>
        <Navigate to="/" replace />
      </div>
    </div>
  );
}