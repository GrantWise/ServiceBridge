using System.ComponentModel.DataAnnotations;

namespace ServiceBridge.Domain.Entities;

public class ScanTransaction
{
    [Key]
    public int Id { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public int QuantityScanned { get; set; }
    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public DateTime ScanDateTime { get; set; }
    public string ScannedBy { get; set; } = string.Empty;
    public TransactionType TransactionType { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
}
