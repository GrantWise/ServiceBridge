import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Database, Users, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardMetrics } from '@/features/shared/hooks/useDashboardMetrics';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    totalProducts,
    lowStockItems,
    activeUsers,
    dailyScans,
    productCountChange,
    lowStockChange,
    activeUsersChange,
    dailyScansChange,
    isLoading,
    lastUpdated
  } = useDashboardMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to ServiceBridge - Multi-protocol inventory management platform
        </p>
        {!isLoading && (
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalProducts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {productCountChange} from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{lowStockItems}</div>
                <p className="text-xs text-muted-foreground">
                  {lowStockChange} from yesterday
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {activeUsersChange}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{dailyScans.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {dailyScansChange} from yesterday
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Technology Demonstration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Technology Stack Demonstration
            </CardTitle>
            <CardDescription>
              Multi-protocol communication showcase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">REST API</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Standard CRUD operations for products and user management
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">gRPC Services</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <p className="text-xs text-muted-foreground">
                High-performance business calculations and bulk operations
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SignalR Hub</span>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time inventory updates and live notifications
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common dashboard operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button 
              onClick={() => navigate('/inventory')}
              className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="font-medium">View Inventory Grid</div>
              <div className="text-sm text-muted-foreground">
                Real-time inventory management with inline editing
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/analytics')}
              className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="font-medium">Analytics Dashboard</div>
              <div className="text-sm text-muted-foreground">
                Business intelligence and predictive analytics
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/activity')}
              className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="font-medium">System Monitoring</div>
              <div className="text-sm text-muted-foreground">
                Real-time system health and performance metrics
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Development Status */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Implementation Complete</CardTitle>
          <CardDescription>
            Multi-protocol dashboard demonstrating modern enterprise architecture patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Phase 1 - Authentication</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• JWT Authentication & Authorization</li>
                <li>• Role-based Access Control</li>
                <li>• Dashboard Layout & Navigation</li>
                <li>• Theme Support & Responsive Design</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Phase 2 - Multi-Protocol</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• REST API Integration with TanStack Query</li>
                <li>• SignalR Real-time Communication</li>
                <li>• gRPC Service Integration</li>
                <li>• Cross-protocol Error Handling</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Phase 3 - Dashboard Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time Inventory Grid</li>
                <li>• Business Intelligence Analytics</li>
                <li>• Live Activity Monitoring</li>
                <li>• System Performance Metrics</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>🎉 Ready for Exploration!</strong> All phases have been completed! 
              Navigate to <strong>Inventory</strong>, <strong>Analytics</strong>, <strong>Advanced Analytics</strong>, 
              <strong>Reports</strong>, <strong>Activity</strong>, or <strong>Users</strong> (Admin only) 
              to see the comprehensive multi-protocol enterprise platform in action.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}