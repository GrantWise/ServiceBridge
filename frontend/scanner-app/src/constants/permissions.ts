/**
 * Permission constants for the application
 * These should match the permissions defined in the backend
 */

export const Permissions = {
  // Product permissions
  PRODUCT_VIEW: 'product:view',
  PRODUCT_EDIT: 'product:edit',
  PRODUCT_DELETE: 'product:delete',
  
  // Scan permissions
  SCAN_CREATE: 'scan:create',
  SCAN_VIEW: 'scan:view',
  SCAN_EDIT: 'scan:edit',
  SCAN_DELETE: 'scan:delete',
  
  // Transaction permissions
  TRANSACTION_VIEW: 'transaction:view',
  TRANSACTION_EXPORT: 'transaction:export',
  
  // Metrics permissions
  METRICS_VIEW: 'metrics:view',
  
  // Admin permissions
  USER_MANAGE: 'user:manage',
  SYSTEM_CONFIGURE: 'system:configure',
  AUDIT_VIEW: 'audit:view',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

/**
 * Role-based permission mappings
 * Defines which permissions each role has by default
 */
export const RolePermissions: Record<string, Permission[]> = {
  Admin: Object.values(Permissions), // Admin has all permissions
  
  Manager: [
    Permissions.PRODUCT_VIEW,
    Permissions.PRODUCT_EDIT,
    Permissions.SCAN_CREATE,
    Permissions.SCAN_VIEW,
    Permissions.SCAN_EDIT,
    Permissions.TRANSACTION_VIEW,
    Permissions.TRANSACTION_EXPORT,
    Permissions.METRICS_VIEW,
    Permissions.AUDIT_VIEW,
  ],
  
  Scanner: [
    Permissions.PRODUCT_VIEW,
    Permissions.SCAN_CREATE,
    Permissions.SCAN_VIEW,
    Permissions.TRANSACTION_VIEW,
  ],
  
  Viewer: [
    Permissions.PRODUCT_VIEW,
    Permissions.TRANSACTION_VIEW,
    Permissions.METRICS_VIEW,
  ],
};