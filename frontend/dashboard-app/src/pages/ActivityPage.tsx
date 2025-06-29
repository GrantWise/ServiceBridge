import { ActivityFeed } from '@/features/monitoring/components/ActivityFeed/ActivityFeed';
import { SystemMetricsPanel } from '@/features/monitoring/components/SystemMetrics/SystemMetricsPanel';
import { useSignalR } from '@/features/shared/hooks/useSignalR';

export function ActivityPage() {
  const { isConnected, connectionCount } = useSignalR();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Activity</h1>
        <p className="text-muted-foreground">
          Real-time monitoring and activity tracking across all system components
        </p>
        {isConnected && (
          <p className="text-sm text-green-600 mt-1">
            ✓ Live monitoring active • {connectionCount} connected users
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Feed - Takes up 2/3 on large screens */}
        <div className="lg:col-span-2">
          <ActivityFeed 
            maxItems={100}
            showFilters={true}
            autoRefresh={true}
          />
        </div>
        
        {/* Quick Stats Panel */}
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="rounded-lg border p-4 bg-card">
              <h3 className="font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <span className="font-medium">{connectionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Today's Scans</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">System Status</span>
                  <span className="font-medium text-green-600">Healthy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="font-medium">99.8%</span>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border p-4 bg-card">
              <h3 className="font-semibold mb-3">Protocol Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">REST API</span>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SignalR</span>
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">gRPC</span>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                    <span className="text-xs text-yellow-600">Fallback</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics Panel */}
      <SystemMetricsPanel />

      {/* Real-time Demo Info */}
      <div className="rounded-lg border p-6 bg-card">
        <h3 className="font-semibold mb-4">🔴 Live Monitoring Demo</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Real-time Activity Tracking</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Live transaction monitoring via SignalR</li>
              <li>• User connection/disconnection events</li>
              <li>• Product update notifications</li>
              <li>• System health status changes</li>
              <li>• Automatic activity feed updates</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Multi-Protocol Monitoring</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• REST API performance metrics</li>
              <li>• SignalR connection health tracking</li>
              <li>• gRPC service availability monitoring</li>
              <li>• Cross-protocol error correlation</li>
              <li>• Unified logging and alerting</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Try it:</strong> Open multiple browser tabs of this dashboard to see real-time 
            user connection events. Any inventory changes will appear instantly across all connected clients 
            demonstrating the power of SignalR real-time communication.
          </p>
        </div>
      </div>
    </div>
  );
}