using MediatR;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Application.Queries;

public class GetProductsQuery : PaginationRequest, IRequest<PaginatedResponse<ProductDto>>
{
    public StockStatus? StockStatusFilter { get; set; }
    public bool? RequiresReorder { get; set; }
    public bool? LowStockOnly { get; set; }
    public bool? OverstockedOnly { get; set; }
}