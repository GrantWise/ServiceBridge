using MediatR;
using ServiceBridge.Application.DTOs;

namespace ServiceBridge.Application.Commands;

public record UpdateProductCommand(
    string ProductCode,
    string? Description = null,
    int? QuantityOnHand = null,
    decimal? AverageMonthlyConsumption = null,
    int? LeadTimeDays = null,
    int? QuantityOnOrder = null,
    string UpdatedBy = "System"
) : IRequest<UpdateProductResponse>;