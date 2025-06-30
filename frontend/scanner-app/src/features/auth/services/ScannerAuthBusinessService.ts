/**
 * Scanner Authentication Business Service - Scanner-specific implementation
 * Duplicated from dashboard but optimized for mobile/scanner use cases
 * Follows SRP by handling only scanner authentication business logic
 */

import { SCANNER_AUTH_CONSTANTS } from '../constants/auth.constants';

interface ScannerLoginCredentials {
  email: string;
  password: string;
  deviceId?: string; // For device-specific authentication
}

interface ScannerLoginResponse {
  success: boolean;
  message: string;
  user?: any;
  permissions?: string[];
  expiresAt?: string;
}

interface OfflineScan {
  id: string;
  productCode: string;
  quantity: number;
  timestamp: Date;
  userId: string;
}

class ScannerAuthBusinessService {
  private isOnline: boolean = navigator.onLine;
  private offlineQueue: OfflineScan[] = [];

  constructor() {
    this.initializeNetworkMonitoring();
    this.loadOfflineQueue();
  }

  /**
   * Authenticate scanner user with mobile-optimized flow
   */
  async login(credentials: ScannerLoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      // Add device identifier for scanner tracking
      const loginData = {
        ...credentials,
        deviceId: this.getDeviceId(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        credentials: 'include',
        signal: AbortSignal.timeout(SCANNER_AUTH_CONSTANTS.CONNECTION.API_TIMEOUT),
      });

      const data: ScannerLoginResponse = await response.json();

      if (response.ok && data.success && data.user) {
        // Store scanner-specific data
        this.storeScannerSession(data);
        
        // Sync any offline scans if we have them
        if (this.offlineQueue.length > 0) {
          this.syncOfflineScans();
        }
        
        return { success: true };
      } else {
        const errorMessage = data.message || SCANNER_AUTH_CONSTANTS.ERROR_MESSAGES.INVALID_CREDENTIALS;
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      // Handle offline mode gracefully
      if (!this.isOnline) {
        return { success: false, error: SCANNER_AUTH_CONSTANTS.ERROR_MESSAGES.NETWORK_ERROR };
      }
      
      const errorMessage = error instanceof Error ? error.message : SCANNER_AUTH_CONSTANTS.ERROR_MESSAGES.NETWORK_ERROR;
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logout with scanner-specific cleanup
   */
  async logout(): Promise<void> {
    try {
      // Attempt server logout if online
      if (this.isOnline) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          credentials: 'include',
          signal: AbortSignal.timeout(5000), // Quick timeout for logout
        });
      }
    } catch (error) {
      console.warn('Server logout failed, continuing with local cleanup:', error);
    }

    // Clear scanner-specific storage
    this.clearScannerSession();
    
    // Clear offline queue if user logs out
    this.clearOfflineQueue();
  }

  /**
   * Validate scanner permissions for specific operations
   */
  async validateScanPermission(operation: string): Promise<boolean> {
    const userData = this.getScannerSession();
    if (!userData || !userData.permissions) return false;

    // Check scanner-specific permissions
    switch (operation) {
      case 'scan':
        return userData.permissions.includes(SCANNER_AUTH_CONSTANTS.PERMISSIONS.SCAN_PRODUCTS);
      case 'batch':
        return userData.permissions.includes(SCANNER_AUTH_CONSTANTS.PERMISSIONS.SCAN_BATCH);
      case 'history':
        return userData.permissions.includes(SCANNER_AUTH_CONSTANTS.PERMISSIONS.VIEW_HISTORY);
      default:
        return false;
    }
  }

  /**
   * Queue scan for offline processing
   */
  queueOfflineScan(scan: Omit<OfflineScan, 'id' | 'timestamp'>): void {
    const offlineScan: OfflineScan = {
      ...scan,
      id: this.generateScanId(),
      timestamp: new Date(),
    };

    this.offlineQueue.push(offlineScan);
    
    // Limit queue size for mobile storage
    if (this.offlineQueue.length > SCANNER_AUTH_CONSTANTS.SCANNER.MAX_OFFLINE_SCANS) {
      this.offlineQueue.shift(); // Remove oldest scan
    }
    
    this.saveOfflineQueue();
  }

  /**
   * Sync offline scans when back online
   */
  private async syncOfflineScans(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    try {
      const batchSize = SCANNER_AUTH_CONSTANTS.SCANNER.SYNC_BATCH_SIZE;
      const batches = this.chunkArray(this.offlineQueue, batchSize);

      for (const batch of batches) {
        await this.syncScanBatch(batch);
      }

      // Clear queue after successful sync
      this.clearOfflineQueue();
    } catch (error) {
      console.error('Failed to sync offline scans:', error);
    }
  }

  /**
   * Sync a batch of scans
   */
  private async syncScanBatch(scans: OfflineScan[]): Promise<void> {
    const response = await fetch('/api/v1/scans/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scans }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Batch sync failed: ${response.statusText}`);
    }
  }

  /**
   * Initialize network connectivity monitoring
   */
  private initializeNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineScans();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Periodic connectivity check
    setInterval(() => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;
      
      if (!wasOnline && this.isOnline) {
        this.syncOfflineScans();
      }
    }, SCANNER_AUTH_CONSTANTS.CONNECTION.OFFLINE_CHECK_INTERVAL);
  }

  /**
   * Get or generate device identifier
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('scanner_device_id');
    if (!deviceId) {
      deviceId = `scanner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('scanner_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Store scanner session data
   */
  private storeScannerSession(data: ScannerLoginResponse): void {
    sessionStorage.setItem(SCANNER_AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
    if (data.permissions) {
      sessionStorage.setItem('scanner_permissions', JSON.stringify(data.permissions));
    }
    sessionStorage.setItem(SCANNER_AUTH_CONSTANTS.STORAGE_KEYS.LAST_SCAN_TIME, new Date().toISOString());
  }

  /**
   * Get scanner session data
   */
  private getScannerSession(): any {
    try {
      const userData = sessionStorage.getItem(SCANNER_AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA);
      const permissions = sessionStorage.getItem('scanner_permissions');
      
      return {
        user: userData ? JSON.parse(userData) : null,
        permissions: permissions ? JSON.parse(permissions) : [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Clear scanner session data
   */
  private clearScannerSession(): void {
    Object.values(SCANNER_AUTH_CONSTANTS.STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
    sessionStorage.removeItem('scanner_permissions');
  }

  /**
   * Load offline queue from storage
   */
  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem(SCANNER_AUTH_CONSTANTS.STORAGE_KEYS.OFFLINE_QUEUE);
      this.offlineQueue = stored ? JSON.parse(stored) : [];
    } catch {
      this.offlineQueue = [];
    }
  }

  /**
   * Save offline queue to storage
   */
  private saveOfflineQueue(): void {
    localStorage.setItem(
      SCANNER_AUTH_CONSTANTS.STORAGE_KEYS.OFFLINE_QUEUE, 
      JSON.stringify(this.offlineQueue)
    );
  }

  /**
   * Clear offline queue
   */
  private clearOfflineQueue(): void {
    this.offlineQueue = [];
    localStorage.removeItem(SCANNER_AUTH_CONSTANTS.STORAGE_KEYS.OFFLINE_QUEUE);
  }

  /**
   * Generate unique scan ID
   */
  private generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility to chunk array into batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus() {
    return {
      count: this.offlineQueue.length,
      isOnline: this.isOnline,
      needsSync: this.offlineQueue.length > 0 && this.isOnline,
    };
  }
}

// Create singleton instance for scanner app
export const scannerAuthBusinessService = new ScannerAuthBusinessService();
export default scannerAuthBusinessService;