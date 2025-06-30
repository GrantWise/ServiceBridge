import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';

interface DataSeries {
  id: string;
  name: string;
  data: any[];
  color: string;
}

interface ComparativeChartProps {
  series: DataSeries[];
  title: string;
  description?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  showTrends?: boolean;
  showComparison?: boolean;
}

const TREND_COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#6B7280'
};

export function ComparativeChart({
  series,
  title,
  description,
  xAxisKey = 'date',
  yAxisKey = 'value',
  timeRange = 'month',
  showTrends = true,
  showComparison = true
}: ComparativeChartProps) {
  const [selectedSeries, setSelectedSeries] = useState<string[]>(series.map(s => s.id));
  const [comparisonMode, setComparisonMode] = useState<'absolute' | 'percentage'>('absolute');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  // Combine and normalize data from all series
  const combinedData = series.length > 0 ? 
    series[0].data.map((item, index) => {
      const combined: any = { [xAxisKey]: item[xAxisKey] };
      series.forEach(serie => {
        if (selectedSeries.includes(serie.id) && serie.data[index]) {
          combined[serie.id] = serie.data[index][yAxisKey];
        }
      });
      return combined;
    }) : [];

  // Calculate trends for each series
  const calculateTrend = (data: any[], seriesId: string) => {
    const values = data.map(item => item[seriesId]).filter(v => v !== undefined);
    if (values.length < 2) return { trend: 'neutral', percentage: 0 };
    
    const first = values[0];
    const last = values[values.length - 1];
    const percentage = ((last - first) / first) * 100;
    
    return {
      trend: percentage > 5 ? 'positive' : percentage < -5 ? 'negative' : 'neutral',
      percentage: percentage
    };
  };

  // Calculate comparison metrics
  const getComparisonData = () => {
    return series
      .filter(serie => selectedSeries.includes(serie.id))
      .map(serie => {
        const trend = calculateTrend(combinedData, serie.id);
        const currentValue = combinedData[combinedData.length - 1]?.[serie.id] || 0;
        const previousValue = combinedData[combinedData.length - 2]?.[serie.id] || 0;
        const change = currentValue - previousValue;
        const changePercentage = previousValue !== 0 ? (change / previousValue) * 100 : 0;
        
        return {
          id: serie.id,
          name: serie.name,
          color: serie.color,
          currentValue,
          change,
          changePercentage,
          trend: trend.trend,
          trendPercentage: trend.percentage
        };
      });
  };

  const toggleSeries = (seriesId: string) => {
    setSelectedSeries(prev => 
      prev.includes(seriesId) 
        ? prev.filter(id => id !== seriesId)
        : [...prev, seriesId]
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(0);
  };

  const comparisonData = getComparisonData();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
            
            {showComparison && (
              <Select value={comparisonMode} onValueChange={(value: any) => setComparisonMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="absolute">Absolute</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Series Controls */}
        <div className="flex flex-wrap gap-2">
          {series.map(serie => (
            <Button
              key={serie.id}
              variant={selectedSeries.includes(serie.id) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSeries(serie.id)}
              className="flex items-center gap-2"
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: serie.color }}
              />
              {serie.name}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatValue}
            />
            <Tooltip 
              formatter={(value: any, name: string) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                series.find(s => s.id === name)?.name || name
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            
            {series
              .filter(serie => selectedSeries.includes(serie.id))
              .map(serie => (
                <Line
                  key={serie.id}
                  type="monotone"
                  dataKey={serie.id}
                  stroke={serie.color}
                  strokeWidth={2}
                  dot={{ fill: serie.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            
            {/* Reference lines for averages */}
            {selectedSeries.map(seriesId => {
              const serieData = combinedData.map(d => d[seriesId]).filter(v => v !== undefined);
              const average = serieData.reduce((sum, val) => sum + val, 0) / serieData.length;
              const serie = series.find(s => s.id === seriesId);
              
              return (
                <ReferenceLine
                  key={`ref-${seriesId}`}
                  y={average}
                  stroke={serie?.color}
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>

        {/* Comparison Metrics */}
        {showComparison && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comparisonData.map(data => (
              <div key={data.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: data.color }}
                    />
                    <span className="font-medium">{data.name}</span>
                  </div>
                  {showTrends && getTrendIcon(data.trend)}
                </div>
                
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {formatValue(data.currentValue)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-medium ${
                      data.changePercentage > 0 ? 'text-green-600' : 
                      data.changePercentage < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {data.changePercentage > 0 ? '+' : ''}{data.changePercentage.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">
                      ({data.change > 0 ? '+' : ''}{formatValue(data.change)})
                    </span>
                  </div>
                  
                  {showTrends && (
                    <Badge 
                      variant="outline" 
                      className={`${
                        data.trend === 'positive' ? 'border-green-200 text-green-700' :
                        data.trend === 'negative' ? 'border-red-200 text-red-700' :
                        'border-gray-200 text-gray-700'
                      }`}
                    >
                      {data.trendPercentage > 0 ? '+' : ''}{data.trendPercentage.toFixed(1)}% trend
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}