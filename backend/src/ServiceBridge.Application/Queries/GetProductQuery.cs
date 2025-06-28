using MediatR;
using ServiceBridge.Application.DTOs;

namespace ServiceBridge.Application.Queries;

public record GetProductQuery(string ProductCode) : IRequest<ProductDto?>;