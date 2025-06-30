import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import { Product, ScanTransaction, LiveMetrics } from '../../../types/api';

/**
 * SignalR Event Types
 * Following Interface Segregation Principle
 */
export interface SignalREvents {
  ProductUpdated: (productCode: string, product: Product) => void;
  ScanProcessed: (transaction: ScanTransaction) => void;
  LiveMetrics: (metrics: LiveMetrics) => void;
  LowStockAlert: (productCode: string, daysRemaining: number) => void;
  UserConnected: (userId: string) => void;
  UserDisconnected: (userId: string) => void;
  ConnectionCountUpdated: (count: number) => void;
  JoinedGroup: (groupName: string) => void;
  LeftGroup: (groupName: string) => void;
}

/**
 * SignalR Connection State
 */
export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionId?: string;
  error?: string;
  liveMetrics?: LiveMetrics;
  connectionCount?: number;
}

/**
 * SignalR Service Class
 * Following Single Responsibility Principle - handles only SignalR communication
 * Following Open/Closed Principle - extensible for new event types
 */
export class SignalRService {
  private connection: HubConnection | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
  };
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds

  constructor(private hubUrl: string) {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    this.connection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        withCredentials: true, // Use httpOnly cookies for authentication
        // No accessTokenFactory needed with cookie-based auth
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
            return this.reconnectInterval * Math.pow(2, retryContext.previousRetryCount);
          }
          return null; // Stop retrying
        },
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private async getAccessToken(): Promise<string> {
    try {
      // Get token from sessionStorage directly to avoid circular dependencies
      // Use the same key as authService
      const sessionData = window.sessionStorage.getItem('auth_session');
      if (sessionData) {
        const authData = JSON.parse(sessionData);
        const token = authData.tokens?.accessToken;
        
        if (token) {
          return token;
        }
      }
      
      console.warn('No auth token available for SignalR connection');
      return '';
    } catch (error) {
      console.error('Failed to get auth token for SignalR:', error);
      return '';
    }
  }

  private isAuthenticated(): boolean {
    try {
      const sessionData = window.sessionStorage.getItem('auth_session');
      if (sessionData) {
        const authData = JSON.parse(sessionData);
        // With httpOnly cookies, just check if user is authenticated and has a valid user object
        return authData.isAuthenticated === true && authData.user;
      }
      return false;
    } catch (_error) {
      console.error('Failed to check authentication status:', _error);
      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) {
      return;
    }

    // Connection state handlers
    this.connection.onclose(error => {
      this.connectionState = {
        isConnected: false,
        isConnecting: false,
        error: error?.message,
      };
      this.notifyStateChange();
    });

    this.connection.onreconnecting(error => {
      this.connectionState = {
        isConnected: false,
        isConnecting: true,
        error: error?.message,
      };
      this.notifyStateChange();
    });

    this.connection.onreconnected(connectionId => {
      this.connectionState = {
        isConnected: true,
        isConnecting: false,
        connectionId,
      };
      this.notifyStateChange();
    });

    // Business event handlers
    this.connection.on('ProductUpdated', (productCode: string, product: Product) => {
      this.emit('ProductUpdated', productCode, product);
    });

    this.connection.on('ScanProcessed', (transaction: ScanTransaction) => {
      this.emit('ScanProcessed', transaction);
    });

    this.connection.on('LiveMetrics', (metrics: LiveMetrics) => {
      this.connectionState.liveMetrics = metrics;
      this.emit('LiveMetrics', metrics);
    });

    this.connection.on('LowStockAlert', (productCode: string, daysRemaining: number) => {
      this.emit('LowStockAlert', productCode, daysRemaining);
    });

    // Connection management handlers
    this.connection.on('UserConnected', (userId: string) => {
      this.emit('UserConnected', userId);
    });

    this.connection.on('UserDisconnected', (userId: string) => {
      this.emit('UserDisconnected', userId);
    });

    this.connection.on('ConnectionCountUpdated', (count: number) => {
      this.connectionState.connectionCount = count;
      this.emit('ConnectionCountUpdated', count);
    });

    this.connection.on('JoinedGroup', (groupName: string) => {
      this.emit('JoinedGroup', groupName);
    });

    this.connection.on('LeftGroup', (groupName: string) => {
      this.emit('LeftGroup', groupName);
    });
  }

  async connect(): Promise<void> {
    if (!this.connection) {
      return;
    }

    // Don't try to connect if already connected or connecting
    if (this.connection.state === HubConnectionState.Connected || 
        this.connection.state === HubConnectionState.Connecting ||
        this.connectionState.isConnecting) {
      return;
    }

    // Check if user is authenticated first
    if (!this.isAuthenticated()) {
      console.warn('User not authenticated, skipping SignalR connection');
      return;
    }

    // With httpOnly cookies, no need to wait for access tokens
    // Authentication is handled automatically by the browser

    try {
      this.connectionState = {
        isConnected: false,
        isConnecting: true,
      };
      this.notifyStateChange();

      await this.connection.start();
      
      this.connectionState = {
        isConnected: true,
        isConnecting: false,
        connectionId: this.connection.connectionId || undefined,
      };
      this.notifyStateChange();
    } catch (error) {
      this.connectionState = {
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
      this.notifyStateChange();
      // Don't throw the error, just log it
      console.warn('SignalR connection failed:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
    }
  }

  // Event subscription methods following Observer pattern
  on<K extends keyof SignalREvents>(event: K, callback: SignalREvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  off<K extends keyof SignalREvents>(event: K, callback: SignalREvents[K]): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in SignalR event handler for ${event}:`, error);
        }
      });
    }
  }

  // State change notification
  onStateChange(callback: (state: ConnectionState) => void): void {
    this.on('StateChange' as any, callback);
  }

  private notifyStateChange(): void {
    this.emit('StateChange', this.connectionState);
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  // Hub method invocation
  async invoke(methodName: string, ...args: any[]): Promise<any> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error('SignalR connection is not established');
    }
    return this.connection.invoke(methodName, ...args);
  }

  async reconnect(): Promise<void> {
    // Disconnect first if connected
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      await this.disconnect();
    }
    
    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Attempt to connect again
    await this.connect();
  }

  // Call this method when user logs in
  async onUserLogin(): Promise<void> {
    console.log('User logged in, attempting SignalR connection');
    await this.connect();
  }

  // Call this method when user logs out
  async onUserLogout(): Promise<void> {
    console.log('User logged out, disconnecting SignalR');
    await this.disconnect();
  }
}

// Service instance
const signalRUrl = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5196/inventoryhub';
export const signalRService = new SignalRService(signalRUrl);