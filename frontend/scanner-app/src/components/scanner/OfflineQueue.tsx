import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudOff, CloudUpload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OfflineScan {
  id: string;
  productCode: string;
  quantityScanned: number;
  transactionType: number;
  scannedBy: string;
  notes?: string;
  createdAt: string;
}

const DB_NAME = 'scanner-offline-queue';
const STORE_NAME = 'scans';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllScans(): Promise<OfflineScan[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as OfflineScan[]);
    request.onerror = () => reject(request.error);
  });
}

async function addScan(scan: OfflineScan): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(scan);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function removeScan(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function OfflineQueue({ className }: { className?: string }) {
  const [queue, setQueue] = useState<OfflineScan[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateQueue = async () => {
      setQueue(await getAllScans());
    };
    updateQueue();
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  const handleRemove = async (id: string) => {
    await removeScan(id);
    setQueue(await getAllScans());
  };

  // Optionally, implement auto-sync when online
  // ...

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2 mb-2">
        <CloudOff className="h-5 w-5 text-yellow-500" />
        <span className="font-medium">Offline Queue</span>
        <Badge variant="secondary">{queue.length}</Badge>
        <span className={isOnline ? 'text-green-600' : 'text-yellow-600'}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      <AnimatePresence>
        {queue.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground text-sm py-4 text-center"
          >
            No scans in queue
          </motion.div>
        ) : (
          queue.map((scan) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border rounded-lg p-3 mb-2 bg-background flex items-center justify-between"
            >
              <div>
                <div className="font-mono text-xs">{scan.productCode}</div>
                <div className="text-xs text-muted-foreground">
                  Qty: {scan.quantityScanned} | Type: {scan.transactionType}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(scan.createdAt).toLocaleString()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(scan.id)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

export { addScan, getAllScans, removeScan }; 