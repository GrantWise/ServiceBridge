using FluentValidation;
using ServiceBridge.Application.Commands;

namespace ServiceBridge.Application.Validators;

public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
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

        // Updated By validation
        RuleFor(x => x.UpdatedBy)
            .NotEmpty()
            .WithMessage("Updated by is required.")
            .MaximumLength(100)
            .WithMessage("Updated by must not exceed 100 characters.");

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

    private static bool HaveAtLeastOneFieldToUpdate(UpdateProductCommand command)
    {
        return !string.IsNullOrWhiteSpace(command.Description) ||
               command.QuantityOnHand.HasValue ||
               command.AverageMonthlyConsumption.HasValue ||
               command.LeadTimeDays.HasValue ||
               command.QuantityOnOrder.HasValue;
    }

    private static bool HaveReasonableStockLevels(UpdateProductCommand command)
    {
        if (!command.QuantityOnHand.HasValue || !command.AverageMonthlyConsumption.HasValue || command.AverageMonthlyConsumption.Value <= 0)
            return true; // Skip validation if values not provided

        // Allow up to 24 months of stock (reasonable upper limit)
        var monthsOfStock = command.QuantityOnHand.Value / command.AverageMonthlyConsumption.Value;
        return monthsOfStock <= 24;
    }
}