using AutoMapper;
using MediatR;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Services;
using ServiceBridge.Domain.Interfaces;

namespace ServiceBridge.Application.Commands;

public class BulkUpdateProductsCommandHandler : IRequestHandler<BulkUpdateProductsCommand, BulkUpdateResponse>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public BulkUpdateProductsCommandHandler(
        IProductRepository productRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        INotificationService notificationService)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    public async Task<BulkUpdateResponse> Handle(BulkUpdateProductsCommand request, CancellationToken cancellationToken)
    {
        var response = new BulkUpdateResponse
        {
            TotalRequested = request.Products.Count
        };

        if (!request.Products.Any())
        {
            response.Success = true;
            response.Message = "No products provided for update.";
            return response;
        }

        var results = new List<BulkUpdateResult>();

        try
        {
            // Process each product update
            foreach (var productRequest in request.Products)
            {
                var result = await ProcessSingleProductUpdate(productRequest, request.UpdatedBy, cancellationToken);
                results.Add(result);
                
                if (result.Success)
                {
                    response.SuccessfulUpdates++;
                }
                else
                {
                    response.FailedUpdates++;
                }
            }

            // Save all changes in a single transaction
            if (response.SuccessfulUpdates > 0)
            {
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                
                // Send notifications for successfully updated products
                await SendNotificationsAsync(results.Where(r => r.Success && r.UpdatedProduct != null).ToList());
            }

            response.Results = results;
            response.Success = response.FailedUpdates == 0;
            response.Message = response.Success 
                ? $"All {response.SuccessfulUpdates} products updated successfully."
                : $"{response.SuccessfulUpdates} products updated successfully, {response.FailedUpdates} failed.";

            return response;
        }
        catch (Exception ex)
        {
            // If transaction fails, all updates are rolled back
            return new BulkUpdateResponse
            {
                Success = false,
                Message = $"Bulk update failed: {ex.Message}",
                TotalRequested = request.Products.Count,
                SuccessfulUpdates = 0,
                FailedUpdates = request.Products.Count,
                Results = request.Products.Select(p => new BulkUpdateResult
                {
                    ProductCode = p.ProductCode,
                    Success = false,
                    Message = "Transaction rolled back due to bulk operation failure."
                }).ToList()
            };
        }
    }

    private async Task<BulkUpdateResult> ProcessSingleProductUpdate(
        UpdateProductRequest request, 
        string updatedBy, 
        CancellationToken cancellationToken)
    {
        try
        {
            // Get the product
            var product = await _productRepository.GetByProductCodeAsync(request.ProductCode, cancellationToken);
            if (product == null)
            {
                return new BulkUpdateResult
                {
                    ProductCode = request.ProductCode,
                    Success = false,
                    Message = $"Product with code '{request.ProductCode}' not found."
                };
            }

            // Validate the request
            var validationErrors = ValidateUpdateRequest(request);
            if (validationErrors.Any())
            {
                return new BulkUpdateResult
                {
                    ProductCode = request.ProductCode,
                    Success = false,
                    Message = "Validation failed.",
                    ValidationErrors = validationErrors
                };
            }

            // Update only the provided fields (partial update)
            var hasChanges = false;

            if (!string.IsNullOrWhiteSpace(request.Description) && request.Description != product.Description)
            {
                product.Description = request.Description;
                hasChanges = true;
            }

            if (request.QuantityOnHand.HasValue && request.QuantityOnHand.Value != product.QuantityOnHand)
            {
                product.QuantityOnHand = request.QuantityOnHand.Value;
                hasChanges = true;
            }

            if (request.AverageMonthlyConsumption.HasValue && request.AverageMonthlyConsumption.Value != product.AverageMonthlyConsumption)
            {
                product.AverageMonthlyConsumption = request.AverageMonthlyConsumption.Value;
                hasChanges = true;
            }

            if (request.LeadTimeDays.HasValue && request.LeadTimeDays.Value != product.LeadTimeDays)
            {
                product.LeadTimeDays = request.LeadTimeDays.Value;
                hasChanges = true;
            }

            if (request.QuantityOnOrder.HasValue && request.QuantityOnOrder.Value != product.QuantityOnOrder)
            {
                product.QuantityOnOrder = request.QuantityOnOrder.Value;
                hasChanges = true;
            }

            if (!hasChanges)
            {
                return new BulkUpdateResult
                {
                    ProductCode = request.ProductCode,
                    Success = true,
                    Message = "No changes detected.",
                    UpdatedProduct = _mapper.Map<ProductDto>(product)
                };
            }

            // Update audit fields
            product.LastUpdated = DateTime.UtcNow;
            product.LastUpdatedBy = !string.IsNullOrWhiteSpace(request.UpdatedBy) ? request.UpdatedBy : updatedBy;

            // Mark for update (actual save happens in the main handler)
            _productRepository.Update(product);

            // Return success result
            return new BulkUpdateResult
            {
                ProductCode = request.ProductCode,
                Success = true,
                Message = "Product updated successfully.",
                UpdatedProduct = _mapper.Map<ProductDto>(product)
            };
        }
        catch (Exception ex)
        {
            return new BulkUpdateResult
            {
                ProductCode = request.ProductCode,
                Success = false,
                Message = $"Error updating product: {ex.Message}"
            };
        }
    }

    private static List<string> ValidateUpdateRequest(UpdateProductRequest request)
    {
        var errors = new List<string>();

        // Validate product code is provided
        if (string.IsNullOrWhiteSpace(request.ProductCode))
        {
            errors.Add("Product code is required.");
        }

        // Validate quantity on hand (cannot be negative)
        if (request.QuantityOnHand.HasValue && request.QuantityOnHand.Value < 0)
        {
            errors.Add("Quantity on hand cannot be negative.");
        }

        // Validate average monthly consumption (cannot be negative)
        if (request.AverageMonthlyConsumption.HasValue && request.AverageMonthlyConsumption.Value < 0)
        {
            errors.Add("Average monthly consumption cannot be negative.");
        }

        // Validate lead time days (must be between 1 and 365)
        if (request.LeadTimeDays.HasValue && (request.LeadTimeDays.Value < 1 || request.LeadTimeDays.Value > 365))
        {
            errors.Add("Lead time days must be between 1 and 365.");
        }

        // Validate quantity on order (cannot be negative)
        if (request.QuantityOnOrder.HasValue && request.QuantityOnOrder.Value < 0)
        {
            errors.Add("Quantity on order cannot be negative.");
        }

        // Validate description (not empty if provided)
        if (request.Description != null && string.IsNullOrWhiteSpace(request.Description))
        {
            errors.Add("Description cannot be empty if provided.");
        }

        return errors;
    }

    private async Task SendNotificationsAsync(List<BulkUpdateResult> successfulResults)
    {
        try
        {
            // Send notifications for all successfully updated products
            foreach (var result in successfulResults)
            {
                if (result.UpdatedProduct != null)
                {
                    await _notificationService.SendProductUpdatedAsync(result.UpdatedProduct);
                }
            }
        }
        catch (Exception ex)
        {
            // Log notification failures but don't fail the command
            // Notifications are not critical to the business operation
            System.Diagnostics.Debug.WriteLine($"Failed to send bulk update notifications: {ex.Message}");
        }
    }
}