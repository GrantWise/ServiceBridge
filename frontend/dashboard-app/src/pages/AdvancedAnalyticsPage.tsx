import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, Activity, Zap } from 'lucide-react';

import { DrilldownChart } from '@/features/analytics/components/Charts/DrilldownChart';
import { ComparativeChart } from '@/features/analytics/components/Charts/ComparativeChart';
import { InteractiveHeatmap } from '@/features/analytics/components/Charts/InteractiveHeatmap';

export function AdvancedAnalyticsPage() {
  const [selectedMetric, setSelectedMetric] = useState<string>('sales');

  // Mock data for drilldown chart
  const salesByCategory = [
    { name: 'Electronics', value: 45000, category: 'Electronics' },
    { name: 'Clothing', value: 32000, category: 'Clothing' },
    { name: 'Home & Garden', value: 28000, category: 'Home & Garden' },
    { name: 'Sports', value: 15000, category: 'Sports' },
    { name: 'Books', value: 8000, category: 'Books' }
  ];

  const electronicsDrilldown = [
    { name: 'Laptops', value: 18000, parent: 'Electronics', category: 'Laptops' },
    { name: 'Smartphones', value: 15000, parent: 'Electronics', category: 'Smartphones' },
    { name: 'Tablets', value: 8000, parent: 'Electronics', category: 'Tablets' },
    { name: 'Accessories', value: 4000, parent: 'Electronics', category: 'Accessories' }
  ];

  const laptopsDrilldown = [
    { name: 'Gaming Laptops', value: 8000, parent: 'Laptops' },
    { name: 'Business Laptops', value: 6000, parent: 'Laptops' },
    { name: 'Ultrabooks', value: 4000, parent: 'Laptops' }
  ];

  const drilldownLevels = [
    {
      id: 'electronics',
      name: 'Electronics Breakdown',
      data: electronicsDrilldown
    },
    {
      id: 'laptops',
      name: 'Laptop Categories',
      data: laptopsDrilldown
    }
  ];

  // Mock data for comparative chart
  const generateTimeSeriesData = (name: string, baseValue: number, variance: number) => {
    const data = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const value = baseValue + (Math.random() - 0.5) * variance + Math.sin(i / 5) * variance * 0.3;
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, Math.round(value))
      });
    }
    return data;
  };

  const comparativeSeries = [
    {
      id: 'revenue',
      name: 'Revenue',
      data: generateTimeSeriesData('Revenue', 50000, 15000),
      color: '#8884d8'
    },
    {
      id: 'orders',
      name: 'Orders',
      data: generateTimeSeriesData('Orders', 1200, 300),
      color: '#82ca9d'
    },
    {
      id: 'customers',
      name: 'New Customers',
      data: generateTimeSeriesData('Customers', 150, 50),
      color: '#ffc658'
    }
  ];

  // Mock data for heatmap
  const generateHeatmapData = () => {
    const data = [];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    days.forEach(day => {
      hours.forEach(hour => {
        const baseActivity = day === 'Sat' || day === 'Sun' ? 30 : 50;
        const hourMultiplier = hour >= 9 && hour <= 17 ? 1.5 : hour >= 18 && hour <= 22 ? 1.2 : 0.5;
        const value = Math.round(baseActivity * hourMultiplier * (0.7 + Math.random() * 0.6));
        
        data.push({
          x: hour,
          y: day,
          value,
          label: `${day} ${hour}:00`,
          metadata: {
            dayType: day === 'Sat' || day === 'Sun' ? 'Weekend' : 'Weekday',
            timeOfDay: hour >= 6 && hour < 12 ? 'Morning' : 
                      hour >= 12 && hour < 18 ? 'Afternoon' : 
                      hour >= 18 && hour < 24 ? 'Evening' : 'Night'
          }
        });
      });
    });
    
    return data;
  };

  const heatmapData = generateHeatmapData();

  const handleDrilldown = (item: any, level: number) => {
    console.log(`Drilling down to level ${level}:`, item);
  };

  const handleHeatmapClick = (dataPoint: any) => {
    console.log('Heatmap cell clicked:', dataPoint);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Interactive data exploration and advanced visualization tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Activity className="h-3 w-3 mr-1" />
            Real-time Data
          </Badge>
          <Badge variant="secondary">
            <Zap className="h-3 w-3 mr-1" />
            Interactive
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="drilldown" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="drilldown">Drilldown Analysis</TabsTrigger>
          <TabsTrigger value="comparative">Comparative Trends</TabsTrigger>
          <TabsTrigger value="heatmap">Activity Heatmap</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="drilldown" className="space-y-6">
          <DrilldownChart
            initialData={salesByCategory}
            title="Sales Performance by Category"
            description="Click on any category to drill down into subcategories"
            drilldownLevels={drilldownLevels}
            chartType="bar"
            onDrilldown={handleDrilldown}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <DrilldownChart
              initialData={salesByCategory}
              title="Category Distribution"
              description="Pie chart view with drill-down capability"
              drilldownLevels={drilldownLevels}
              chartType="pie"
              onDrilldown={handleDrilldown}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Drilldown Instructions</CardTitle>
                <CardDescription>
                  How to use the interactive drilldown charts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">1</div>
                    <div>
                      <strong>Click any segment</strong> to drill down into subcategories
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">2</div>
                    <div>
                      <strong>Use breadcrumbs</strong> to navigate back to previous levels
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">3</div>
                    <div>
                      <strong>Hover for details</strong> to see additional information
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">4</div>
                    <div>
                      <strong>Switch chart types</strong> between bar and pie views
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparative" className="space-y-6">
          <ComparativeChart
            series={comparativeSeries}
            title="Multi-Metric Performance Comparison"
            description="Compare multiple business metrics over time with trend analysis"
            showTrends={true}
            showComparison={true}
          />
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Revenue Trend</span>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12.5%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Order Volume</span>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8.3%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Customer Growth</span>
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15.7%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Correlation Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span>Revenue vs Orders</span>
                      <span className="font-medium">0.89</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '89%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span>Orders vs Customers</span>
                      <span className="font-medium">0.76</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '76%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span>Revenue vs Customers</span>
                      <span className="font-medium">0.68</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: '68%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Next 7 days:</span>
                    <div className="font-medium">Revenue: $385K (+7%)</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Next 30 days:</span>
                    <div className="font-medium">Orders: 8,400 (+5%)</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <Badge variant="secondary">85%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-6">
          <InteractiveHeatmap
            data={heatmapData}
            title="User Activity Heatmap"
            description="Visualize user activity patterns across days and hours"
            xAxisLabel="Hour of Day"
            yAxisLabel="Day of Week"
            colorScheme="blue"
            showValues={true}
            onCellClick={handleHeatmapClick}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pattern Analysis</CardTitle>
                <CardDescription>
                  Key insights from activity patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium">Peak Activity</div>
                      <div className="text-sm text-muted-foreground">Weekdays 2-4 PM</div>
                    </div>
                    <Badge variant="secondary">92% higher</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">Weekend Pattern</div>
                      <div className="text-sm text-muted-foreground">Later start, evening peak</div>
                    </div>
                    <Badge variant="secondary">6 PM peak</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <div className="font-medium">Low Activity</div>
                      <div className="text-sm text-muted-foreground">Early morning hours</div>
                    </div>
                    <Badge variant="secondary">2-6 AM</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>
                  Overall activity metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">68.5</div>
                      <div className="text-sm text-muted-foreground">Avg/Hour</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">1,644</div>
                      <div className="text-sm text-muted-foreground">Daily Total</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weekday Average</span>
                      <span className="font-medium">78.2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Weekend Average</span>
                      <span className="font-medium">45.6</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Peak Hour (2 PM)</span>
                      <span className="font-medium">127.8</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🤖 AI-Powered Insights</CardTitle>
              <CardDescription>
                Machine learning analysis of your data patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-green-800">Opportunity Detected</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Electronics category shows 23% growth potential. Consider expanding inventory 
                          during peak hours (2-4 PM) when user activity is highest.
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            High Confidence
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800">Pattern Recognition</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Strong correlation (0.89) between revenue and order volume suggests 
                          consistent pricing strategy. Weekend patterns differ significantly.
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            Statistical Insight
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                  <h4 className="font-medium mb-3">🚀 Advanced Analytics Demo Features</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">Interactive Visualization</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Multi-level drilldown with breadcrumb navigation</li>
                        <li>• Comparative trend analysis with correlation metrics</li>
                        <li>• Interactive heatmaps with pattern detection</li>
                        <li>• Real-time data updates and filtering</li>
                        <li>• Custom color schemes and value formatting</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">Data Integration</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• REST API data fetching with caching</li>
                        <li>• gRPC bulk analytics processing</li>
                        <li>• SignalR real-time chart updates</li>
                        <li>• Cross-protocol error handling</li>
                        <li>• Optimized rendering for large datasets</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Try it:</strong> Click on chart segments to drill down, toggle series 
                      in comparative charts, and click heatmap cells to explore data patterns. 
                      These components demonstrate advanced data visualization techniques using modern 
                      React patterns and enterprise-grade real-time data integration.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}