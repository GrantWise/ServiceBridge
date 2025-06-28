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
}