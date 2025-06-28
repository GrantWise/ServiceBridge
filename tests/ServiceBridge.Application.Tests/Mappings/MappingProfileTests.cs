using AutoMapper;
using FluentAssertions;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Mappings;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Application.Tests.Mappings;

public class MappingProfileTests
{
    private readonly IMapper _mapper;

    public MappingProfileTests()
    {
        var configuration = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = configuration.CreateMapper();
    }

    [Fact]
    public void MappingProfile_Configuration_ShouldBeValid()
    {
        // Arrange & Act & Assert
        var configuration = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        configuration.Invoking(c => c.AssertConfigurationIsValid()).Should().NotThrow();
    }

    [Fact]
    public void Product_To_ProductDto_ShouldMapCorrectly()
    {
        // Arrange
        var product = new Product
        {
            ProductCode = "ABC123",
            Description = "Test Product",
            QuantityOnHand = 90,
            AverageMonthlyConsumption = 30,
            LeadTimeDays = 14,
            QuantityOnOrder = 20,
            LastUpdated = DateTime.UtcNow,
            LastUpdatedBy = "TestUser"
        };

        // Act
        var result = _mapper.Map<ProductDto>(product);

        // Assert
        result.Should().NotBeNull();
        result.ProductCode.Should().Be(product.ProductCode);
        result.Description.Should().Be(product.Description);
        result.QuantityOnHand.Should().Be(product.QuantityOnHand);
        result.AverageMonthlyConsumption.Should().Be(product.AverageMonthlyConsumption);
        result.LeadTimeDays.Should().Be(product.LeadTimeDays);
        result.QuantityOnOrder.Should().Be(product.QuantityOnOrder);
        result.LastUpdated.Should().Be(product.LastUpdated);
        result.LastUpdatedBy.Should().Be(product.LastUpdatedBy);
        
        // Calculated properties should be mapped
        result.DaysCoverRemaining.Should().Be(product.DaysCoverRemaining);
        result.ReorderPoint.Should().Be(product.ReorderPoint);
        result.StockStatus.Should().Be(product.StockStatus);
    }

    [Fact]
    public void UpdateProductRequest_To_Product_ShouldMapCorrectly()
    {
        // Arrange
        var request = new UpdateProductRequest
        {
            ProductCode = "abc123", // lowercase to test normalization
            Description = "Updated Product",
            QuantityOnHand = 150,
            AverageMonthlyConsumption = 45,
            LeadTimeDays = 21,
            QuantityOnOrder = 30,
            UpdatedBy = "UpdateUser"
        };

        // Act
        var result = _mapper.Map<Product>(request);

        // Assert
        result.Should().NotBeNull();
        result.ProductCode.Should().Be("ABC123"); // Should be normalized to uppercase
        result.Description.Should().Be(request.Description);
        result.QuantityOnHand.Should().Be(request.QuantityOnHand.Value);
        result.AverageMonthlyConsumption.Should().Be(request.AverageMonthlyConsumption.Value);
        result.LeadTimeDays.Should().Be(request.LeadTimeDays.Value);
        result.QuantityOnOrder.Should().Be(request.QuantityOnOrder.Value);
        result.LastUpdatedBy.Should().Be(request.UpdatedBy);
        result.LastUpdated.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void UpdateProductRequest_To_Product_WithNullValues_ShouldUseDefaults()
    {
        // Arrange
        var request = new UpdateProductRequest
        {
            ProductCode = "DEF456",
            UpdatedBy = "UpdateUser"
            // All other properties are null
        };

        // Act
        var result = _mapper.Map<Product>(request);

        // Assert
        result.Should().NotBeNull();
        result.ProductCode.Should().Be("DEF456");
        result.Description.Should().Be(string.Empty);
        result.QuantityOnHand.Should().Be(0);
        result.AverageMonthlyConsumption.Should().Be(0);
        result.LeadTimeDays.Should().Be(30); // Default value
        result.QuantityOnOrder.Should().Be(0);
        result.LastUpdatedBy.Should().Be(request.UpdatedBy);
    }

    [Fact]
    public void ScanTransaction_To_ScanTransactionDto_ShouldMapCorrectly()
    {
        // Arrange
        var product = new Product
        {
            ProductCode = "GHI789",
            Description = "Test Product for Scan"
        };

        var scanTransaction = new ScanTransaction
        {
            Id = 1,
            ProductCode = "GHI789",
            QuantityScanned = 10,
            PreviousQuantity = 50,
            NewQuantity = 60,
            ScanDateTime = DateTime.UtcNow,
            ScannedBy = "ScanUser",
            TransactionType = TransactionType.Receiving,
            Notes = "Receiving new stock",
            Product = product
        };

        // Act
        var result = _mapper.Map<ScanTransactionDto>(scanTransaction);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(scanTransaction.Id);
        result.ProductCode.Should().Be(scanTransaction.ProductCode);
        result.QuantityScanned.Should().Be(scanTransaction.QuantityScanned);
        result.PreviousQuantity.Should().Be(scanTransaction.PreviousQuantity);
        result.NewQuantity.Should().Be(scanTransaction.NewQuantity);
        result.ScanDateTime.Should().Be(scanTransaction.ScanDateTime);
        result.ScannedBy.Should().Be(scanTransaction.ScannedBy);
        result.TransactionType.Should().Be(scanTransaction.TransactionType);
        result.Notes.Should().Be(scanTransaction.Notes);
        result.ProductDescription.Should().Be(product.Description);
    }

    [Fact]
    public void ScanTransaction_To_ScanTransactionDto_WithoutProduct_ShouldMapCorrectly()
    {
        // Arrange
        var scanTransaction = new ScanTransaction
        {
            Id = 2,
            ProductCode = "JKL012",
            QuantityScanned = -5,
            PreviousQuantity = 25,
            NewQuantity = 20,
            ScanDateTime = DateTime.UtcNow,
            ScannedBy = "AdjustUser",
            TransactionType = TransactionType.Adjustment,
            Notes = "Damage adjustment",
            Product = null // No product navigation property
        };

        // Act
        var result = _mapper.Map<ScanTransactionDto>(scanTransaction);

        // Assert
        result.Should().NotBeNull();
        result.ProductDescription.Should().BeNull();
        result.ProductCode.Should().Be(scanTransaction.ProductCode);
        result.QuantityScanned.Should().Be(scanTransaction.QuantityScanned);
    }

    [Fact]
    public void CreateScanRequest_To_ScanTransaction_ShouldMapCorrectly()
    {
        // Arrange
        var request = new CreateScanRequest
        {
            ProductCode = "mno345", // lowercase to test normalization
            QuantityScanned = 15,
            TransactionType = TransactionType.StockCount,
            Notes = "Weekly stock count",
            ScannedBy = "CountUser"
        };

        // Act
        var result = _mapper.Map<ScanTransaction>(request);

        // Assert
        result.Should().NotBeNull();
        result.ProductCode.Should().Be("MNO345"); // Should be normalized to uppercase
        result.QuantityScanned.Should().Be(request.QuantityScanned);
        result.TransactionType.Should().Be(request.TransactionType);
        result.Notes.Should().Be(request.Notes);
        result.ScannedBy.Should().Be(request.ScannedBy);
        result.ScanDateTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        
        // These should be ignored in mapping
        result.Id.Should().Be(0);
        result.PreviousQuantity.Should().Be(0);
        result.NewQuantity.Should().Be(0);
        result.Product.Should().BeNull();
    }
}