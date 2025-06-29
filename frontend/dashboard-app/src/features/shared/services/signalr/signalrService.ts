import * as signalR from '@microsoft/signalr';
import { TokenService } from '@/features/auth/services/tokenService';

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
    const hubUrl = import.meta.env.VITE_SIGNALR_URL || 'https://localhost:7001/inventoryhub';
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          const token = TokenService.getToken();
          if (!token || TokenService.isTokenExpired(token)) {
            throw new Error('No valid token available');
          }
          return token;
        },
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
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
      
      if (error) {
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

    // Handle authentication errors
    this.connection.onclose((error) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('401')) {
        console.error('SignalR authentication failed:', error);
        TokenService.clearAll();
        window.location.href = '/login';
      }
    });
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

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
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
      connectionId: this.connection?.connectionId,
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
    return this.connection?.connectionId;
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