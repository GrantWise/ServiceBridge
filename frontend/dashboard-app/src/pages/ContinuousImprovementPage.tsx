import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, Target, ArrowRight, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

import { TrendChart } from '@/features/analytics/components/Charts/TrendChart';
import { HistogramChart } from '@/features/analytics/components/Charts/HistogramChart';
import { ParetoChart } from '@/features/analytics/components/Charts/ParetoChart';

export function ContinuousImprovementPage() {
  const [currentStep, setCurrentStep] = useState<'trends' | 'histogram' | 'pareto' | 'actions'>('trends');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  // Mock data for trend analysis - showing declining performance
  const performanceTrends = [
    { date: '2024-01', stockouts: 15, delays: 23, quality_issues: 8, customer_complaints: 12 },
    { date: '2024-02', stockouts: 18, delays: 28, quality_issues: 12, customer_complaints: 15 },
    { date: '2024-03', stockouts: 22, delays: 35, quality_issues: 15, customer_complaints: 19 },
    { date: '2024-04', stockouts: 28, delays: 42, quality_issues: 18, customer_complaints: 24 },
    { date: '2024-05', stockouts: 25, delays: 38, quality_issues: 21, customer_complaints: 28 },
    { date: '2024-06', stockouts: 30, delays: 45, quality_issues: 24, customer_complaints: 32 }
  ];

  const trendLines = [
    { dataKey: 'stockouts', name: 'Stockouts', color: '#EF4444' },
    { dataKey: 'delays', name: 'Delivery Delays', color: '#F59E0B' },
    { dataKey: 'quality_issues', name: 'Quality Issues', color: '#8B5CF6' },
    { dataKey: 'customer_complaints', name: 'Customer Complaints', color: '#EF4444' }
  ];

  // Mock histogram data for delivery delays (process control)
  const deliveryDelayHistogram = [
    { bin: '0-1', count: 45, frequency: 15.0, lowerBound: 0, upperBound: 1 },
    { bin: '1-2', count: 78, frequency: 26.0, lowerBound: 1, upperBound: 2 },
    { bin: '2-3', count: 92, frequency: 30.7, lowerBound: 2, upperBound: 3 },
    { bin: '3-4', count: 65, frequency: 21.7, lowerBound: 3, upperBound: 4 },
    { bin: '4-5', count: 18, frequency: 6.0, lowerBound: 4, upperBound: 5 },
    { bin: '5+', count: 2, frequency: 0.7, lowerBound: 5, upperBound: 6 }
  ];

  const processCapability = {
    mean: 2.3,
    standardDeviation: 1.1,
    upperControlLimit: 5.6,
    lowerControlLimit: -1.0,
    cpk: 0.89,
    pp: 1.02,
    capability: 'Poor' as const
  };

  // Mock Pareto data for root cause analysis
  const rootCauseData = [
    { 
      category: 'Supplier Delays', 
      value: 145, 
      percentage: 32.2, 
      cumulativePercentage: 32.2,
      actionPriority: 'Critical' as const,
      description: 'Late deliveries from key suppliers causing stockouts'
    },
    { 
      category: 'Forecasting Errors', 
      value: 98, 
      percentage: 21.8, 
      cumulativePercentage: 54.0,
      actionPriority: 'High' as const,
      description: 'Inaccurate demand forecasts leading to stock imbalances'
    },
    { 
      category: 'System Downtime', 
      value: 72, 
      percentage: 16.0, 
      cumulativePercentage: 70.0,
      actionPriority: 'High' as const,
      description: 'IT system outages affecting order processing'
    },
    { 
      category: 'Transportation Issues', 
      value: 55, 
      percentage: 12.2, 
      cumulativePercentage: 82.2,
      actionPriority: 'Medium' as const,
      description: 'Carrier delays and routing inefficiencies'
    },
    { 
      category: 'Quality Rejections', 
      value: 38, 
      percentage: 8.4, 
      cumulativePercentage: 90.6,
      actionPriority: 'Medium' as const,
      description: 'Products failing quality inspections'
    },
    { 
      category: 'Manual Errors', 
      value: 28, 
      percentage: 6.2, 
      cumulativePercentage: 96.8,
      actionPriority: 'Low' as const,
      description: 'Human errors in data entry and processing'
    },
    { 
      category: 'Other', 
      value: 14, 
      percentage: 3.1, 
      cumulativePercentage: 100.0,
      actionPriority: 'Low' as const,
      description: 'Miscellaneous minor issues'
    }
  ];

  const improvementSteps = [
    {
      id: 'trends',
      title: 'Trend Analysis',
      description: 'Identify performance issues over time',
      icon: TrendingUp,
      color: 'blue',
      insights: [
        'Stockouts increased 100% over 6 months',
        'Delivery delays show concerning upward trend',
        'Quality issues correlate with delivery problems',
        'Customer complaints lag operational issues by ~1 month'
      ]
    },
    {
      id: 'histogram',
      title: 'Process Control',
      description: 'Understand process variation and capability',
      icon: BarChart3,
      color: 'green',
      insights: [
        'Delivery delay process is not capable (Cpk=0.89)',
        'Process is not centered within specifications',
        'High variation indicates lack of control',
        'Need to reduce variation and center the process'
      ]
    },
    {
      id: 'pareto',
      title: 'Root Cause Analysis',
      description: 'Identify the vital few causes using 80/20 rule',
      icon: Target,
      color: 'red',
      insights: [
        'Top 3 causes account for 70% of all issues',
        'Supplier delays are the #1 root cause (32%)',
        'Forecasting errors contribute significantly (22%)',
        'Focus on these vital few for maximum impact'
      ]
    },
    {
      id: 'actions',
      title: 'Improvement Actions',
      description: 'Implement corrective actions and monitor results',
      icon: CheckCircle,
      color: 'purple',
      insights: [
        'Implement supplier performance agreements',
        'Upgrade forecasting models with ML/AI',
        'Create process control charts for monitoring',
        'Establish regular review cycles for continuous improvement'
      ]
    }
  ];

  const actionPlans = [
    {
      rootCause: 'Supplier Delays',
      actions: [
        'Implement supplier performance scorecards',
        'Diversify supplier base to reduce dependency',
        'Establish backup suppliers for critical items',
        'Create early warning system for potential delays'
      ],
      timeline: '3 months',
      owner: 'Supply Chain Manager',
      expectedImpact: '40% reduction in stockouts'
    },
    {
      rootCause: 'Forecasting Errors',
      actions: [
        'Implement machine learning forecasting models',
        'Integrate real-time sales data',
        'Create collaborative forecasting process with sales',
        'Establish forecast accuracy KPIs and reviews'
      ],
      timeline: '4 months',
      owner: 'Demand Planning Manager',
      expectedImpact: '25% improvement in forecast accuracy'
    },
    {
      rootCause: 'System Downtime',
      actions: [
        'Implement redundant systems and failover capability',
        'Create comprehensive backup and recovery procedures',
        'Establish proactive monitoring and alerting',
        'Conduct regular disaster recovery testing'
      ],
      timeline: '6 months',
      owner: 'IT Manager',
      expectedImpact: '90% reduction in system-related delays'
    }
  ];

  const getStepColor = (stepId: string) => {
    const step = improvementSteps.find(s => s.id === stepId);
    return step?.color || 'gray';
  };

  const renderCycleOverview = () => (
    <div className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Continuous Improvement Cycle (PDCA)</CardTitle>
          <CardDescription className="text-center">
            Data-driven approach to operational excellence using three powerful analytical tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            {improvementSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-700 border-blue-200',
                green: 'bg-green-100 text-green-700 border-green-200',
                red: 'bg-red-100 text-red-700 border-red-200',
                purple: 'bg-purple-100 text-purple-700 border-purple-200'
              };
              
              return (
                <div key={step.id} className="flex items-center">
                  <Button
                    variant={isActive ? "default" : "outline"}
                    className={`flex flex-col items-center p-6 h-auto w-48 ${
                      isActive ? '' : colorClasses[step.color as keyof typeof colorClasses]
                    }`}
                    onClick={() => setCurrentStep(step.id as any)}
                  >
                    <Icon className="h-8 w-8 mb-2" />
                    <div className="font-medium">{step.title}</div>
                    <div className="text-xs text-center mt-1 opacity-80">
                      {step.description}
                    </div>
                  </Button>
                  {index < improvementSteps.length - 1 && (
                    <ArrowRight className="h-6 w-6 mx-2 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStepInsights = (stepId: string) => {
    const step = improvementSteps.find(s => s.id === stepId);
    if (!step) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Key Insights: {step.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {step.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{insight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Continuous Improvement Analytics</h1>
          <p className="text-muted-foreground">
            Data-driven quality management using trend analysis, process control, and root cause analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            PDCA Methodology
          </Badge>
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Target className="h-3 w-3 mr-1" />
            80/20 Analysis
          </Badge>
        </div>
      </div>

      {/* Continuous Improvement Cycle Overview */}
      {renderCycleOverview()}

      <Tabs value={currentStep} onValueChange={(value: any) => setCurrentStep(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">1. Trend Analysis</TabsTrigger>
          <TabsTrigger value="histogram">2. Process Control</TabsTrigger>
          <TabsTrigger value="pareto">3. Root Cause</TabsTrigger>
          <TabsTrigger value="actions">4. Action Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {renderStepInsights('trends')}
          <TrendChart
            title="Performance Trend Analysis"
            description="Monitor key performance indicators over time to identify emerging issues"
            data={performanceTrends}
            lines={trendLines}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium text-red-700">Critical Trends Identified</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Stockouts:</span>
                      <Badge variant="destructive">+100% in 6 months</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Delays:</span>
                      <Badge variant="destructive">+96% in 6 months</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality Issues:</span>
                      <Badge variant="destructive">+200% in 6 months</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-700">Next Steps</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Analyze process variation with histograms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Identify root causes with Pareto analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Develop targeted improvement actions</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="histogram" className="space-y-6">
          {renderStepInsights('histogram')}
          <HistogramChart
            title="Delivery Delay Process Control"
            description="Analyze process variation and capability to understand root causes"
            data={deliveryDelayHistogram}
            processCapability={processCapability}
            targetValue={1.5}
            upperSpecLimit={4.0}
            lowerSpecLimit={0.0}
            onBinClick={(bin) => console.log('Analyzing bin:', bin)}
          />
        </TabsContent>

        <TabsContent value="pareto" className="space-y-6">
          {renderStepInsights('pareto')}
          <ParetoChart
            title="Root Cause Analysis - Delivery Issues"
            description="Apply the 80/20 rule to identify the vital few causes driving most problems"
            data={rootCauseData}
            yAxisLabel="Number of Incidents"
            onCategoryClick={(category) => {
              setSelectedIssue(category.category);
              console.log('Selected for detailed analysis:', category);
            }}
          />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          {renderStepInsights('actions')}
          
          <div className="grid gap-6">
            {actionPlans.map((plan, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Action Plan: {plan.rootCause}</span>
                    <Badge variant="outline">{plan.expectedImpact}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Owner: {plan.owner} | Timeline: {plan.timeline}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium">Specific Actions:</h4>
                    <div className="grid gap-2">
                      {plan.actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-green-800">Continuous Improvement Cycle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Monitoring Plan</h4>
                    <div className="space-y-2 text-sm">
                      <div>• Weekly trend analysis reviews</div>
                      <div>• Monthly process capability assessments</div>
                      <div>• Quarterly Pareto analysis updates</div>
                      <div>• Continuous action plan progress tracking</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">Success Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div>• 50% reduction in stockouts within 6 months</div>
                      <div>• Process Cpk improvement to &gt;1.33</div>
                      <div>• 40% reduction in customer complaints</div>
                      <div>• Achieve and maintain control chart stability</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <TrendingUp className="h-4 w-4" />
                    <strong>Complete the Cycle:</strong> Return to trend analysis after 3 months to measure improvement effectiveness
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