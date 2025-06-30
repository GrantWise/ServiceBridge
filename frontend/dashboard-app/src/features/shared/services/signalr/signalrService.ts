import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/features/auth/hooks/useAuth';

export interface SignalREventHandler<T = any> {
  (data: T): void;
}

export interface ConnectionState {
  state: signalR.HubConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  connectionId?: string;
  error?: string;
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private connectionListeners: Array<(state: ConnectionState) => void> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000; // 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.setupConnection();
  }

  private setupConnection() {
    const hubUrl = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5196/inventoryhub';
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true, // Use httpOnly cookies for auth
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Check if user is still authenticated
          const authState = useAuthStore.getState();
          if (!authState.isAuthenticated) {
            return null; // Stop reconnecting if not authenticated
          }
          
          // Exponential backoff with jitter
          const delay = Math.min(
            this.baseReconnectDelay * Math.pow(2, retryContext.previousRetryCount),
            30000 // Max 30 seconds
          );
          const jitter = Math.random() * 1000; // Add up to 1 second of jitter
          return delay + jitter;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    this.connection.onclose((error) => {
      console.warn('SignalR connection closed:', error);
      this.notifyConnectionChange();
      
      // Check if it's an auth error
      if (error && error.message?.includes('401')) {
        // Emit unauthorized event for auth system to handle
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      } else if (error) {
        this.scheduleReconnect();
      }
    });

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
      this.notifyConnectionChange();
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.reconnectAttempts = 0;
      this.notifyConnectionChange();
      
      // Rejoin groups after reconnection
      this.rejoinGroups();
    });

    // Register business event handlers
    this.setupBusinessEventHandlers();
  }

  private setupBusinessEventHandlers() {
    if (!this.connection) return;

    // Connection count updates
    this.connection.on('connectioncountupdated', (count: number) => {
      console.log('Connection count updated:', count);
      // Update the store directly using dynamic import
      import('@/features/shared/hooks/useSignalR')
        .then(({ useSignalRStore }) => {
          useSignalRStore.getState().setConnectionCount(count);
        })
        .catch((error) => {
          console.warn('Could not update connection count in store:', error);
        });
    });

    // User connection events
    this.connection.on('userconnected', (userId: string) => {
      console.log('User connected:', userId);
    });

    this.connection.on('userdisconnected', (userId: string) => {
      console.log('User disconnected:', userId);
    });

    // Group events
    this.connection.on('joinedgroup', (groupName: string) => {
      console.log('Joined group:', groupName);
    });

    this.connection.on('leftgroup', (groupName: string) => {
      console.log('Left group:', groupName);
    });

    // Product/Inventory events - these handle the business logic
    this.connection.on('ProductUpdated', (product: any) => {
      console.log('Product updated via SignalR:', product);
      this.notifyProductUpdate(product);
    });

    this.connection.on('ScanProcessed', (scanData: any) => {
      console.log('Scan processed via SignalR:', scanData);
      this.notifyScanProcessed(scanData);
    });
  }

  private notifyProductUpdate(product: any) {
    // Emit custom event that can be listened to by React components
    window.dispatchEvent(new CustomEvent('signalr:productUpdated', { detail: product }));
  }

  private notifyScanProcessed(scanData: any) {
    // Emit custom event that can be listened to by React components  
    window.dispatchEvent(new CustomEvent('signalr:scanProcessed', { detail: scanData }));
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private async rejoinGroups() {
    // Rejoin any groups that were previously joined
    // This could be stored in local storage or component state
    try {
      await this.joinGroup('inventory');
      await this.joinGroup('system');
    } catch (error) {
      console.error('Failed to rejoin groups:', error);
    }
  }

  async connect(): Promise<void> {
    if (!this.connection) {
      this.setupConnection();
    }

    // Don't try to connect if already connected or connecting
    if (this.connection?.state === signalR.HubConnectionState.Connected ||
        this.connection?.state === signalR.HubConnectionState.Connecting) {
      return;
    }

    try {
      await this.connection?.start();
      console.log('SignalR connected successfully');
      this.reconnectAttempts = 0;
      this.notifyConnectionChange();
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      this.notifyConnectionChange(error as Error);
      this.scheduleReconnect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      await this.connection?.stop();
      console.log('SignalR disconnected');
    } catch (error) {
      console.error('Error disconnecting from SignalR:', error);
    }
    
    this.notifyConnectionChange();
  }

  // Group management
  async joinGroup(groupName: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('JoinGroup', groupName);
      console.log(`Joined SignalR group: ${groupName}`);
    } catch (error) {
      console.error(`Failed to join group ${groupName}:`, error);
      throw error;
    }
  }

  async leaveGroup(groupName: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      return; // Already disconnected
    }

    try {
      await this.connection.invoke('LeaveGroup', groupName);
      console.log(`Left SignalR group: ${groupName}`);
    } catch (error) {
      console.error(`Failed to leave group ${groupName}:`, error);
    }
  }

  // Event subscription
  on<T = any>(eventName: string, handler: SignalREventHandler<T>): () => void {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }

    this.connection.on(eventName, handler);
    
    // Return unsubscribe function
    return () => {
      this.connection?.off(eventName, handler);
    };
  }

  off(eventName: string, handler?: SignalREventHandler): void {
    if (handler) {
      this.connection?.off(eventName, handler);
    } else {
      this.connection?.off(eventName);
    }
  }

  // Invoke server methods
  async invoke<T = any>(methodName: string, ...args: any[]): Promise<T> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      return await this.connection.invoke(methodName, ...args);
    } catch (error) {
      console.error(`Failed to invoke ${methodName}:`, error);
      throw error;
    }
  }

  // Connection state management
  getConnectionState(): ConnectionState {
    const state = this.connection?.state || signalR.HubConnectionState.Disconnected;
    
    return {
      state,
      isConnected: state === signalR.HubConnectionState.Connected,
      isConnecting: state === signalR.HubConnectionState.Connecting,
      isDisconnected: state === signalR.HubConnectionState.Disconnected,
      connectionId: this.connection?.connectionId || undefined,
    };
  }

  onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
    this.connectionListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  private notifyConnectionChange(error?: Error) {
    const state = this.getConnectionState();
    if (error) {
      state.error = error.message;
    }
    
    this.connectionListeners.forEach(listener => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in connection state listener:', err);
      }
    });
  }

  // Utility methods
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  getConnectionId(): string | undefined {
    return this.connection?.connectionId || undefined;
  }

  async getConnectionCount(): Promise<number> {
    try {
      return await this.invoke<number>('GetConnectionCount');
    } catch (error) {
      console.error('Failed to get connection count:', error);
      return 0;
    }
  }
}

// Create singleton instance
export const signalrService = new SignalRService();
export default signalrService;