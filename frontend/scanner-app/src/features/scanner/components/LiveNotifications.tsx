import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Info, CheckCircle, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../../shared/components/button';
import { Badge } from '../../shared/components/badge';
import { cn } from '../../shared/utils/cn';
import { SignalRService } from '../../shared/services/signalr';
import { Product, ScanTransaction, LiveMetrics } from '../../../types/api';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  data?: unknown;
  autoDismiss?: boolean;
  dismissTime?: number;
}

interface LiveNotificationsProps {
  signalRService: SignalRService;
  className?: string;
}

export function LiveNotifications({ signalRService, className }: LiveNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Listen for real-time events
    const handleProductUpdated = (productCode: string, product: Product) => {
      addNotification({
        type: 'info',
        title: 'Product Updated',
        message: `${productCode} - ${product.description}`,
        data: { productCode, product },
        autoDismiss: true,
        dismissTime: 5000,
      });
    };

    const handleScanProcessed = (transaction: ScanTransaction) => {
      addNotification({
        type: 'success',
        title: 'Scan Processed',
        message: `${transaction.productCode} - Qty: ${transaction.quantityScanned}`,
        data: { transaction },
        autoDismiss: true,
        dismissTime: 3000,
      });
    };

    const handleLowStockAlert = (productCode: string, daysRemaining: number) => {
      addNotification({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${productCode} - ${daysRemaining} days remaining`,
        data: { productCode, daysRemaining },
        autoDismiss: false,
      });
    };

    const handleLiveMetrics = (metrics: LiveMetrics) => {
      // Only show metrics notifications for significant events
      if (metrics.totalScansToday > 100) {
        addNotification({
          type: 'info',
          title: 'High Activity',
          message: `${metrics.totalScansToday} scans today`,
          data: { metrics },
          autoDismiss: true,
          dismissTime: 4000,
        });
      }
    };

    // Subscribe to SignalR events
    signalRService.on('ProductUpdated', handleProductUpdated);
    signalRService.on('ScanProcessed', handleScanProcessed);
    signalRService.on('LowStockAlert', handleLowStockAlert);
    signalRService.on('LiveMetrics', handleLiveMetrics);

    return () => {
      signalRService.off('ProductUpdated', handleProductUpdated);
      signalRService.off('ScanProcessed', handleScanProcessed);
      signalRService.off('LowStockAlert', handleLowStockAlert);
      signalRService.off('LiveMetrics', handleLiveMetrics);
    };
  }, [signalRService]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    if (isMuted) {
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10

    // Auto-dismiss if enabled
    if (newNotification.autoDismiss && newNotification.dismissTime) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.dismissTime);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-error" />;
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'error':
        return 'border-error/20 bg-error/5';
      default:
        return 'border-info/20 bg-info/5';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {notifications.length > 9 ? '9+' : notifications.length}
          </Badge>
        )}
      </Button>

      {/* Mute Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMuted(!isMuted)}
        className="ml-2"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 text-center text-muted-foreground"
                  >
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </motion.div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={cn(
                        'p-3 border-b last:border-b-0',
                        getNotificationColor(notification.type)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNotification(notification.id)}
                              className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 