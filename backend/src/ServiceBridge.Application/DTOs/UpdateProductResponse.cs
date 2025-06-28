namespace ServiceBridge.Application.DTOs;

public class UpdateProductResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public ProductDto? UpdatedProduct { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
}