using FluentValidation;
using ServiceBridge.Application.Commands;
using ServiceBridge.Application.DTOs;

namespace ServiceBridge.Application.Validators;

public class BulkUpdateProductsCommandValidator : AbstractValidator<BulkUpdateProductsCommand>
{
    public BulkUpdateProductsCommandValidator()
    {
        // Updated By validation
        RuleFor(x => x.UpdatedBy)
            .NotEmpty()
            .WithMessage("Updated by is required for bulk operations.")
            .MaximumLength(100)
            .WithMessage("Updated by must not exceed 100 characters.");

        // Products collection validation
        RuleFor(x => x.Products)
            .NotNull()
            .WithMessage("Products list cannot be null.")
            .NotEmpty()
            .WithMessage("At least one product must be provided for bulk update.")
            .Must(HaveReasonableCount)
            .WithMessage("Bulk update cannot exceed 100 products at once.")
            .Must(HaveUniqueProductCodes)
            .WithMessage("Product codes must be unique within the bulk update request.");

        // Individual product validation
        RuleForEach(x => x.Products)
            .SetValidator(new UpdateProductRequestValidator());
    }

    private static bool HaveReasonableCount(List<UpdateProductRequest> products)
    {
        return products.Count <= 100; // Reasonable limit for bulk operations
    }

    private static bool HaveUniqueProductCodes(List<UpdateProductRequest> products)
    {
        var productCodes = products.Select(p => p.ProductCode?.ToUpper()).ToList();
        return productCodes.Count == productCodes.Distinct().Count();
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        // Product Code validation
        RuleFor(x => x.ProductCode)
            .NotEmpty()
            .WithMessage("Product code is required.")
            .Matches(@"^[A-Z]{3}\d{3}$")
            .WithMessage("Product code must follow format ABC123 (3 letters followed by 3 digits).")
            .Length(6)
            .WithMessage("Product code must be exactly 6 characters.");

        // Description validation (when provided)
        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description cannot be empty when provided.")
            .MaximumLength(200)
            .WithMessage("Description must not exceed 200 characters.")
            .When(x => x.Description != null);

        // Quantity On Hand validation (when provided)
        RuleFor(x => x.QuantityOnHand)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Quantity on hand cannot be negative.")
            .LessThanOrEqualTo(1000000)
            .WithMessage("Quantity on hand cannot exceed 1,000,000 units.")
            .When(x => x.QuantityOnHand.HasValue);

        // Average Monthly Consumption validation (when provided)
        RuleFor(x => x.AverageMonthlyConsumption)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Average monthly consumption cannot be negative.")
            .LessThanOrEqualTo(100000)
            .WithMessage("Average monthly consumption cannot exceed 100,000 units.")
            .When(x => x.AverageMonthlyConsumption.HasValue);

        // Lead Time Days validation (when provided)
        RuleFor(x => x.LeadTimeDays)
            .InclusiveBetween(1, 365)
            .WithMessage("Lead time days must be between 1 and 365 days.")
            .When(x => x.LeadTimeDays.HasValue);

        // Quantity On Order validation (when provided)
        RuleFor(x => x.QuantityOnOrder)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Quantity on order cannot be negative.")
            .LessThanOrEqualTo(1000000)
            .WithMessage("Quantity on order cannot exceed 1,000,000 units.")
            .When(x => x.QuantityOnOrder.HasValue);

        // Updated By validation (optional in individual requests, will use bulk command's UpdatedBy)
        RuleFor(x => x.UpdatedBy)
            .MaximumLength(100)
            .WithMessage("Updated by must not exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.UpdatedBy));

        // Business rule: At least one field must be provided for update
        RuleFor(x => x)
            .Must(HaveAtLeastOneFieldToUpdate)
            .WithMessage("At least one field must be provided for update.")
            .OverridePropertyName("Update");

        // Business rule: Reasonable stock levels
        RuleFor(x => x)
            .Must(HaveReasonableStockLevels)
            .WithMessage("Average monthly consumption should not exceed quantity on hand by more than 12 months of consumption.")
            .When(x => x.QuantityOnHand.HasValue && x.AverageMonthlyConsumption.HasValue && x.AverageMonthlyConsumption.Value > 0)
            .OverridePropertyName("StockLevels");
    }

    private static bool HaveAtLeastOneFieldToUpdate(UpdateProductRequest request)
    {
        return !string.IsNullOrWhiteSpace(request.Description) ||
               request.QuantityOnHand.HasValue ||
               request.AverageMonthlyConsumption.HasValue ||
               request.LeadTimeDays.HasValue ||
               request.QuantityOnOrder.HasValue;
    }

    private static bool HaveReasonableStockLevels(UpdateProductRequest request)
    {
        if (!request.QuantityOnHand.HasValue || !request.AverageMonthlyConsumption.HasValue || request.AverageMonthlyConsumption.Value <= 0)
            return true; // Skip validation if values not provided

        // Allow up to 24 months of stock (reasonable upper limit)
        var monthsOfStock = request.QuantityOnHand.Value / request.AverageMonthlyConsumption.Value;
        return monthsOfStock <= 24;
    }
}