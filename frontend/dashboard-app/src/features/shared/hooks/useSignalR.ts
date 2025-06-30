import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { toast } from 'sonner';
import { signalrService, SignalREventHandler, ConnectionState } from '../services/signalr/signalrService';
import { PRODUCTS_QUERY_KEYS } from './useProducts';
import { TRANSACTIONS_QUERY_KEYS } from './useTransactions';

// SignalR Store for connection state
interface SignalRStore {
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;
  connectionCount: number;
  setConnectionCount: (count: number) => void;
  autoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (enabled: boolean) => void;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (interval: number) => void;
  lastProductUpdate: number;
  setLastProductUpdate: (timestamp: number) => void;
}

export const useSignalRStore = create<SignalRStore>((set) => ({
  connectionState: signalrService.getConnectionState(),
  setConnectionState: (state) => set({ connectionState: state }),
  connectionCount: 0,
  setConnectionCount: (count) => set({ connectionCount: count }),
  autoRefreshEnabled: true,
  setAutoRefreshEnabled: (enabled) => set({ autoRefreshEnabled: enabled }),
  autoRefreshInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
  setAutoRefreshInterval: (interval) => set({ autoRefreshInterval: interval }),
  lastProductUpdate: 0,
  setLastProductUpdate: (timestamp) => set({ lastProductUpdate: timestamp }),
}));

// Main SignalR hook - only provides connection state, doesn't initialize
export function useSignalR() {
  const queryClient = useQueryClient();
  const { 
    connectionState, 
    connectionCount, 
    autoRefreshEnabled, 
    autoRefreshInterval,
    lastProductUpdate,
    setLastProductUpdate 
  } = useSignalRStore();
  const connectionStateUnsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to connection state changes only (no connection initialization)
  useEffect(() => {
    // Subscribe to connection state changes
    connectionStateUnsubscribeRef.current = signalrService.onConnectionStateChange(
      useSignalRStore.getState().setConnectionState
    );

    // Get current connection state
    const currentState = signalrService.getConnectionState();
    useSignalRStore.getState().setConnectionState(currentState);

    // Cleanup on unmount
    return () => {
      connectionStateUnsubscribeRef.current?.();
    };
  }, []); // Empty dependency array - only run once on mount

  // Listen for SignalR events via custom window events (to avoid registration timing issues)
  useEffect(() => {
    const handleProductUpdate = (event: CustomEvent) => {
      const product = event.detail;
      console.log('Product updated via SignalR:', product);
      
      if (!autoRefreshEnabled) {
        console.log('Auto-refresh disabled, skipping query invalidation');
        toast.info(`Product ${product.productCode} was updated (auto-refresh disabled)`);
        return;
      }

      const now = Date.now();
      const timeSinceLastUpdate = now - lastProductUpdate;
      
      if (timeSinceLastUpdate < autoRefreshInterval) {
        console.log(`Throttling product update - ${timeSinceLastUpdate}ms since last update`);
        toast.info(`Product ${product.productCode} was updated (throttled)`);
        return;
      }
      
      // Update timestamp and invalidate queries
      setLastProductUpdate(now);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
      
      // Show notification
      toast.info(`Product ${product.productCode} was updated`);
    };

    const handleScanProcessed = (event: CustomEvent) => {
      const scanData = event.detail;
      console.log('Scan processed via SignalR:', scanData);
      
      if (!autoRefreshEnabled) {
        console.log('Auto-refresh disabled, skipping query invalidation');
        toast.success(`Scan processed for ${scanData.productCode} (auto-refresh disabled)`);
        return;
      }

      const now = Date.now();
      const timeSinceLastUpdate = now - lastProductUpdate;
      
      if (timeSinceLastUpdate < autoRefreshInterval) {
        console.log(`Throttling scan update - ${timeSinceLastUpdate}ms since last update`);
        toast.success(`Scan processed for ${scanData.productCode} (throttled)`);
        return;
      }
      
      // Update timestamp and invalidate queries
      setLastProductUpdate(now);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEYS.all });
      
      // Show notification
      toast.success(`Scan processed for ${scanData.productCode}`);
    };

    // Listen for custom events from SignalR service
    window.addEventListener('signalr:productUpdated', handleProductUpdate as EventListener);
    window.addEventListener('signalr:scanProcessed', handleScanProcessed as EventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('signalr:productUpdated', handleProductUpdate as EventListener);
      window.removeEventListener('signalr:scanProcessed', handleScanProcessed as EventListener);
    };
  }, [queryClient, autoRefreshEnabled, autoRefreshInterval, lastProductUpdate, setLastProductUpdate]);

  const joinGroup = useCallback(async (groupName: string) => {
    try {
      await signalrService.joinGroup(groupName);
    } catch (error) {
      console.error(`Failed to join group ${groupName}:`, error);
      toast.error(`Failed to join group: ${groupName}`);
    }
  }, []);

  const leaveGroup = useCallback(async (groupName: string) => {
    try {
      await signalrService.leaveGroup(groupName);
    } catch (error) {
      console.error(`Failed to leave group ${groupName}:`, error);
    }
  }, []);

  return {
    connectionState,
    connectionCount,
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    autoRefreshEnabled,
    autoRefreshInterval,
    joinGroup,
    leaveGroup,
    invoke: signalrService.invoke.bind(signalrService),
  };
}

// Hook for subscribing to specific SignalR events
export function useSignalREvent<T = any>(
  eventName: string,
  handler: SignalREventHandler<T>,
  dependencies: any[] = []
) {
  useEffect(() => {
    const unsubscribe = signalrService.on(eventName, handler);
    return unsubscribe;
  }, [eventName, ...dependencies]);
}

// Hook for connection status monitoring
export function useConnectionStatus() {
  const { connectionState, connectionCount } = useSignalRStore();

  return {
    connectionState,
    connectionCount,
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    isDisconnected: connectionState.isDisconnected,
    error: connectionState.error,
  };
}

// Hook for sending data to SignalR groups
export function useSignalRSender() {
  const sendToGroup = useCallback(async (groupName: string, eventName: string, data: any) => {
    try {
      await signalrService.invoke('SendToGroup', groupName, eventName, data);
    } catch (error) {
      console.error(`Failed to send to group ${groupName}:`, error);
      throw error;
    }
  }, []);

  const broadcastToAll = useCallback(async (eventName: string, data: any) => {
    try {
      await signalrService.invoke('BroadcastToAll', eventName, data);
    } catch (error) {
      console.error('Failed to broadcast to all:', error);
      throw error;
    }
  }, []);

  return {
    sendToGroup,
    broadcastToAll,
  };
}

// Hook for managing auto-refresh settings
export function useAutoRefreshSettings() {
  const { 
    autoRefreshEnabled, 
    autoRefreshInterval, 
    setAutoRefreshEnabled, 
    setAutoRefreshInterval 
  } = useSignalRStore();

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  }, [autoRefreshEnabled, setAutoRefreshEnabled]);

  const setRefreshInterval = useCallback((minutes: number) => {
    setAutoRefreshInterval(minutes * 60 * 1000); // Convert to milliseconds
  }, [setAutoRefreshInterval]);

  return {
    autoRefreshEnabled,
    autoRefreshInterval: autoRefreshInterval / 60 / 1000, // Return in minutes
    toggleAutoRefresh,
    setRefreshInterval,
  };
}