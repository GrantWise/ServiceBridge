import type { ReactNode } from 'react';
import { useAuth } from '../hooks/AuthContext';
import type { UserRole } from '../../../types/api';

interface IRoleGuardProps {
  children: ReactNode;
  roles?: UserRole[];
  permissions?: string[];
  fallback?: ReactNode;
  requireAll?: boolean; // For permissions: true = AND, false = OR
}

/**
 * Component that conditionally renders children based on user roles/permissions
 * Unlike ProtectedRoute, this doesn't redirect - it just hides content
 */
export function RoleGuard({ 
  children, 
  roles, 
  permissions, 
  fallback = null,
  requireAll = true 
}: IRoleGuardProps) {
  const { hasAnyRole, hasPermission } = useAuth();

  // If no requirements specified, render children
  if (!roles && !permissions) {
    return <>{children}</>;
  }

  // Check role requirements
  if (roles && roles.length > 0) {
    const hasRequiredRole = hasAnyRole(roles);
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirements
  if (permissions && permissions.length > 0) {
    const permissionCheck = requireAll
      ? permissions.every(p => hasPermission(p))
      : permissions.some(p => hasPermission(p));
    
    if (!permissionCheck) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Hook for conditional rendering based on roles/permissions
 */
export function useRoleGuard(
  roles?: UserRole[], 
  permissions?: string[], 
  requireAll = true
): boolean {
  const { hasAnyRole, hasPermission } = useAuth();

  if (!roles && !permissions) {
    return true;
  }

  let hasAccess = true;

  if (roles && roles.length > 0) {
    hasAccess = hasAccess && hasAnyRole(roles);
  }

  if (permissions && permissions.length > 0) {
    const permissionCheck = requireAll
      ? permissions.every(p => hasPermission(p))
      : permissions.some(p => hasPermission(p));
    hasAccess = hasAccess && permissionCheck;
  }

  return hasAccess;
}