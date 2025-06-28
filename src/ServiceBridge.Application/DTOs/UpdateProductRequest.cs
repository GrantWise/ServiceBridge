namespace ServiceBridge.Application.DTOs;

public class UpdateProductRequest
{
    public string ProductCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? QuantityOnHand { get; set; }
    public decimal? AverageMonthlyConsumption { get; set; }
    public int? LeadTimeDays { get; set; }
    public int? QuantityOnOrder { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
}