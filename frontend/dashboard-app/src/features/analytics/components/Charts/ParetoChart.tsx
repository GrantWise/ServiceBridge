import { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Target, AlertCircle, TrendingUp } from 'lucide-react';

interface ParetoDataPoint {
  category: string;
  value: number;
  cumulativePercentage: number;
  percentage: number;
  description?: string;
  actionPriority: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface ParetoInsight {
  vitalFew: string[];
  trivialMany: string[];
  criticalThreshold: number;
  totalIssues: number;
  topCausesContribution: number;
}

interface ParetoChartProps {
  title: string;
  description?: string;
  data: ParetoDataPoint[];
  yAxisLabel?: string;
  showInsights?: boolean;
  onCategoryClick?: (category: ParetoDataPoint) => void;
}

const PRIORITY_COLORS = {
  Critical: '#EF4444',
  High: '#F59E0B',
  Medium: '#3B82F6',
  Low: '#10B981'
};

export function ParetoChart({
  title,
  description,
  data,
  yAxisLabel = "Frequency",
  showInsights = true,
  onCategoryClick
}: ParetoChartProps) {
  const [highlightMode, setHighlightMode] = useState<'priority' | 'pareto'>('pareto');
  const [showCumulativeLine, setShowCumulativeLine] = useState(true);

  // Calculate Pareto insights
  const paretoInsights: ParetoInsight = {
    vitalFew: data.filter(d => d.cumulativePercentage <= 80).map(d => d.category),
    trivialMany: data.filter(d => d.cumulativePercentage > 80).map(d => d.category),
    criticalThreshold: 80,
    totalIssues: data.reduce((sum, d) => sum + d.value, 0),
    topCausesContribution: data.slice(0, Math.ceil(data.length * 0.2)).reduce((sum, d) => sum + d.percentage, 0)
  };

  const getBarColor = (dataPoint: ParetoDataPoint, index: number) => {
    if (highlightMode === 'priority') {
      return PRIORITY_COLORS[dataPoint.actionPriority];
    }
    
    // Pareto coloring - Vital Few vs Trivial Many
    if (dataPoint.cumulativePercentage <= 80) {
      return '#EF4444'; // Red for vital few (top 80%)
    }
    return '#9CA3AF'; // Gray for trivial many
  };

  const renderParetoInsights = () => {
    if (!showInsights) return null;

    return (
      <div className="mt-6 space-y-4">
        {/* 80/20 Rule Summary */}
        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
          <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Pareto Analysis (80/20 Rule)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-red-700">Vital Few (Top 20%)</div>
              <div className="text-red-600">
                {paretoInsights.vitalFew.length} categories contributing {paretoInsights.topCausesContribution.toFixed(1)}%
              </div>
              <div className="mt-1 text-xs">
                {paretoInsights.vitalFew.slice(0, 3).join(', ')}
                {paretoInsights.vitalFew.length > 3 && '...'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Trivial Many (Bottom 80%)</div>
              <div className="text-gray-600">
                {paretoInsights.trivialMany.length} categories contributing {(100 - paretoInsights.topCausesContribution).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="font-medium text-orange-700">Total Impact</div>
              <div className="text-orange-600">
                {paretoInsights.totalIssues.toLocaleString()} total occurrences
              </div>
            </div>
          </div>
        </div>

        {/* Action Priority Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => {
            const priorityData = data.filter(d => d.actionPriority === priority);
            const priorityTotal = priorityData.reduce((sum, d) => sum + d.value, 0);
            
            return (
              <div key={priority} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium">{priority} Priority</span>
                </div>
                <div className="text-lg font-bold">{priorityData.length}</div>
                <div className="text-sm text-muted-foreground">
                  {priorityTotal.toLocaleString()} occurrences
                </div>
              </div>
            );
          })}
        </div>

        {/* Root Cause Recommendations */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Root Cause Analysis Recommendations
          </h4>
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-blue-700">Focus Areas:</strong>
              <div className="mt-1">
                Focus improvement efforts on the top {Math.min(3, paretoInsights.vitalFew.length)} categories: 
                <strong> {paretoInsights.vitalFew.slice(0, 3).join(', ')}</strong>
              </div>
            </div>
            <div>
              <strong className="text-blue-700">Impact Potential:</strong>
              <div className="mt-1">
                Addressing these vital few categories could eliminate up to {paretoInsights.topCausesContribution.toFixed(1)}% of all issues.
              </div>
            </div>
            <div>
              <strong className="text-blue-700">Next Steps:</strong>
              <div className="mt-1">
                1. Perform detailed root cause analysis on critical categories<br/>
                2. Implement corrective actions for high-priority items<br/>
                3. Monitor trends to validate improvement effectiveness
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={highlightMode} onValueChange={(value: any) => setHighlightMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pareto">Pareto View</SelectItem>
                <SelectItem value="priority">Priority View</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCumulativeLine(!showCumulativeLine)}
            >
              {showCumulativeLine ? 'Hide' : 'Show'} Cumulative
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>Vital Few: {paretoInsights.vitalFew.length} categories</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded" />
            <span>Trivial Many: {paretoInsights.trivialMany.length} categories</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span>80% Impact in {paretoInsights.topCausesContribution.toFixed(1)}% of causes</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            {showCumulativeLine && (
              <YAxis 
                yAxisId="right" 
                orientation="right"
                domain={[0, 100]}
                label={{ value: 'Cumulative %', angle: 90, position: 'insideRight' }}
              />
            )}
            
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ParetoDataPoint;
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p style={{ color: payload[0].color }}>
                        {yAxisLabel}: {data.value.toLocaleString()}
                      </p>
                      <p>Percentage: {data.percentage.toFixed(1)}%</p>
                      <p>Cumulative: {data.cumulativePercentage.toFixed(1)}%</p>
                      <Badge 
                        style={{ 
                          backgroundColor: PRIORITY_COLORS[data.actionPriority],
                          color: 'white',
                          marginTop: '4px'
                        }}
                      >
                        {data.actionPriority} Priority
                      </Badge>
                      {data.description && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {data.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Click for detailed analysis
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Legend />
            
            {/* 80% Reference Line */}
            {showCumulativeLine && (
              <ReferenceLine 
                yAxisId="right"
                y={80} 
                stroke="#EF4444" 
                strokeDasharray="5 5"
                label={{ value: "80% Rule", position: "topRight" }}
              />
            )}
            
            <Bar 
              yAxisId="left"
              dataKey="value"
              name={yAxisLabel}
              cursor="pointer"
              onClick={(data) => onCategoryClick?.(data)}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry, index)}
                />
              ))}
            </Bar>
            
            {showCumulativeLine && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativePercentage"
                name="Cumulative %"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Pareto Insights */}
        {renderParetoInsights()}
      </CardContent>
    </Card>
  );
}