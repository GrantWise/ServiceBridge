import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

interface HistogramDataPoint {
  bin: string;
  count: number;
  frequency: number;
  lowerBound: number;
  upperBound: number;
}

interface ProcessCapability {
  mean: number;
  standardDeviation: number;
  upperControlLimit: number;
  lowerControlLimit: number;
  cpk: number;
  pp: number;
  capability: 'Poor' | 'Fair' | 'Good' | 'Excellent';
}

interface HistogramChartProps {
  title: string;
  description?: string;
  data: HistogramDataPoint[];
  processCapability?: ProcessCapability;
  targetValue?: number;
  upperSpecLimit?: number;
  lowerSpecLimit?: number;
  onBinClick?: (bin: HistogramDataPoint) => void;
}

const CAPABILITY_COLORS = {
  Poor: '#EF4444',
  Fair: '#F59E0B', 
  Good: '#10B981',
  Excellent: '#3B82F6'
};

const CONTROL_COLORS = ['#E5E7EB', '#F3F4F6', '#10B981', '#F59E0B', '#EF4444'];

export function HistogramChart({
  title,
  description,
  data,
  processCapability,
  targetValue,
  upperSpecLimit,
  lowerSpecLimit,
  onBinClick
}: HistogramChartProps) {
  const [viewMode, setViewMode] = useState<'frequency' | 'count'>('frequency');
  const [showCapability, setShowCapability] = useState(true);

  const maxValue = Math.max(...data.map(d => viewMode === 'frequency' ? d.frequency : d.count));
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  // Color bars based on process capability zones
  const getBarColor = (dataPoint: HistogramDataPoint) => {
    if (!processCapability) return '#3B82F6';
    
    const { mean, standardDeviation } = processCapability;
    const binCenter = (dataPoint.lowerBound + dataPoint.upperBound) / 2;
    const sigmaDistance = Math.abs(binCenter - mean) / standardDeviation;
    
    if (sigmaDistance <= 1) return '#10B981'; // Green - within 1 sigma
    if (sigmaDistance <= 2) return '#3B82F6'; // Blue - within 2 sigma  
    if (sigmaDistance <= 3) return '#F59E0B'; // Orange - within 3 sigma
    return '#EF4444'; // Red - beyond 3 sigma
  };

  const renderProcessStatistics = () => {
    if (!processCapability) return null;

    return (
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-lg font-bold">{processCapability.mean.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Mean</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-lg font-bold">{processCapability.standardDeviation.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Std Dev</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-lg font-bold">{processCapability.cpk.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Cpk</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <Badge 
              style={{ 
                backgroundColor: CAPABILITY_COLORS[processCapability.capability],
                color: 'white' 
              }}
            >
              {processCapability.capability}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">Process Capability</div>
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
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frequency">Frequency</SelectItem>
                <SelectItem value="count">Count</SelectItem>
              </SelectContent>
            </Select>
            {processCapability && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCapability(!showCapability)}
              >
                {showCapability ? 'Hide' : 'Show'} Capability
              </Button>
            )}
          </div>
        </div>

        {/* Process Capability Summary */}
        {processCapability && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Process Capability: {processCapability.capability}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Cpk: {processCapability.cpk.toFixed(2)}</span>
              {processCapability.cpk < 1.33 && (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              )}
            </div>
            <div>
              <span>Sample Size: {totalCount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="bin"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              label={{ 
                value: viewMode === 'frequency' ? 'Frequency (%)' : 'Count', 
                angle: -90, 
                position: 'insideLeft' 
              }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as HistogramDataPoint;
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-medium">Bin: {label}</p>
                      <p>Range: {data.lowerBound.toFixed(1)} - {data.upperBound.toFixed(1)}</p>
                      <p style={{ color: payload[0].color }}>
                        Count: {data.count.toLocaleString()}
                      </p>
                      <p>Frequency: {data.frequency.toFixed(1)}%</p>
                      {processCapability && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Click to analyze this range
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Reference lines for process limits */}
            {showCapability && processCapability && (
              <>
                <ReferenceLine 
                  x={processCapability.mean} 
                  stroke="#10B981" 
                  strokeDasharray="5 5"
                  label={{ value: "Mean", position: "top" }}
                />
                {targetValue && (
                  <ReferenceLine 
                    x={targetValue} 
                    stroke="#3B82F6" 
                    strokeDasharray="3 3"
                    label={{ value: "Target", position: "topRight" }}
                  />
                )}
                {upperSpecLimit && (
                  <ReferenceLine 
                    x={upperSpecLimit} 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    label={{ value: "USL", position: "topLeft" }}
                  />
                )}
                {lowerSpecLimit && (
                  <ReferenceLine 
                    x={lowerSpecLimit} 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    label={{ value: "LSL", position: "topLeft" }}
                  />
                )}
              </>
            )}
            
            <Bar 
              dataKey={viewMode}
              cursor="pointer"
              onClick={(data) => onBinClick?.(data)}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Process Statistics */}
        {showCapability && renderProcessStatistics()}

        {/* Process Insights */}
        {processCapability && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Process Control Insights</h4>
            <div className="space-y-2 text-sm">
              {processCapability.cpk < 1.0 && (
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Process capability is poor. Significant improvements needed.</span>
                </div>
              )}
              {processCapability.cpk >= 1.0 && processCapability.cpk < 1.33 && (
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Process is marginally capable. Consider process improvements.</span>
                </div>
              )}
              {processCapability.cpk >= 1.33 && (
                <div className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-4 w-4" />
                  <span>Process is capable and well-controlled.</span>
                </div>
              )}
              <div>
                <strong>Recommendation:</strong> {
                  processCapability.cpk < 1.0 
                    ? "Focus on reducing process variation and centering the process."
                    : processCapability.cpk < 1.33
                    ? "Fine-tune process parameters to improve consistency."
                    : "Maintain current process controls and monitor for drift."
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}