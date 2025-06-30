using AutoMapper;
using MediatR;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Services;
using ServiceBridge.Domain.Interfaces;

namespace ServiceBridge.Application.Commands;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, UpdateProductResponse>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public UpdateProductCommandHandler(
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

    public async Task<UpdateProductResponse> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        // Get the product
        var product = await _productRepository.GetByProductCodeAsync(request.ProductCode, cancellationToken);
        if (product == null)
        {
            return new UpdateProductResponse
            {
                Success = false,
                Message = $"Product with code '{request.ProductCode}' not found."
            };
        }

        // Validate the request (basic validation)
        var validationErrors = ValidateUpdateRequest(request);
        if (validationErrors.Any())
        {
            return new UpdateProductResponse
            {
                Success = false,
                Message = "Validation failed.",
                ValidationErrors = validationErrors
            };
        }

        try
        {
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
                return new UpdateProductResponse
                {
                    Success = true,
                    Message = "No changes detected.",
                    UpdatedProduct = _mapper.Map<ProductDto>(product)
                };
            }

            // Update audit fields
            product.LastUpdated = DateTime.UtcNow;
            product.LastUpdatedBy = request.UpdatedBy;

            // Save changes
            _productRepository.Update(product);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Return updated product
            var updatedProductDto = _mapper.Map<ProductDto>(product);

            // Send real-time notifications
            await SendNotificationsAsync(updatedProductDto);

            return new UpdateProductResponse
            {
                Success = true,
                Message = "Product updated successfully.",
                UpdatedProduct = updatedProductDto
            };
        }
        catch (Exception ex)
        {
            return new UpdateProductResponse
            {
                Success = false,
                Message = $"Error updating product: {ex.Message}"
            };
        }
    }

    private static List<string> ValidateUpdateRequest(UpdateProductCommand request)
    {
        var errors = new List<string>();

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

    private async Task SendNotificationsAsync(ProductDto updatedProduct)
    {
        try
        {
            // Send product updated notification
            await _notificationService.SendProductUpdatedAsync(updatedProduct);
        }
        catch (Exception ex)
        {
            // Log notification failures but don't fail the command
            // Notifications are not critical to the business operation
            System.Diagnostics.Debug.WriteLine($"Failed to send notifications: {ex.Message}");
        }
    }
}