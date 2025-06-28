using AutoMapper;
using MediatR;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Services;
using ServiceBridge.Domain.Entities;
using ServiceBridge.Domain.Interfaces;

namespace ServiceBridge.Application.Commands;

public class ProcessScanCommandHandler : IRequestHandler<ProcessScanCommand, CreateScanResponse>
{
    private readonly IProductRepository _productRepository;
    private readonly IScanTransactionRepository _scanTransactionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public ProcessScanCommandHandler(
        IProductRepository productRepository,
        IScanTransactionRepository scanTransactionRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        INotificationService notificationService)
    {
        _productRepository = productRepository;
        _scanTransactionRepository = scanTransactionRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    public async Task<CreateScanResponse> Handle(ProcessScanCommand request, CancellationToken cancellationToken)
    {
        // Get the product
        var product = await _productRepository.GetByProductCodeAsync(request.ProductCode, cancellationToken);
        if (product == null)
        {
            return new CreateScanResponse
            {
                Success = false,
                Message = $"Product with code '{request.ProductCode}' not found.",
                ProductCode = request.ProductCode
            };
        }

        // Store the previous quantity
        var previousQuantity = product.QuantityOnHand;

        // Calculate new quantity based on transaction type
        var newQuantity = CalculateNewQuantity(product.QuantityOnHand, request.QuantityScanned, request.TransactionType);

        // Validate that we don't go negative (business rule)
        if (newQuantity < 0)
        {
            return new CreateScanResponse
            {
                Success = false,
                Message = $"Insufficient stock. Current quantity: {product.QuantityOnHand}, attempted change: {request.QuantityScanned}",
                ProductCode = request.ProductCode,
                PreviousQuantity = previousQuantity,
                QuantityScanned = request.QuantityScanned
            };
        }

        try
        {
            // Create the scan transaction
            var scanTransaction = new ScanTransaction
            {
                ProductCode = request.ProductCode,
                QuantityScanned = request.QuantityScanned,
                PreviousQuantity = previousQuantity,
                NewQuantity = newQuantity,
                ScanDateTime = DateTime.UtcNow,
                ScannedBy = request.ScannedBy,
                TransactionType = request.TransactionType,
                Notes = request.Notes,
                Product = product
            };

            // Update the product quantity
            product.QuantityOnHand = newQuantity;
            product.LastUpdated = DateTime.UtcNow;
            product.LastUpdatedBy = request.ScannedBy;

            // Add the transaction and update the product
            await _scanTransactionRepository.AddAsync(scanTransaction, cancellationToken);
            _productRepository.Update(product);

            // Save all changes in a transaction
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Map the updated product to DTO
            var updatedProductDto = _mapper.Map<ProductDto>(product);

            // Send real-time notifications
            await SendNotificationsAsync(updatedProductDto, scanTransaction, request, previousQuantity, newQuantity);

            return new CreateScanResponse
            {
                Success = true,
                TransactionId = scanTransaction.Id,
                ProductCode = request.ProductCode,
                PreviousQuantity = previousQuantity,
                NewQuantity = newQuantity,
                QuantityScanned = request.QuantityScanned,
                ScanDateTime = scanTransaction.ScanDateTime,
                Message = $"Scan processed successfully. {request.TransactionType} of {request.QuantityScanned} units.",
                UpdatedProduct = updatedProductDto
            };
        }
        catch (Exception ex)
        {
            // Rollback is automatic with EF Core transaction scope
            return new CreateScanResponse
            {
                Success = false,
                Message = $"Error processing scan: {ex.Message}",
                ProductCode = request.ProductCode,
                PreviousQuantity = previousQuantity,
                QuantityScanned = request.QuantityScanned
            };
        }
    }

    private static int CalculateNewQuantity(int currentQuantity, int quantityScanned, TransactionType transactionType)
    {
        return transactionType switch
        {
            TransactionType.Receiving => currentQuantity + quantityScanned,
            TransactionType.Adjustment => currentQuantity + quantityScanned, // Can be positive or negative
            TransactionType.StockCount => quantityScanned, // Set to exact count
            _ => throw new ArgumentException($"Unknown transaction type: {transactionType}")
        };
    }

    private async Task SendNotificationsAsync(
        ProductDto updatedProduct, 
        ScanTransaction scanTransaction, 
        ProcessScanCommand request, 
        int previousQuantity, 
        int newQuantity)
    {
        try
        {
            // Send product updated notification
            await _notificationService.SendProductUpdatedAsync(updatedProduct);

            // Send scan processed notification
            var scanNotification = new ScanProcessedNotification
            {
                TransactionId = scanTransaction.Id.ToString(),
                ProductCode = request.ProductCode,
                ProductDescription = updatedProduct.Description,
                TransactionType = request.TransactionType,
                QuantityScanned = request.QuantityScanned,
                NewQuantityOnHand = newQuantity,
                PreviousQuantityOnHand = previousQuantity,
                ScannedBy = request.ScannedBy,
                ScanTimestamp = scanTransaction.ScanDateTime,
                Notes = request.Notes,
                Success = true
            };

            await _notificationService.SendScanProcessedAsync(scanNotification);
        }
        catch (Exception ex)
        {
            // Log notification failures but don't fail the command
            // Notifications are not critical to the business operation
            System.Diagnostics.Debug.WriteLine($"Failed to send notifications: {ex.Message}");
        }
    }
}