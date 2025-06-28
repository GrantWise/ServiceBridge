namespace ServiceBridge.Application.DTOs;

public class BulkUpdateRequest
{
    public List<UpdateProductRequest> Products { get; set; } = new();
    public string UpdatedBy { get; set; } = string.Empty;
}

public class BulkUpdateResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TotalRequested { get; set; }
    public int SuccessfulUpdates { get; set; }
    public int FailedUpdates { get; set; }
    public List<BulkUpdateResult> Results { get; set; } = new();
}

public class BulkUpdateResult
{
    public string ProductCode { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public ProductDto? UpdatedProduct { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
}