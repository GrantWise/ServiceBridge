import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Scan, 
  Edit, 
  RefreshCw, 
  Filter, 
  Clock,
  User,
  Package,
  Search
} from 'lucide-react';
import { useRecentTransactions } from '@/features/shared/hooks/useTransactions';
import { useSignalREvent } from '@/features/shared/hooks/useSignalR';
import { formatTransactionType, getTransactionTypeColor } from '@/features/shared/hooks/useTransactions';
import { ScanTransaction, TransactionType } from '@/features/shared/types/api.types';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'scan' | 'edit' | 'user_action' | 'system';
  title: string;
  description: string;
  user: string;
  timestamp: Date;
  productCode?: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  maxItems?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
}

export function ActivityFeed({ maxItems = 50, showFilters = true, autoRefresh = true }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Fetch recent transactions
  const { data: transactions, isLoading, refetch } = useRecentTransactions(maxItems);

  // Convert transactions to activity items
  useEffect(() => {
    if (transactions) {
      const activityItems: ActivityItem[] = transactions.map(transaction => ({
        id: transaction.id.toString(),
        type: 'scan',
        title: `${formatTransactionType(transaction.transactionType)} - ${transaction.productCode}`,
        description: `Scanned ${transaction.quantityScanned} units`,
        user: transaction.scannedBy,
        timestamp: new Date(transaction.scanDateTime),
        productCode: transaction.productCode,
        metadata: {
          transactionType: transaction.transactionType,
          quantity: transaction.quantityScanned,
          notes: transaction.notes,
        },
      }));
      
      setActivities(activityItems);
    }
  }, [transactions]);

  // Listen for real-time scan events via SignalR
  useSignalREvent('ScanProcessed', (scanData: any) => {
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      type: 'scan',
      title: `Live Scan - ${scanData.productCode}`,
      description: `Scanned ${scanData.quantityScanned} units`,
      user: scanData.scannedBy || 'Unknown',
      timestamp: new Date(),
      productCode: scanData.productCode,
      metadata: scanData,
    };
    
    setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)]);
  });

  // Listen for product update events
  useSignalREvent('ProductUpdated', (productData: any) => {
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      type: 'edit',
      title: `Product Updated - ${productData.productCode}`,
      description: `Product information modified`,
      user: productData.lastUpdatedBy || 'System',
      timestamp: new Date(),
      productCode: productData.productCode,
      metadata: productData,
    };
    
    setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)]);
  });

  // Listen for user connection events
  useSignalREvent('UserConnected', (userId: string) => {
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      type: 'user_action',
      title: 'User Connected',
      description: `${userId} joined the dashboard`,
      user: userId,
      timestamp: new Date(),
      metadata: { action: 'connect' },
    };
    
    setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)]);
  });

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !filter || 
      activity.title.toLowerCase().includes(filter.toLowerCase()) ||
      activity.description.toLowerCase().includes(filter.toLowerCase()) ||
      activity.user.toLowerCase().includes(filter.toLowerCase()) ||
      activity.productCode?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scan':
        return <Scan className="h-4 w-4" />;
      case 'edit':
        return <Edit className="h-4 w-4" />;
      case 'user_action':
        return <User className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'scan':
        return 'bg-blue-100 text-blue-800';
      case 'edit':
        return 'bg-green-100 text-green-800';
      case 'user_action':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>
              Real-time monitoring of inventory operations and user activity
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="flex items-center gap-2 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="scan">Scans</option>
              <option value="edit">Edits</option>
              <option value="user_action">User Actions</option>
            </select>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
                <div className="h-3 bg-muted animate-pulse rounded w-16" />
              </div>
            ))
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-full',
                  getActivityColor(activity.type)
                )}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {activity.title}
                    </h4>
                    {activity.productCode && (
                      <Badge variant="outline" className="text-xs">
                        {activity.productCode}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{formatTimestamp(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {filter || typeFilter !== 'all' ? 'No activities match your filters' : 'No recent activity'}
            </div>
          )}
        </div>
        
        {filteredActivities.length > 0 && (
          <div className="pt-3 border-t mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {filteredActivities.length} activities</span>
              <span>Updates in real-time via SignalR</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}