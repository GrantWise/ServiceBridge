using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Application.DTOs;

public class ScanProcessedNotification
{
    public string TransactionId { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductDescription { get; set; } = string.Empty;
    public TransactionType TransactionType { get; set; }
    public int QuantityScanned { get; set; }
    public int NewQuantityOnHand { get; set; }
    public int PreviousQuantityOnHand { get; set; }
    public string ScannedBy { get; set; } = string.Empty;
    public DateTime ScanTimestamp { get; set; }
    public string? Notes { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}