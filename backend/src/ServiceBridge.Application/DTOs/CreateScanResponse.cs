namespace ServiceBridge.Application.DTOs;

public class CreateScanResponse
{
    public int TransactionId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public int QuantityScanned { get; set; }
    public DateTime ScanDateTime { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool Success { get; set; }
    
    // Updated product information
    public ProductDto? UpdatedProduct { get; set; }
}