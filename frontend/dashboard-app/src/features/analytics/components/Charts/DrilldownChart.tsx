import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface DrilldownLevel {
  id: string;
  name: string;
  data: any[];
  parent?: string;
}

interface DrilldownChartProps {
  initialData: any[];
  title: string;
  description?: string;
  drilldownLevels?: DrilldownLevel[];
  chartType?: 'bar' | 'pie';
  onDrilldown?: (item: any, level: number) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function DrilldownChart({ 
  initialData, 
  title, 
  description, 
  drilldownLevels = [],
  chartType = 'bar',
  onDrilldown 
}: DrilldownChartProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([title]);
  const [currentData, setCurrentData] = useState(initialData);

  const handleDrilldown = (item: any) => {
    if (currentLevel < drilldownLevels.length) {
      const nextLevel = drilldownLevels[currentLevel];
      if (nextLevel) {
        setCurrentLevel(prev => prev + 1);
        setBreadcrumbs(prev => [...prev, item.name || item.category]);
        setCurrentData(nextLevel.data.filter(d => d.parent === item.name || d.category === item.name));
        onDrilldown?.(item, currentLevel + 1);
      }
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setCurrentLevel(0);
      setBreadcrumbs([title]);
      setCurrentData(initialData);
    } else {
      const targetLevel = index - 1;
      setCurrentLevel(targetLevel);
      setBreadcrumbs(prev => prev.slice(0, index + 1));
      
      if (targetLevel === 0) {
        setCurrentData(initialData);
      } else {
        const level = drilldownLevels[targetLevel - 1];
        setCurrentData(level?.data || initialData);
      }
    }
  };

  const renderBarChart = () => (
    <ResponsiveContainer width=\"100%\" height={400}>
      <BarChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray=\"3 3\" />
        <XAxis 
          dataKey=\"name\" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor=\"end\"
          height={60}
        />
        <YAxis />
        <Tooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className=\"bg-white p-3 border rounded-lg shadow-lg\">
                  <p className=\"font-medium\">{label}</p>
                  {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }}>
                      {entry.dataKey}: {entry.value?.toLocaleString()}
                    </p>
                  ))}
                  {currentLevel < drilldownLevels.length && (
                    <p className=\"text-xs text-muted-foreground mt-1\">
                      Click to drill down
                    </p>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Bar 
          dataKey=\"value\" 
          fill=\"#8884d8\" 
          cursor={currentLevel < drilldownLevels.length ? 'pointer' : 'default'}
          onClick={handleDrilldown}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width=\"100%\" height={400}>
      <PieChart>
        <Pie
          data={currentData}
          cx=\"50%\"
          cy=\"50%\"
          outerRadius={120}
          fill=\"#8884d8\"
          dataKey=\"value\"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          cursor={currentLevel < drilldownLevels.length ? 'pointer' : 'default'}
          onClick={handleDrilldown}
        >
          {currentData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className=\"bg-white p-3 border rounded-lg shadow-lg\">
                  <p className=\"font-medium\">{data.name}</p>
                  <p style={{ color: payload[0].color }}>
                    Value: {data.value?.toLocaleString()}
                  </p>
                  <p className=\"text-sm text-muted-foreground\">
                    {((data.value / currentData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                  </p>
                  {currentLevel < drilldownLevels.length && (
                    <p className=\"text-xs text-muted-foreground mt-1\">
                      Click to drill down
                    </p>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardHeader>
        <div className=\"flex items-center justify-between\">
          <div>
            <CardTitle className=\"flex items-center gap-2\">
              {chartType === 'bar' ? <BarChart3 className=\"h-5 w-5\" /> : <PieChartIcon className=\"h-5 w-5\" />}
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className=\"flex items-center gap-2\">
            <Badge variant=\"outline\">
              Level {currentLevel + 1}
            </Badge>
            {currentLevel < drilldownLevels.length && (
              <Badge variant=\"secondary\">
                <TrendingUp className=\"h-3 w-3 mr-1\" />
                Drilldown Available
              </Badge>
            )}
          </div>
        </div>
        
        {/* Breadcrumbs */}
        <div className=\"flex items-center gap-2 flex-wrap\">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className=\"flex items-center gap-2\">
              <Button
                variant={index === breadcrumbs.length - 1 ? \"default\" : \"ghost\"}
                size=\"sm\"
                onClick={() => handleBreadcrumbClick(index)}
                disabled={index === breadcrumbs.length - 1}
              >
                {index === 0 && <ChevronLeft className=\"h-4 w-4 mr-1\" />}
                {crumb}
              </Button>
              {index < breadcrumbs.length - 1 && (
                <span className=\"text-muted-foreground\">/</span>
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartType === 'bar' ? renderBarChart() : renderPieChart()}
        
        {/* Data Summary */}
        <div className=\"mt-4 grid grid-cols-3 gap-4 text-center\">
          <div className=\"space-y-1\">
            <div className=\"text-2xl font-bold\">
              {currentData.length}
            </div>
            <div className=\"text-sm text-muted-foreground\">Categories</div>
          </div>
          <div className=\"space-y-1\">
            <div className=\"text-2xl font-bold\">
              {currentData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
            </div>
            <div className=\"text-sm text-muted-foreground\">Total Value</div>
          </div>
          <div className=\"space-y-1\">
            <div className=\"text-2xl font-bold\">
              {Math.max(...currentData.map(item => item.value)).toLocaleString()}
            </div>
            <div className=\"text-sm text-muted-foreground\">Highest Value</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}