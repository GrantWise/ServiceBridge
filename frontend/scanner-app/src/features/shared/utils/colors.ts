/**
 * Semantic Color Utilities - Modern 2025 Enterprise Design System
 * Provides consistent color usage across the application
 */

export const semanticColors = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-muted-foreground',
} as const;

export const semanticBorders = {
  success: 'border-success focus-visible:ring-success/20',
  warning: 'border-warning focus-visible:ring-warning/20',
  error: 'border-error focus-visible:ring-error/20',
  info: 'border-info focus-visible:ring-info/20',
  primary: 'border-primary focus-visible:ring-primary/20',
  default: 'border-input focus-visible:ring-ring/50',
} as const;

export const semanticBackgrounds = {
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  error: 'bg-error text-error-foreground',
  info: 'bg-info text-info-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  muted: 'bg-muted text-muted-foreground',
} as const;

export const semanticBadges = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
  info: 'bg-info/10 text-info border-info/20',
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  muted: 'bg-muted/10 text-muted-foreground border-muted/20',
} as const;

export const statusIndicators = {
  online: semanticColors.success,
  connecting: semanticColors.warning,
  offline: semanticColors.error,
  error: semanticColors.error,
  info: semanticColors.info,
} as const;

export const statusBorders = {
  online: semanticBorders.success,
  connecting: semanticBorders.warning,
  offline: semanticBorders.error,
  error: semanticBorders.error,
  valid: semanticBorders.success,
  invalid: semanticBorders.error,
  default: semanticBorders.default,
} as const;

export type SemanticColor = keyof typeof semanticColors;
export type StatusType = keyof typeof statusIndicators;
export type BorderStatus = keyof typeof statusBorders;

/**
 * Get semantic text color class
 */
export function getSemanticColor(type: SemanticColor): string {
  return semanticColors[type];
}

/**
 * Get semantic border classes with focus states
 */
export function getSemanticBorder(status: BorderStatus): string {
  return statusBorders[status];
}

/**
 * Get semantic background classes
 */
export function getSemanticBackground(type: SemanticColor): string {
  return semanticBackgrounds[type];
}

/**
 * Get semantic badge classes
 */
export function getSemanticBadge(type: SemanticColor): string {
  return semanticBadges[type];
}

/**
 * Get status indicator color
 */
export function getStatusColor(status: StatusType): string {
  return statusIndicators[status];
}