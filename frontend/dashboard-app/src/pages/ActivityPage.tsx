import { ActivityFeed } from '@/features/monitoring/components/ActivityFeed/ActivityFeed';
import { SystemMetricsPanel } from '@/features/monitoring/components/SystemMetrics/SystemMetricsPanel';
import { useSignalR } from '@/features/shared/hooks/useSignalR';
import { useLiveMetrics } from '@/features/shared/hooks/useLiveMetrics';
import { useProtocolStatus } from '@/features/shared/hooks/useProtocolStatus';

export function ActivityPage() {
  const { isConnected, connectionCount } = useSignalR();
  const { todaysScans, systemStatus, formattedUptime, statusText, statusColor, lastUpdated } = useLiveMetrics();
  const { protocols, isRealData, getStatusColor, getStatusTextColor } = useProtocolStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Activity</h1>
        <p className="text-muted-foreground">
          Real-time monitoring and activity tracking across all system components.
          Watch the metrics update live as inventory operations occur.
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Quick Stats</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <span className="font-medium">{connectionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Today's Scans</span>
                  <span className="font-medium">{todaysScans.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">System Status</span>
                  <span className={`font-medium ${statusColor}`}>{statusText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="font-medium">{formattedUptime}</span>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Protocol Status</h3>
                {!isRealData && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                    Fallback
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">REST API</span>
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(protocols.restApi.status)}`} />
                    <span className={`text-xs ${getStatusTextColor(protocols.restApi.status)}`}>
                      {protocols.restApi.status}
                      {protocols.restApi.latency > 0 && ` (${protocols.restApi.latency}ms)`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SignalR</span>
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(protocols.signalR.status)}`} />
                    <span className={`text-xs ${getStatusTextColor(protocols.signalR.status)}`}>
                      {protocols.signalR.status}
                      {protocols.signalR.latency > 0 && ` (${protocols.signalR.latency}ms)`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">gRPC</span>
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(protocols.grpc.status)}`} />
                    <span className={`text-xs ${getStatusTextColor(protocols.grpc.status)}`}>
                      {protocols.grpc.status}
                      {protocols.grpc.latency > 0 && ` (${protocols.grpc.latency}ms)`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(protocols.database.status)}`} />
                    <span className={`text-xs ${getStatusTextColor(protocols.database.status)}`}>
                      {protocols.database.status}
                      {protocols.database.latency > 0 && ` (${protocols.database.latency}ms)`}
                    </span>
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