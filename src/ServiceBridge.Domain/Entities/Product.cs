using System.ComponentModel.DataAnnotations;

namespace ServiceBridge.Domain.Entities;

public class Product
{
    [Key]
    public string ProductCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public decimal AverageMonthlyConsumption { get; set; }
    public int LeadTimeDays { get; set; }
    public int QuantityOnOrder { get; set; }
    public DateTime LastUpdated { get; set; }
    public string LastUpdatedBy { get; set; } = string.Empty;

    // Calculated properties
    public decimal DaysCoverRemaining => 
        AverageMonthlyConsumption > 0 ? QuantityOnHand / (AverageMonthlyConsumption / 30) : 0;
    
    public decimal ReorderPoint => 
        AverageMonthlyConsumption > 0 ? (AverageMonthlyConsumption / 30) * LeadTimeDays : 0;
    
    public StockStatus StockStatus => DaysCoverRemaining switch
    {
        < 7 => StockStatus.Low,
        > 60 => StockStatus.Overstocked,
        _ => StockStatus.Adequate
    };

    // Navigation properties
    public virtual ICollection<ScanTransaction> ScanTransactions { get; set; } = new List<ScanTransaction>();
}
