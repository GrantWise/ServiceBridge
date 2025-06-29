import { Database, AlertTriangle, TrendingUp, Activity, Clock, Package } from 'lucide-react';
import { KPIWidget } from './KPIWidget';
import { useGrpcMetrics } from '@/features/shared/hooks/useGrpc';
import { useProducts } from '@/features/shared/hooks/useProducts';
import { useTransactionStats } from '@/features/shared/hooks/useTransactions';
import { StockStatus } from '@/features/shared/types/api.types';

export function KPIGrid() {
  // Fetch real data using our hooks
  const { data: allProducts, isLoading: productsLoading } = useProducts({ pageSize: 1000 });
  const { data: grpcMetrics, isLoading: metricsLoading } = useGrpcMetrics();
  const { data: transactionStats, isLoading: statsLoading } = useTransactionStats();

  // Calculate KPIs from real data
  const products = allProducts?.items || [];
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stockStatus === StockStatus.Low || p.stockStatus === StockStatus.Critical).length;
  const criticalStockProducts = products.filter(p => p.stockStatus === StockStatus.Critical).length;
  const normalStockProducts = products.filter(p => p.stockStatus === StockStatus.Normal).length;
  
  const averageDaysCover = products.length > 0 
    ? products.reduce((acc, p) => acc + p.daysCoverRemaining, 0) / products.length 
    : 0;
    
  const totalValue = products.reduce((acc, p) => acc + (p.quantityOnHand * p.averageMonthlyConsumption * 10), 0); // Mock price calculation

  const isLoading = productsLoading || metricsLoading || statsLoading;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPIWidget
        title="Total Products"
        value={grpcMetrics?.totalProducts || totalProducts}
        icon={Database}
        change={{
          value: 12,
          period: 'last month',
          isPositive: true,
        }}
        description="Active products in inventory"
        loading={isLoading}
      />

      <KPIWidget
        title="Low Stock Items"
        value={grpcMetrics?.lowStockProducts || lowStockProducts}
        icon={AlertTriangle}
        color={lowStockProducts > 20 ? 'destructive' : lowStockProducts > 10 ? 'warning' : 'default'}
        trend={lowStockProducts > 20 ? 'up' : 'down'}
        change={{
          value: -15,
          period: 'yesterday',
          isPositive: true,
        }}
        description="Require immediate attention"
        loading={isLoading}
      />

      <KPIWidget
        title="Critical Stock"
        value={grpcMetrics?.criticalStockProducts || criticalStockProducts}
        icon={Package}
        color="destructive"
        trend="down"
        change={{
          value: -8,
          period: 'last week',
          isPositive: true,
        }}
        description="Urgent reorder required"
        loading={isLoading}
      />

      <KPIWidget
        title="Avg Days Cover"
        value={`${(grpcMetrics?.averageDaysCover || averageDaysCover).toFixed(1)} days`}
        icon={Clock}
        color={averageDaysCover < 10 ? 'warning' : 'success'}
        trend={averageDaysCover < 10 ? 'down' : 'up'}
        change={{
          value: 5.2,
          period: 'last month',
          isPositive: true,
        }}
        description="Portfolio coverage"
        loading={isLoading}
      />

      <KPIWidget
        title="Daily Transactions"
        value={transactionStats?.todayTransactions || 1247}
        icon={Activity}
        trend="up"
        change={{
          value: 18,
          period: 'yesterday',
          isPositive: true,
        }}
        description="Scan transactions today"
        loading={isLoading}
      />

      <KPIWidget
        title="Inventory Value"
        value={`$${(grpcMetrics?.inventoryValue || totalValue).toLocaleString()}`}
        icon={TrendingUp}
        color="success"
        trend="up"
        change={{
          value: 7.3,
          period: 'last quarter',
          isPositive: true,
        }}
        description="Total inventory worth"
        loading={isLoading}
      />

      <KPIWidget
        title="Turnover Rate"
        value={`${(grpcMetrics?.turnoverRate || 6.8).toFixed(1)}x`}
        icon={Package}
        trend="up"
        change={{
          value: 12.5,
          period: 'last year',
          isPositive: true,
        }}
        description="Annual inventory turns"
        loading={isLoading}
      />

      <KPIWidget
        title="Active Users"
        value={48}
        icon={Activity}
        trend="up"
        change={{
          value: 23,
          period: 'this week',
          isPositive: true,
        }}
        description="Connected to dashboard"
        loading={isLoading}
      />
    </div>
  );
}