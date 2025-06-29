import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useProducts } from '@/features/shared/hooks/useProducts';
import { StockStatus } from '@/features/shared/types/api.types';
import { getStockStatusLabel, getStockStatusColor } from '@/features/inventory/types/inventory.types';

const COLORS = {
  [StockStatus.Normal]: '#10b981',    // green
  [StockStatus.Low]: '#f59e0b',       // yellow  
  [StockStatus.Critical]: '#ef4444',  // red
  [StockStatus.Overstock]: '#3b82f6', // blue
};

interface StockDistributionProps {
  loading?: boolean;
}

export function StockDistribution({ loading = false }: StockDistributionProps) {
  const { data: productsData, isLoading } = useProducts({ pageSize: 1000 });
  
  const products = productsData?.items || [];
  
  // Calculate distribution
  const distribution = Object.values(StockStatus)
    .filter(status => typeof status === 'number')
    .map(status => {
      const count = products.filter(p => p.stockStatus === status).length;
      const percentage = products.length > 0 ? (count / products.length) * 100 : 0;
      
      return {
        name: getStockStatusLabel(status as StockStatus),
        value: count,
        percentage: percentage.toFixed(1),
        color: COLORS[status as StockStatus],
        status: status as StockStatus,
      };
    })
    .filter(item => item.value > 0); // Only show categories with products

  const isDataLoading = loading || isLoading;

  if (isDataLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Status Distribution</CardTitle>
          <CardDescription>Breakdown of products by stock level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Status Distribution</CardTitle>
        <CardDescription>
          Breakdown of {products.length.toLocaleString()} products by stock level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value} ({entry.payload.value})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {distribution.find(d => d.status === StockStatus.Normal)?.value || 0}
            </div>
            <div className="text-sm text-muted-foreground">Normal Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {(distribution.find(d => d.status === StockStatus.Low)?.value || 0) + 
               (distribution.find(d => d.status === StockStatus.Critical)?.value || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Need Attention</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}