import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, User, Package, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScanTransaction, TransactionType } from '@/types/api';
import { SignalRService } from '@/services/signalr';

interface RecentScansHistoryProps {
  signalRService: SignalRService;
  className?: string;
}

interface ScanHistoryItemProps {
  transaction: ScanTransaction;
  isExpanded: boolean;
  onToggle: () => void;
}

function ScanHistoryItem({ transaction, isExpanded, onToggle }: ScanHistoryItemProps) {
  const getTransactionTypeIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.StockCount:
        return <Package className="h-4 w-4" />;
      case TransactionType.Adjustment:
        return <TrendingUp className="h-4 w-4" />;
      case TransactionType.Receiving:
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.StockCount:
        return 'bg-blue-100 text-blue-800';
      case TransactionType.Adjustment:
        return 'bg-orange-100 text-orange-800';
      case TransactionType.Receiving:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.StockCount:
        return 'Stock Count';
      case TransactionType.Adjustment:
        return 'Adjustment';
      case TransactionType.Receiving:
        return 'Receiving';
      default:
        return 'Unknown';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border rounded-lg p-3 bg-background hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            {getTransactionTypeIcon(transaction.transactionType)}
            <Badge variant="secondary" className={getTransactionTypeColor(transaction.transactionType)}>
              {getTransactionTypeLabel(transaction.transactionType)}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {transaction.productCode}
            </p>
            <p className="text-xs text-muted-foreground">
              Qty: {transaction.quantityScanned}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(transaction.scanDateTime), { addSuffix: true })}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{transaction.scannedBy}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product Code:</span>
                <span className="font-mono">{transaction.productCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity Scanned:</span>
                <span className="font-semibold">{transaction.quantityScanned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scanned By:</span>
                <span>{transaction.scannedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scanned At:</span>
                <span>{new Date(transaction.scanDateTime).toLocaleString()}</span>
              </div>
              {transaction.notes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notes:</span>
                  <span className="text-right">{transaction.notes}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function RecentScansHistory({ signalRService, className }: RecentScansHistoryProps) {
  const [recentScans, setRecentScans] = useState<ScanTransaction[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Listen for new scan transactions
    const handleScanProcessed = (transaction: ScanTransaction) => {
      setRecentScans(prev => [transaction, ...prev.slice(0, 9)]); // Keep last 10
    };

    signalRService.on('ScanProcessed', handleScanProcessed);

    return () => {
      signalRService.off('ScanProcessed', handleScanProcessed);
    };
  }, [signalRService]);

  const toggleExpanded = (transactionId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Recent Scans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <AnimatePresence mode="popLayout">
          {recentScans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent scans</p>
              <p className="text-xs">Scans will appear here in real-time</p>
            </motion.div>
          ) : (
            recentScans.map((transaction) => (
              <ScanHistoryItem
                key={transaction.id}
                transaction={transaction}
                isExpanded={expandedItems.has(transaction.id.toString())}
                onToggle={() => toggleExpanded(transaction.id.toString())}
              />
            ))
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
} 