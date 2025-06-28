using Grpc.Core;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using ServiceBridge.Api.Grpc;
using ServiceBridge.Application.Queries;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Api.Services;

[Authorize(Policy = "Scanner")] // All gRPC product operations require at least Scanner role
public class ProductGrpcService : ProductService.ProductServiceBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ProductGrpcService> _logger;

    public ProductGrpcService(IMediator mediator, ILogger<ProductGrpcService> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public override async Task<ProductResponse> GetProduct(GetProductRequest request, ServerCallContext context)
    {
        try
        {
            _logger.LogDebug("gRPC GetProduct called for product code: {ProductCode}", request.ProductCode);

            var query = new GetProductQuery(request.ProductCode);
            var result = await _mediator.Send(query, context.CancellationToken);

            if (result == null)
            {
                throw new RpcException(new Status(StatusCode.NotFound, $"Product with code '{request.ProductCode}' not found"));
            }

            var response = new ProductResponse
            {
                ProductCode = result.ProductCode,
                Description = result.Description,
                QuantityOnHand = result.QuantityOnHand,
                AverageMonthlyConsumption = (double)result.AverageMonthlyConsumption,
                LeadTimeDays = result.LeadTimeDays,
                QuantityOnOrder = result.QuantityOnOrder,
                LastUpdated = result.LastUpdated.ToString("O"),
                LastUpdatedBy = result.LastUpdatedBy,
                DaysCoverRemaining = (double)result.DaysCoverRemaining,
                ReorderPoint = (double)result.ReorderPoint,
                StockStatus = (int)result.StockStatus
            };

            _logger.LogDebug("gRPC GetProduct successful for product code: {ProductCode}", request.ProductCode);
            return response;
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in gRPC GetProduct for product code: {ProductCode}", request.ProductCode);
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
    }

    public override async Task<GetProductsResponse> GetProducts(GetProductsRequest request, ServerCallContext context)
    {
        try
        {
            _logger.LogDebug("gRPC GetProducts called with filter: {Filter}, page: {Page}, pageSize: {PageSize}", 
                request.Filter, request.Page, request.PageSize);

            // Convert gRPC request to application query
            var query = new GetProductsQuery
            {
                SearchQuery = string.IsNullOrEmpty(request.Filter) ? null : request.Filter,
                PageNumber = request.Page > 0 ? request.Page : 1,
                PageSize = request.PageSize > 0 ? request.PageSize : 50
            };

            var result = await _mediator.Send(query, context.CancellationToken);

            var response = new GetProductsResponse
            {
                TotalCount = result.TotalCount
            };

            foreach (var product in result.Data)
            {
                response.Products.Add(new ProductResponse
                {
                    ProductCode = product.ProductCode,
                    Description = product.Description,
                    QuantityOnHand = product.QuantityOnHand,
                    AverageMonthlyConsumption = (double)product.AverageMonthlyConsumption,
                    LeadTimeDays = product.LeadTimeDays,
                    QuantityOnOrder = product.QuantityOnOrder,
                    LastUpdated = product.LastUpdated.ToString("O"),
                    LastUpdatedBy = product.LastUpdatedBy,
                    DaysCoverRemaining = (double)product.DaysCoverRemaining,
                    ReorderPoint = (double)product.ReorderPoint,
                    StockStatus = (int)product.StockStatus
                });
            }

            _logger.LogDebug("gRPC GetProducts successful, returned {Count} products", response.Products.Count);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in gRPC GetProducts");
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
    }
}