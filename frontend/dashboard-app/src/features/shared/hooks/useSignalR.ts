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
}

export const useSignalRStore = create<SignalRStore>((set) => ({
  connectionState: signalrService.getConnectionState(),
  setConnectionState: (state) => set({ connectionState: state }),
  connectionCount: 0,
  setConnectionCount: (count) => set({ connectionCount: count }),
}));

// Main SignalR hook
export function useSignalR() {
  const queryClient = useQueryClient();
  const { connectionState, setConnectionState, connectionCount, setConnectionCount } = useSignalRStore();
  const connectionStateUnsubscribeRef = useRef<(() => void) | null>(null);

  // Connect to SignalR on mount
  useEffect(() => {
    const connect = async () => {
      try {
        await signalrService.connect();
        
        // Join default groups
        await signalrService.joinGroup('inventory');
        await signalrService.joinGroup('system');
        
        // Get initial connection count
        const count = await signalrService.getConnectionCount();
        setConnectionCount(count);
      } catch (error) {
        console.error('Failed to initialize SignalR:', error);
      }
    };

    connect();

    // Subscribe to connection state changes
    connectionStateUnsubscribeRef.current = signalrService.onConnectionStateChange(setConnectionState);

    // Cleanup on unmount
    return () => {
      connectionStateUnsubscribeRef.current?.();
      signalrService.disconnect();
    };
  }, [setConnectionState, setConnectionCount]);

  // Setup global event handlers
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    // Product update events
    unsubscribers.push(
      signalrService.on('ProductUpdated', (product) => {
        console.log('Product updated via SignalR:', product);
        
        // Invalidate product queries to refresh data
        queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
        
        // Show notification
        toast.info(`Product ${product.productCode} was updated`);
      })
    );

    // Scan processed events
    unsubscribers.push(
      signalrService.on('ScanProcessed', (scanData) => {
        console.log('Scan processed via SignalR:', scanData);
        
        // Invalidate both product and transaction queries
        queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
        queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEYS.all });
        
        // Show notification
        toast.success(`Scan processed for ${scanData.productCode}`);
      })
    );

    // Connection count updates
    unsubscribers.push(
      signalrService.on('ConnectionCountUpdated', (count: number) => {
        setConnectionCount(count);
      })
    );

    // User connection events
    unsubscribers.push(
      signalrService.on('UserConnected', (userId: string) => {
        console.log('User connected:', userId);
      })
    );

    unsubscribers.push(
      signalrService.on('UserDisconnected', (userId: string) => {
        console.log('User disconnected:', userId);
      })
    );

    // Group events
    unsubscribers.push(
      signalrService.on('JoinedGroup', (groupName: string) => {
        console.log('Joined group:', groupName);
      })
    );

    unsubscribers.push(
      signalrService.on('LeftGroup', (groupName: string) => {
        console.log('Left group:', groupName);
      })
    );

    // Cleanup event handlers
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [queryClient, setConnectionCount]);

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