/**
 * Scanner App Authentication Constants - Duplicated from dashboard with scanner-specific optimizations
 * Optimized for mobile/scanner use cases while following same DRY principles
 */

export const SCANNER_AUTH_CONSTANTS = {
  // Token Management (shorter timeouts for mobile security)
  TOKEN_REFRESH_THRESHOLD: 3 * 60 * 1000, // 3 minutes (shorter for mobile)
  TOKEN_EXPIRY_CHECK_INTERVAL: 60 * 1000, // 1 minute (more frequent checks)
  
  // Storage Keys (scanner-specific)
  STORAGE_KEYS: {
    USER_DATA: 'scanner_user',
    AUTH_STATE: 'scanner_auth_state',
    OFFLINE_QUEUE: 'scanner_offline_queue',
    LAST_SCAN_TIME: 'scanner_last_scan',
    SESSION_TIMEOUT: 'scanner_session_timeout',
  } as const,
  
  // Cookie Names (same as dashboard for backend compatibility)
  COOKIE_NAMES: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
  } as const,
  
  // Scanner-specific Authentication Events
  EVENTS: {
    LOGIN_SUCCESS: 'scanner:auth:login:success',
    LOGIN_FAILURE: 'scanner:auth:login:failure',
    LOGOUT: 'scanner:auth:logout',
    SESSION_TIMEOUT: 'scanner:auth:session:timeout',
    OFFLINE_MODE: 'scanner:auth:offline',
    ONLINE_MODE: 'scanner:auth:online',
    SCAN_AUTHORIZED: 'scanner:auth:scan:authorized',
    PERMISSION_DENIED: 'scanner:auth:permission:denied',
  } as const,
  
  // HTTP Status Codes
  HTTP_STATUS: {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    TOO_MANY_REQUESTS: 429,
  } as const,
  
  // Scanner-specific Error Messages
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Invalid scanner credentials',
    SESSION_EXPIRED: 'Scanner session expired. Please log in again.',
    NETWORK_ERROR: 'Network error. Operating in offline mode.',
    UNAUTHORIZED: 'Scanner not authorized for this operation.',
    SCAN_PERMISSION_DENIED: 'Insufficient permissions for scanning operation.',
    OFFLINE_SYNC_FAILED: 'Failed to sync offline scans.',
  } as const,
  
  // Mobile-optimized Retry Configuration
  RETRY: {
    MAX_ATTEMPTS: 2, // Fewer retries for mobile
    BASE_DELAY: 500, // Faster initial retry
    MAX_DELAY: 3000, // Shorter max delay
  } as const,
  
  // Mobile Connection Configuration
  CONNECTION: {
    SIGNALR_RECONNECT_ATTEMPTS: 3, // Fewer attempts on mobile
    SIGNALR_RECONNECT_DELAY: 1000, // Faster reconnection
    API_TIMEOUT: 15000, // Shorter timeout for mobile
    OFFLINE_CHECK_INTERVAL: 5000, // Check connectivity every 5 seconds
  } as const,
  
  // Scanner-specific Session Management
  SESSION: {
    IDLE_TIMEOUT: 15 * 60 * 1000, // 15 minutes idle timeout
    WARNING_THRESHOLD: 2 * 60 * 1000, // Warn 2 minutes before timeout
    AUTO_LOGOUT_DELAY: 30 * 1000, // Auto logout after 30 seconds warning
  } as const,
  
  // Scanner Operations
  SCANNER: {
    MAX_OFFLINE_SCANS: 100, // Maximum offline scans to queue
    SYNC_BATCH_SIZE: 10, // Sync scans in batches of 10
    SCAN_VALIDATION_TIMEOUT: 2000, // 2 seconds to validate scan
  } as const,
  
  // Scanner-specific Authentication Protocols
  PROTOCOLS: {
    REST: 'rest',
    SIGNALR: 'signalr',
    OFFLINE: 'offline',
  } as const,
  
  // Scanner Authentication States
  AUTH_STATES: {
    AUTHENTICATED: 'authenticated',
    UNAUTHENTICATED: 'unauthenticated',
    PENDING: 'pending',
    EXPIRED: 'expired',
    OFFLINE: 'offline',
    SYNCING: 'syncing',
  } as const,
  
  // Scanner Permissions (scanner-specific)
  PERMISSIONS: {
    SCAN_PRODUCTS: 'scan:products',
    SCAN_INVENTORY: 'scan:inventory',
    SCAN_BATCH: 'scan:batch',
    VIEW_HISTORY: 'scan:history',
    SYNC_OFFLINE: 'scan:sync',
  } as const,
} as const;

/**
 * Type definitions for scanner authentication
 */
export type ScannerAuthenticationProtocol = typeof SCANNER_AUTH_CONSTANTS.PROTOCOLS[keyof typeof SCANNER_AUTH_CONSTANTS.PROTOCOLS];
export type ScannerAuthenticationState = typeof SCANNER_AUTH_CONSTANTS.AUTH_STATES[keyof typeof SCANNER_AUTH_CONSTANTS.AUTH_STATES];
export type ScannerAuthenticationEvent = typeof SCANNER_AUTH_CONSTANTS.EVENTS[keyof typeof SCANNER_AUTH_CONSTANTS.EVENTS];
export type ScannerPermission = typeof SCANNER_AUTH_CONSTANTS.PERMISSIONS[keyof typeof SCANNER_AUTH_CONSTANTS.PERMISSIONS];