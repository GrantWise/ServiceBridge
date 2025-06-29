import { KPIGrid } from '@/features/analytics/components/KPIWidgets/KPIGrid';
import { TrendChart } from '@/features/analytics/components/Charts/TrendChart';
import { StockDistribution } from '@/features/analytics/components/Charts/StockDistribution';
import { useSignalR } from '@/features/shared/hooks/useSignalR';
import { useGrpcHealth } from '@/features/shared/hooks/useGrpc';

export function AnalyticsPage() {
  const { isConnected } = useSignalR();
  const { data: grpcHealth } = useGrpcHealth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Intelligence</h1>
        <p className="text-muted-foreground">
          Real-time analytics and predictive insights powered by multi-protocol integration
        </p>
        <div className="flex gap-4 mt-2 text-sm">
          <span className={`flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            SignalR: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className={`flex items-center gap-1 ${grpcHealth?.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`}>
            <div className={`h-2 w-2 rounded-full ${grpcHealth?.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            gRPC: {grpcHealth?.status || 'Checking...'}
          </span>
        </div>
      </div>

      {/* KPI Dashboard */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Key Performance Indicators</h2>
        <KPIGrid />
      </section>

      {/* Charts and Analytics */}
      <section className="grid gap-6 md:grid-cols-2">
        <TrendChart
          title="Inventory Trends"
          description="Historical view of key inventory metrics"
        />
        
        <StockDistribution />
      </section>

      {/* Protocol Integration Demo */}
      <section>
        <div className="rounded-lg border p-6 bg-card">
          <h3 className="font-semibold mb-4">🚀 Multi-Protocol Analytics Integration</h3>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                REST API Analytics
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Product data aggregation</li>
                <li>• Historical trend analysis</li>
                <li>• Filter and search operations</li>
                <li>• Report generation endpoints</li>
              </ul>
              <div className="text-xs bg-blue-50 p-2 rounded">
                <strong>Best for:</strong> Standard reporting, data exports, cached analytics
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                gRPC Business Logic
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Complex KPI calculations</li>
                <li>• Predictive analytics algorithms</li>
                <li>• Bulk data processing</li>
                <li>• High-performance computations</li>
              </ul>
              <div className="text-xs bg-green-50 p-2 rounded">
                <strong>Best for:</strong> CPU-intensive analytics, real-time calculations, streaming data
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <div className="h-2 w-2 bg-purple-500 rounded-full" />
                SignalR Live Updates
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Real-time KPI updates</li>
                <li>• Live chart data streaming</li>
                <li>• Alert notifications</li>
                <li>• Collaborative dashboards</li>
              </ul>
              <div className="text-xs bg-purple-50 p-2 rounded">
                <strong>Best for:</strong> Live dashboards, instant notifications, collaborative analytics
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Smart Protocol Selection</h4>
            <p className="text-sm text-muted-foreground">
              This dashboard automatically selects the optimal communication protocol based on the data operation:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• <strong>Initial data load:</strong> REST API for fast, cacheable responses</li>
              <li>• <strong>Complex calculations:</strong> gRPC for high-performance processing</li>
              <li>• <strong>Live updates:</strong> SignalR for real-time synchronization</li>
              <li>• <strong>Fallback strategy:</strong> Graceful degradation when services are unavailable</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}