import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productsApi } from '../../shared/services/api';
import {
  getAllScans,
  removeScan,
  addScan,
} from '../components/OfflineQueue';

interface OfflineScan {
  id: string;
  productCode: string;
  quantityScanned: number;
  transactionType: number;
  scannedBy: string;
  notes?: string;
  createdAt: string;
}

/**
 * Custom hook for offline queue management
 * Handles syncing offline scans when connection is restored
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineScan[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Load queue on mount and when online status changes
  useEffect(() => {
    const loadQueue = async () => {
      const scans = await getAllScans();
      setQueue(scans);
    };
    loadQueue();
  }, [isOnline]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing || queue.length === 0) {
      return;
    }

    setIsSyncing(true);
    const failedScans: OfflineScan[] = [];

    for (const scan of queue) {
      try {
        await productsApi.submitScan(scan.productCode, {
          productCode: scan.productCode,
          quantityScanned: scan.quantityScanned,
          transactionType: scan.transactionType,
          scannedBy: scan.scannedBy,
          notes: scan.notes,
        });
        
        await removeScan(scan.id);
      } catch (error) {
        failedScans.push(scan);
        console.error('Failed to sync scan:', error);
      }
    }

    // Reload queue to show remaining items
    const remainingScans = await getAllScans();
    setQueue(remainingScans);

    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });

    if (failedScans.length === 0) {
      toast.success(`Successfully synced ${queue.length} offline scans`);
    } else {
      toast.warning(`Synced ${queue.length - failedScans.length} scans, ${failedScans.length} failed`);
    }

    setIsSyncing(false);
  }, [isOnline, isSyncing, queue, queryClient]);

  const removeFromQueue = useCallback(async (id: string) => {
    await removeScan(id);
    const updatedQueue = await getAllScans();
    setQueue(updatedQueue);
  }, []);

  const addToQueue = useCallback(async (scan: Omit<OfflineScan, 'id'>) => {
    const newScan = {
      ...scan,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    await addScan(newScan);
    const updatedQueue = await getAllScans();
    setQueue(updatedQueue);
  }, []);

  return {
    queue,
    isOnline,
    isSyncing,
    syncQueue,
    removeFromQueue,
    addToQueue,
    queueLength: queue.length,
  };
}