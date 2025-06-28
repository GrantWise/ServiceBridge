using FluentAssertions;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Domain.Tests.Entities;

public class ProductTests
{
    [Fact]
    public void DaysCoverRemaining_WhenAverageMonthlyConsumptionIsZero_ShouldReturnZero()
    {
        // Arrange
        var product = new Product
        {
            ProductCode = "ABC123",
            QuantityOnHand = 100,
            AverageMonthlyConsumption = 0
        };

        // Act
        var result = product.DaysCoverRemaining;

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public void DaysCoverRemaining_WhenAverageMonthlyConsumptionIsPositive_ShouldCalculateCorrectly()
    {
        // Arrange
        var product = new Product
        {
            ProductCode = "ABC123",
            QuantityOnHand = 90,
            AverageMonthlyConsumption = 30 // 1 per day
        };

        // Act
        var result = product.DaysCoverRemaining;

        // Assert
        result.Should().Be(90); // 90 units / (30/30) = 90 days
    }

    [Fact]
    public void ReorderPoint_WhenAverageMonthlyConsumptionIsZero_ShouldReturnZero()
    {
        // Arrange
        var product = new Product
        {
            ProductCode = "ABC123",
            AverageMonthlyConsumption = 0,
            LeadTimeDays = 14
        };

        // Act
        var result = product.ReorderPoint;

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public void ReorderPoint_WhenAverageMonthlyConsumptionIsPositive_ShouldCalculateCorrectly()
    {
        // Arrange
        var product = new Product
        {
            ProductCode = "ABC123",
            AverageMonthlyConsumption = 60, // 2 per day
            LeadTimeDays = 14
        };

        // Act
        var result = product.ReorderPoint;

        // Assert
        result.Should().Be(28); // (60/30) * 14 = 28 units
    }

    [Theory]
    [InlineData(0, 30, StockStatus.Low)]     // 0 days = Low
    [InlineData(5, 30, StockStatus.Low)]     // 5 days = Low
    [InlineData(7, 30, StockStatus.Adequate)] // 7 days = Adequate
    [InlineData(30, 30, StockStatus.Adequate)] // 30 days = Adequate
    [InlineData(61, 30, StockStatus.Overstocked)] // 61 days = Overstocked
    [InlineData(90, 30, StockStatus.Overstocked)] // 90 days = Overstocked
    public void StockStatus_ShouldReturnCorrectStatus_BasedOnDaysCover(int quantityOnHand, decimal monthlyConsumption, StockStatus expectedStatus)
    {
        // Arrange
        var product = new Product
        {
            ProductCode = "ABC123",
            QuantityOnHand = quantityOnHand,
            AverageMonthlyConsumption = monthlyConsumption
        };

        // Act
        var result = product.StockStatus;

        // Assert
        result.Should().Be(expectedStatus);
    }

    [Fact]
    public void StockStatus_WhenNoConsumption_ShouldReturnLow()
    {
        // Arrange
        var product = new Product
        {
            ProductCode = "ABC123",
            QuantityOnHand = 100,
            AverageMonthlyConsumption = 0
        };

        // Act
        var result = product.StockStatus;

        // Assert
        result.Should().Be(StockStatus.Low);
    }

    [Fact]
    public void Product_ShouldInitializeCollections()
    {
        // Arrange & Act
        var product = new Product();

        // Assert
        product.ScanTransactions.Should().NotBeNull();
        product.ScanTransactions.Should().BeEmpty();
    }

    [Theory]
    [InlineData("ABC123")]
    [InlineData("XYZ999")]
    [InlineData("DEF456")]
    public void ProductCode_ShouldAcceptValidFormats(string productCode)
    {
        // Arrange & Act
        var product = new Product { ProductCode = productCode };

        // Assert
        product.ProductCode.Should().Be(productCode);
    }
}