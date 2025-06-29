import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIWidgetProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    isPositive?: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'success' | 'warning' | 'destructive';
  description?: string;
  loading?: boolean;
}

export function KPIWidget({
  title,
  value,
  change,
  icon: Icon,
  trend,
  color = 'default',
  description,
  loading = false,
}: KPIWidgetProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getChangeColor = () => {
    if (change?.isPositive === undefined) {
      return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';
    }
    return change.isPositive ? 'text-green-600' : 'text-red-600';
  };

  const getCardColor = () => {
    switch (color) {
      case 'success':
        return 'border-green-200 bg-green-50/50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50/50';
      case 'destructive':
        return 'border-red-200 bg-red-50/50';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card className={cn('transition-all duration-200', getCardColor())}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && (
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          )}
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', getCardColor())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon className={cn(
            'h-4 w-4',
            color === 'success' ? 'text-green-600' :
            color === 'warning' ? 'text-yellow-600' :
            color === 'destructive' ? 'text-red-600' :
            'text-muted-foreground'
          )} />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {trend && (
            <Badge variant="outline" className="gap-1">
              {getTrendIcon()}
            </Badge>
          )}
        </div>
        
        {change && (
          <div className="flex items-center gap-1 text-xs mt-1">
            <span className={cn('font-medium', getChangeColor())}>
              {change.value > 0 ? '+' : ''}{change.value}%
            </span>
            <span className="text-muted-foreground">
              from {change.period}
            </span>
          </div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}