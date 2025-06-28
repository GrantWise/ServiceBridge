using FluentValidation;
using ServiceBridge.Application.Commands;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Application.Validators;

public class ProcessScanCommandValidator : AbstractValidator<ProcessScanCommand>
{
    public ProcessScanCommandValidator()
    {
        // Product Code validation
        RuleFor(x => x.ProductCode)
            .NotEmpty()
            .WithMessage("Product code is required.")
            .Matches(@"^[A-Z]{3}\d{3}$")
            .WithMessage("Product code must follow format ABC123 (3 letters followed by 3 digits).")
            .Length(6)
            .WithMessage("Product code must be exactly 6 characters.");

        // Quantity Scanned validation
        RuleFor(x => x.QuantityScanned)
            .Must(BeValidQuantityForTransactionType)
            .WithMessage("Quantity scanned must be appropriate for transaction type.")
            .When(x => !string.IsNullOrEmpty(x.ProductCode));

        // Transaction Type validation
        RuleFor(x => x.TransactionType)
            .IsInEnum()
            .WithMessage("Transaction type must be a valid value (Receiving, Adjustment, or StockCount).");

        // Scanned By validation
        RuleFor(x => x.ScannedBy)
            .NotEmpty()
            .WithMessage("Scanned by is required.")
            .MaximumLength(100)
            .WithMessage("Scanned by must not exceed 100 characters.");

        // Notes validation (optional but limited length)
        RuleFor(x => x.Notes)
            .MaximumLength(500)
            .WithMessage("Notes must not exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));

        // Business rule validations
        RuleFor(x => x)
            .Must(HaveValidAdjustmentQuantity)
            .WithMessage("Adjustment transactions cannot result in negative stock (quantity scanned cannot be less than -current stock).")
            .When(x => x.TransactionType == TransactionType.Adjustment);

        RuleFor(x => x)
            .Must(HaveValidStockCountQuantity)
            .WithMessage("Stock count quantity cannot be negative.")
            .When(x => x.TransactionType == TransactionType.StockCount);

        RuleFor(x => x)
            .Must(HaveValidReceivingQuantity)
            .WithMessage("Receiving quantity must be positive.")
            .When(x => x.TransactionType == TransactionType.Receiving);
    }

    private static bool BeValidQuantityForTransactionType(ProcessScanCommand command, int quantityScanned)
    {
        return command.TransactionType switch
        {
            TransactionType.Receiving => quantityScanned > 0,
            TransactionType.StockCount => quantityScanned >= 0,
            TransactionType.Adjustment => true, // Can be positive or negative
            _ => false
        };
    }

    private static bool HaveValidAdjustmentQuantity(ProcessScanCommand command)
    {
        // For adjustments, we can't validate against current stock here since we don't have access to the repository
        // This will be handled in the command handler with proper business logic
        // Here we just ensure the adjustment isn't extremely negative (basic sanity check)
        return command.QuantityScanned >= -10000; // Reasonable business limit
    }

    private static bool HaveValidStockCountQuantity(ProcessScanCommand command)
    {
        return command.QuantityScanned >= 0;
    }

    private static bool HaveValidReceivingQuantity(ProcessScanCommand command)
    {
        return command.QuantityScanned > 0;
    }
}