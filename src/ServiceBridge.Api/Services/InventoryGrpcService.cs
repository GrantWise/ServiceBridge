using Grpc.Core;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using ServiceBridge.Api.Grpc;
using ServiceBridge.Application.Commands;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Api.Services;

[Authorize(Policy = "Scanner")] // All gRPC inventory operations require at least Scanner role
public class InventoryGrpcService : InventoryService.InventoryServiceBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<InventoryGrpcService> _logger;

    public InventoryGrpcService(IMediator mediator, ILogger<InventoryGrpcService> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public override async Task<ProcessScanResponse> ProcessScan(ProcessScanRequest request, ServerCallContext context)
    {
        try
        {
            _logger.LogDebug("gRPC ProcessScan called for product code: {ProductCode}", request.ProductCode);

            // Convert gRPC transaction type to domain enum
            var transactionType = request.TransactionType switch
            {
                0 => TransactionType.StockCount,
                1 => TransactionType.Adjustment,
                2 => TransactionType.Receiving,
                _ => throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid transaction type"))
            };

            var command = new ProcessScanCommand(
                request.ProductCode,
                request.QuantityScanned,
                transactionType,
                request.ScannedBy,
                string.IsNullOrEmpty(request.Notes) ? null : request.Notes
            );

            var result = await _mediator.Send(command, context.CancellationToken);

            var response = new ProcessScanResponse
            {
                Success = result.Success,
                Message = result.Message,
                TransactionId = result.TransactionId.ToString(),
                PreviousQuantity = result.PreviousQuantity,
                NewQuantity = result.NewQuantity,
                ScanDateTime = result.ScanDateTime.ToString("O")
            };

            _logger.LogDebug("gRPC ProcessScan completed for product code: {ProductCode}, success: {Success}", 
                request.ProductCode, result.Success);

            return response;
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in gRPC ProcessScan for product code: {ProductCode}", request.ProductCode);
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
    }

    [Authorize(Policy = "Manager")] // Only Managers and Admins can update products via gRPC
    public override async Task<UpdateProductResponse> UpdateProduct(UpdateProductRequest request, ServerCallContext context)
    {
        try
        {
            _logger.LogDebug("gRPC UpdateProduct called for product code: {ProductCode}", request.ProductCode);

            var command = new UpdateProductCommand(
                request.ProductCode,
                request.Description,  // proto3 optional fields are handled automatically
                request.QuantityOnHand,
                (decimal?)request.AverageMonthlyConsumption,
                request.LeadTimeDays,
                request.QuantityOnOrder,
                request.UpdatedBy
            );

            var result = await _mediator.Send(command, context.CancellationToken);

            var response = new UpdateProductResponse
            {
                Success = result.Success,
                Message = result.Message
            };

            if (result.Success && result.UpdatedProduct != null)
            {
                response.UpdatedProduct = new InventoryProductResponse
                {
                    ProductCode = result.UpdatedProduct.ProductCode,
                    Description = result.UpdatedProduct.Description,
                    QuantityOnHand = result.UpdatedProduct.QuantityOnHand,
                    AverageMonthlyConsumption = (double)result.UpdatedProduct.AverageMonthlyConsumption,
                    LeadTimeDays = result.UpdatedProduct.LeadTimeDays,
                    QuantityOnOrder = result.UpdatedProduct.QuantityOnOrder,
                    LastUpdated = result.UpdatedProduct.LastUpdated.ToString("O"),
                    LastUpdatedBy = result.UpdatedProduct.LastUpdatedBy,
                    DaysCoverRemaining = (double)result.UpdatedProduct.DaysCoverRemaining,
                    ReorderPoint = (double)result.UpdatedProduct.ReorderPoint,
                    StockStatus = (int)result.UpdatedProduct.StockStatus
                };
            }

            _logger.LogDebug("gRPC UpdateProduct completed for product code: {ProductCode}, success: {Success}", 
                request.ProductCode, result.Success);

            return response;
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in gRPC UpdateProduct for product code: {ProductCode}", request.ProductCode);
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
    }

    [Authorize(Policy = "Manager")] // Only Managers and Admins can perform bulk updates via gRPC
    public override async Task<BulkUpdateResponse> UpdateProducts(BulkUpdateRequest request, ServerCallContext context)
    {
        try
        {
            _logger.LogDebug("gRPC UpdateProducts called with {Count} products", request.Updates.Count);

            var updateRequests = request.Updates.Select(u => new Application.DTOs.UpdateProductRequest
            {
                ProductCode = u.ProductCode,
                Description = u.Description,
                QuantityOnHand = u.QuantityOnHand,
                AverageMonthlyConsumption = (decimal?)u.AverageMonthlyConsumption,
                LeadTimeDays = u.LeadTimeDays,
                UpdatedBy = request.UpdatedBy
            }).ToList();

            var command = new BulkUpdateProductsCommand(updateRequests, request.UpdatedBy);
            var result = await _mediator.Send(command, context.CancellationToken);

            var response = new BulkUpdateResponse
            {
                UpdatedCount = result.SuccessfulUpdates,
            };

            foreach (var bulkResult in result.Results.Where(r => !r.Success))
            {
                response.Errors.Add($"{bulkResult.ProductCode}: {bulkResult.Message}");
            }

            _logger.LogDebug("gRPC UpdateProducts completed, updated: {Updated}, errors: {Errors}", 
                result.SuccessfulUpdates, result.Results.Count(r => !r.Success));

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in gRPC UpdateProducts");
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
    }

    public override async Task<BulkScanResponse> ProcessBulkScan(BulkScanRequest request, ServerCallContext context)
    {
        try
        {
            _logger.LogDebug("gRPC ProcessBulkScan called with {Count} scans", request.Scans.Count);

            var response = new BulkScanResponse();
            int processedCount = 0;

            foreach (var scanItem in request.Scans)
            {
                try
                {
                    // For bulk scan, we'll assume StockCount transaction type for simplicity
                    var command = new ProcessScanCommand(
                        scanItem.ProductCode,
                        scanItem.Quantity,
                        TransactionType.StockCount,
                        request.ScannedBy,
                        string.IsNullOrEmpty(scanItem.Notes) ? null : scanItem.Notes
                    );

                    var result = await _mediator.Send(command, context.CancellationToken);

                    if (result.Success)
                    {
                        processedCount++;
                    }
                    else
                    {
                        response.Errors.Add($"Product {scanItem.ProductCode}: {result.Message}");
                    }
                }
                catch (Exception ex)
                {
                    response.Errors.Add($"Product {scanItem.ProductCode}: {ex.Message}");
                }
            }

            response.ProcessedCount = processedCount;

            _logger.LogDebug("gRPC ProcessBulkScan completed, processed: {Processed}, errors: {Errors}", 
                processedCount, response.Errors.Count);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in gRPC ProcessBulkScan");
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
    }
}