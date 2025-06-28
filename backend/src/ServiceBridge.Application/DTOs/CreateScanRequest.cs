using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Application.DTOs;

public class CreateScanRequest
{
    public string ProductCode { get; set; } = string.Empty;
    public int QuantityScanned { get; set; }
    public TransactionType TransactionType { get; set; } = TransactionType.StockCount;
    public string? Notes { get; set; }
    public string ScannedBy { get; set; } = string.Empty;
}