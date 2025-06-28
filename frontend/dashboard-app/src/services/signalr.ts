import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import { Product, ScanTransaction, LiveMetrics } from '@/types/api';

/**
 * SignalR Event Types
 * Following Interface Segregation Principle
 */
export interface SignalREvents {
  ProductUpdated: (productCode: string, product: Product) => void;
  ScanProcessed: (transaction: ScanTransaction) => void;
  LiveMetrics: (metrics: LiveMetrics) => void;
  LowStockAlert: (productCode: string, daysRemaining: number) => void;
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
  private eventListeners: Map<string, Set<Function>> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds

  constructor(private hubUrl: string) {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    this.connection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        withCredentials: false,
        headers: this.getAuthHeaders(),
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

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

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
  }

  async connect(): Promise<void> {
    if (!this.connection || this.connection.state === HubConnectionState.Connected) {
      return;
    }

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
      throw error;
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
}

// Service instance
const signalRUrl = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5196/inventoryhub';
export const signalRService = new SignalRService(signalRUrl);