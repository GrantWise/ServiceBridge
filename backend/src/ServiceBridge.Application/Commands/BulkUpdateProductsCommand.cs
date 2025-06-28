using MediatR;
using ServiceBridge.Application.DTOs;

namespace ServiceBridge.Application.Commands;

public record BulkUpdateProductsCommand(
    List<UpdateProductRequest> Products,
    string UpdatedBy = "System"
) : IRequest<BulkUpdateResponse>;