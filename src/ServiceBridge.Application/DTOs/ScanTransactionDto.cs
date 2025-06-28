using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Application.DTOs;

public class ScanTransactionDto
{
    public int Id { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public int QuantityScanned { get; set; }
    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public DateTime ScanDateTime { get; set; }
    public string ScannedBy { get; set; } = string.Empty;
    public TransactionType TransactionType { get; set; }
    public string? Notes { get; set; }
    
    // Optional product details for display
    public string? ProductDescription { get; set; }
}