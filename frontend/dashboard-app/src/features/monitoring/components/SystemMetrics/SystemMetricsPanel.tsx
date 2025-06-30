import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Database, 
  Wifi, 
  Zap, 
  Clock,
  Users,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useSignalR } from '@/features/shared/hooks/useSignalR';
import { useSystemMetrics } from '@/features/shared/hooks/useSystemMetrics';
import { useTransactionStats } from '@/features/shared/hooks/useTransactions';

export function SystemMetricsPanel() {
  const { isConnected, connectionCount } = useSignalR();
  const { data: transactionStats } = useTransactionStats();
  const { 
    systemHealth, 
    protocolStatus, 
    uptime, 
    lastUpdated, 
    isRealData 
  } = useSystemMetrics(connectionCount);

  // Add icons to protocol status
  const protocolsWithIcons = protocolStatus.map(protocol => ({
    ...protocol,
    icon: protocol.name === 'REST API' ? Server :
          protocol.name === 'SignalR' ? Wifi :
          protocol.name === 'gRPC' ? Zap :
          protocol.name === 'Database' ? Database : Server
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return '?';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Overview
            {!isRealData && (
              <Badge variant="outline" className="text-xs">
                Simulated
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time monitoring of system components and performance
            {lastUpdated && (
              <span className="block text-xs mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {systemHealth.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <Badge className={getStatusColor(metric.status)}>
                    {getStatusIcon(metric.status)}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.description && (
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                )}
                {metric.name === 'Memory Usage' && (
                  <Progress value={metric.numericValue} className="h-2" />
                )}
                {metric.name === 'CPU Usage' && (
                  <Progress value={metric.numericValue} className="h-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Protocol Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Protocol Status
          </CardTitle>
          <CardDescription>
            Multi-protocol communication health and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {protocolsWithIcons.map((protocol) => (
              <div
                key={protocol.name}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                  <protocol.icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{protocol.name}</span>
                    <Badge className={getStatusColor(protocol.status)}>
                      {getStatusIcon(protocol.status)} {protocol.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="block">Latency</span>
                      <span className="font-medium text-foreground">{protocol.latency}</span>
                    </div>
                    <div>
                      <span className="block">Load</span>
                      <span className="font-medium text-foreground">{protocol.requests}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Statistics
          </CardTitle>
          <CardDescription>
            Real-time activity and usage metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{connectionCount}</div>
              <div className="text-sm text-muted-foreground">Active Connections</div>
              <div className="text-xs text-green-600 mt-1">
                SignalR WebSocket connections
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {transactionStats?.todayTransactions || 1247}
              </div>
              <div className="text-sm text-muted-foreground">Transactions Today</div>
              <div className="text-xs text-green-600 mt-1">
                +18% from yesterday
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{uptime}%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
              <div className="text-xs text-green-600 mt-1">
                Last 30 days
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Technology Integration Demo</CardTitle>
          <CardDescription>
            Real-time monitoring showcasing multi-protocol architecture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">REST API Monitoring</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• HTTP response times</li>
                  <li>• Request/response logging</li>
                  <li>• Error rate tracking</li>
                  <li>• Cache hit ratios</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">SignalR Real-time</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Live connection monitoring</li>
                  <li>• Message delivery tracking</li>
                  <li>• User presence detection</li>
                  <li>• Connection health checks</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">gRPC Performance</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Service method metrics</li>
                  <li>• Streaming performance</li>
                  <li>• Binary payload efficiency</li>
                  <li>• Health check integration</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Monitoring Strategy</h4>
              <p className="text-sm text-muted-foreground">
                This monitoring dashboard demonstrates how to track multiple communication protocols 
                in a unified interface. Each protocol provides specific metrics while maintaining 
                a consistent monitoring experience across the entire technology stack.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}