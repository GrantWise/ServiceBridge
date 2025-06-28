using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Application.DTOs;

public class ProductDto
{
    public string ProductCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public decimal AverageMonthlyConsumption { get; set; }
    public int LeadTimeDays { get; set; }
    public int QuantityOnOrder { get; set; }
    public DateTime LastUpdated { get; set; }
    public string LastUpdatedBy { get; set; } = string.Empty;
    
    // Calculated properties
    public decimal DaysCoverRemaining { get; set; }
    public decimal ReorderPoint { get; set; }
    public StockStatus StockStatus { get; set; }
}