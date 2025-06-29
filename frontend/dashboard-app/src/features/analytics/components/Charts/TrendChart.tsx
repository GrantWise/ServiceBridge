import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendChartProps {
  title: string;
  description?: string;
  data?: Array<{
    date: string;
    [key: string]: any;
  }>;
  lines?: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  loading?: boolean;
}

// Mock data for demonstration
const mockTrendData = [
  { date: '2024-01', totalProducts: 2450, lowStock: 45, transactions: 1200 },
  { date: '2024-02', totalProducts: 2480, lowStock: 38, transactions: 1350 },
  { date: '2024-03', totalProducts: 2520, lowStock: 42, transactions: 1280 },
  { date: '2024-04', totalProducts: 2540, lowStock: 35, transactions: 1420 },
  { date: '2024-05', totalProducts: 2560, lowStock: 28, transactions: 1380 },
  { date: '2024-06', totalProducts: 2574, lowStock: 23, transactions: 1500 },
];

const defaultLines = [
  { dataKey: 'totalProducts', name: 'Total Products', color: '#3b82f6' },
  { dataKey: 'lowStock', name: 'Low Stock Items', color: '#ef4444' },
  { dataKey: 'transactions', name: 'Monthly Transactions', color: '#10b981' },
];

export function TrendChart({ 
  title, 
  description, 
  data = mockTrendData, 
  lines = defaultLines,
  loading = false 
}: TrendChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}