import { useUser, useHasRole, useHasAnyRole } from '../hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  role?: string;
  roles?: string[];
  fallback?: React.ReactNode;
  inverse?: boolean; // If true, shows children when user DOESN'T have the role
}

export function RoleGuard({ 
  children, 
  role, 
  roles, 
  fallback = null,
  inverse = false 
}: RoleGuardProps) {
  const user = useUser();
  const hasRole = useHasRole(role || '');
  const hasAnyRole = useHasAnyRole(roles || []);

  // If no user, don't show anything
  if (!user) {
    return <>{fallback}</>;
  }

  const hasRequiredPermission = () => {
    if (role) {
      return hasRole;
    }
    if (roles && roles.length > 0) {
      return hasAnyRole;
    }
    return true; // No role specified, allow access
  };

  const shouldShow = inverse ? !hasRequiredPermission() : hasRequiredPermission();

  return shouldShow ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard role="Admin" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ManagerOrAdmin({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard roles={['Manager', 'Admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function OperatorOrAbove({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard roles={['Operator', 'Manager', 'Admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ViewerOrAbove({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard roles={['Viewer', 'Operator', 'Manager', 'Admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}