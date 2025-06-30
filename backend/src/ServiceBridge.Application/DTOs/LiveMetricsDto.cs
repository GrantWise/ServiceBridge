namespace ServiceBridge.Application.DTOs;

public class LiveMetricsDto
{
    public int TotalProducts { get; set; }
    public int LowStockProducts { get; set; }
    public int OverstockedProducts { get; set; }
    public int RequireReorderProducts { get; set; }
    public int TotalTransactionsToday { get; set; }
    public int ActiveConnections { get; set; }
    public DateTime LastUpdated { get; set; }
    public decimal TotalInventoryValue { get; set; }
    public int ProductsScannedLastHour { get; set; }
    public string SystemStatus { get; set; } = "Healthy";
    
    // Enhanced system health metrics
    public double SystemUptime { get; set; } = 99.8;
    public int ApiResponseTimeMs { get; set; } = 50;
    public int DatabaseResponseTimeMs { get; set; } = 25;
    public int SignalRConnections { get; set; } = 0;
    public int ErrorsLastHour { get; set; } = 0;
    public double CpuUsagePercent { get; set; } = 15.5;
    public double MemoryUsagePercent { get; set; } = 45.2;
    public int PendingBackgroundJobs { get; set; } = 0;
}