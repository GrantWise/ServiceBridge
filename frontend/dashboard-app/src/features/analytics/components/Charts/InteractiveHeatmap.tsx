import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Calendar, Filter } from 'lucide-react';

interface HeatmapDataPoint {
  x: string | number;
  y: string | number;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

interface InteractiveHeatmapProps {
  data: HeatmapDataPoint[];
  title: string;
  description?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colorScheme?: 'blue' | 'red' | 'green' | 'purple';
  showValues?: boolean;
  onCellClick?: (dataPoint: HeatmapDataPoint) => void;
}

const COLOR_SCHEMES = {
  blue: {
    low: '#EBF8FF',
    medium: '#3182CE',
    high: '#1A365D'
  },
  red: {
    low: '#FED7D7',
    medium: '#E53E3E',
    high: '#742A2A'
  },
  green: {
    low: '#F0FFF4',
    medium: '#38A169',
    high: '#1A202C'
  },
  purple: {
    low: '#FAF5FF',
    medium: '#805AD5',
    high: '#44337A'
  }
};

export function InteractiveHeatmap({
  data,
  title,
  description,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  colorScheme = 'blue',
  showValues = true,
  onCellClick
}: InteractiveHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<HeatmapDataPoint | null>(null);
  const [filterThreshold, setFilterThreshold] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);

  // Process data into grid format
  const { gridData, xValues, yValues, minValue, maxValue } = useMemo(() => {
    const xSet = new Set(data.map(d => d.x));
    const ySet = new Set(data.map(d => d.y));
    const xValues = Array.from(xSet).sort();
    const yValues = Array.from(ySet).sort();
    
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    // Create grid
    const gridData: (HeatmapDataPoint | null)[][] = yValues.map(y => 
      xValues.map(x => data.find(d => d.x === x && d.y === y) || null)
    );
    
    return { gridData, xValues, yValues, minValue, maxValue };
  }, [data]);

  // Calculate color intensity
  const getColorIntensity = (value: number) => {
    if (maxValue === minValue) return 0.5;
    return (value - minValue) / (maxValue - minValue);
  };

  // Get cell color
  const getCellColor = (value: number) => {
    const intensity = getColorIntensity(value);
    const colors = COLOR_SCHEMES[colorScheme];
    
    if (intensity < 0.33) return colors.low;
    if (intensity < 0.66) return colors.medium;
    return colors.high;
  };

  // Get text color based on background
  const getTextColor = (value: number) => {
    const intensity = getColorIntensity(value);
    return intensity > 0.5 ? '#FFFFFF' : '#000000';
  };

  // Filter data based on threshold
  const getFilteredData = () => {
    if (filterThreshold === 'all') return data;
    
    const range = maxValue - minValue;
    const lowThreshold = minValue + range * 0.33;
    const highThreshold = minValue + range * 0.66;
    
    switch (filterThreshold) {
      case 'low':
        return data.filter(d => d.value < lowThreshold);
      case 'medium':
        return data.filter(d => d.value >= lowThreshold && d.value < highThreshold);
      case 'high':
        return data.filter(d => d.value >= highThreshold);
      default:
        return data;
    }
  };

  const handleCellClick = (dataPoint: HeatmapDataPoint) => {
    setSelectedCell(dataPoint);
    onCellClick?.(dataPoint);
  };

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(0);
  };

  const filteredData = getFilteredData();
  const averageValue = filteredData.reduce((sum, d) => sum + d.value, 0) / filteredData.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterThreshold} onValueChange={(value: any) => setFilterThreshold(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Values</SelectItem>
                <SelectItem value="low">Low Values</SelectItem>
                <SelectItem value="medium">Medium Values</SelectItem>
                <SelectItem value="high">High Values</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">
              <Filter className="h-3 w-3 mr-1" />
              {filteredData.length} points
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Heatmap Grid */}
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Y-axis label */}
              <div className="flex">
                <div className="w-16 flex items-center justify-center">
                  <span className="text-sm font-medium text-muted-foreground transform -rotate-90">
                    {yAxisLabel}
                  </span>
                </div>
                <div className="flex-1">
                  {/* Header with X values */}
                  <div className="flex mb-2">
                    <div className="w-20"></div>
                    {xValues.map(x => (
                      <div key={x} className="w-16 text-center text-sm font-medium text-muted-foreground">
                        {String(x).length > 6 ? String(x).substring(0, 6) + '...' : x}
                      </div>
                    ))}
                  </div>
                  
                  {/* Grid rows */}
                  {gridData.map((row, yIndex) => (
                    <div key={yValues[yIndex]} className="flex mb-1">
                      <div className="w-20 flex items-center justify-end pr-2 text-sm font-medium text-muted-foreground">
                        {String(yValues[yIndex]).length > 8 ? 
                          String(yValues[yIndex]).substring(0, 8) + '...' : 
                          yValues[yIndex]
                        }
                      </div>
                      {row.map((cell, xIndex) => (
                        <div
                          key={`${xIndex}-${yIndex}`}
                          className={`w-16 h-12 border border-gray-200 flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:ring-2 hover:ring-blue-300 ${
                            selectedCell === cell ? 'ring-2 ring-blue-500' : ''
                          } ${
                            hoveredCell === cell ? 'scale-105' : ''
                          }`}
                          style={{
                            backgroundColor: cell ? getCellColor(cell.value) : '#F9FAFB',
                            color: cell ? getTextColor(cell.value) : '#6B7280'
                          }}
                          onClick={() => cell && handleCellClick(cell)}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          title={cell ? `${cell.label || `${cell.x}, ${cell.y}`}: ${cell.value}` : 'No data'}
                        >
                          {cell && showValues ? formatValue(cell.value) : cell ? '•' : '-'}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* X-axis label */}
              <div className="text-center mt-4">
                <span className="text-sm font-medium text-muted-foreground">{xAxisLabel}</span>
              </div>
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm font-medium">Low</span>
            <div className="flex">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="w-6 h-4"
                  style={{
                    backgroundColor: getCellColor(minValue + (maxValue - minValue) * (i / 9))
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-medium">High</span>
            <div className="ml-4 text-sm text-muted-foreground">
              {formatValue(minValue)} - {formatValue(maxValue)}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatValue(minValue)}</div>
              <div className="text-sm text-muted-foreground">Minimum</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatValue(averageValue)}</div>
              <div className="text-sm text-muted-foreground">Average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatValue(maxValue)}</div>
              <div className="text-sm text-muted-foreground">Maximum</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.length}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
          </div>

          {/* Selected Cell Info */}
          {selectedCell && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Selected Cell Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Position:</span>
                  <span className="ml-2 font-medium">{selectedCell.x}, {selectedCell.y}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Value:</span>
                  <span className="ml-2 font-medium">{selectedCell.value}</span>
                </div>
                {selectedCell.label && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Label:</span>
                    <span className="ml-2 font-medium">{selectedCell.label}</span>
                  </div>
                )}
                {selectedCell.metadata && Object.keys(selectedCell.metadata).length > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Metadata:</span>
                    <div className="mt-1 space-y-1">
                      {Object.entries(selectedCell.metadata).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          {key}: {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}