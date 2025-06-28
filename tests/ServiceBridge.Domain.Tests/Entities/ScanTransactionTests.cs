using FluentAssertions;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Domain.Tests.Entities;

public class ScanTransactionTests
{
    [Fact]
    public void ScanTransaction_ShouldInitializeWithDefaults()
    {
        // Arrange & Act
        var transaction = new ScanTransaction();

        // Assert
        transaction.Id.Should().Be(0);
        transaction.ProductCode.Should().Be(string.Empty);
        transaction.QuantityScanned.Should().Be(0);
        transaction.PreviousQuantity.Should().Be(0);
        transaction.NewQuantity.Should().Be(0);
        transaction.ScannedBy.Should().Be(string.Empty);
        transaction.TransactionType.Should().Be(TransactionType.StockCount);
        transaction.Notes.Should().BeNull();
    }

    [Theory]
    [InlineData(TransactionType.StockCount)]
    [InlineData(TransactionType.Adjustment)]
    [InlineData(TransactionType.Receiving)]
    public void TransactionType_ShouldAcceptAllValidValues(TransactionType transactionType)
    {
        // Arrange & Act
        var transaction = new ScanTransaction
        {
            TransactionType = transactionType
        };

        // Assert
        transaction.TransactionType.Should().Be(transactionType);
    }

    [Fact]
    public void ScanTransaction_ShouldAcceptNegativeQuantityScanned_ForAdjustments()
    {
        // Arrange & Act
        var transaction = new ScanTransaction
        {
            ProductCode = "ABC123",
            QuantityScanned = -10,
            TransactionType = TransactionType.Adjustment,
            PreviousQuantity = 20,
            NewQuantity = 10
        };

        // Assert
        transaction.QuantityScanned.Should().Be(-10);
        transaction.PreviousQuantity.Should().Be(20);
        transaction.NewQuantity.Should().Be(10);
    }

    [Fact]
    public void ScanTransaction_ShouldAcceptOptionalNotes()
    {
        // Arrange
        const string notes = "Damaged inventory adjustment";
        
        // Act
        var transaction = new ScanTransaction
        {
            Notes = notes
        };

        // Assert
        transaction.Notes.Should().Be(notes);
    }

    [Fact]
    public void ScanDateTime_ShouldAcceptUtcDateTime()
    {
        // Arrange
        var utcDateTime = DateTime.UtcNow;
        
        // Act
        var transaction = new ScanTransaction
        {
            ScanDateTime = utcDateTime
        };

        // Assert
        transaction.ScanDateTime.Should().Be(utcDateTime);
        transaction.ScanDateTime.Kind.Should().Be(DateTimeKind.Utc);
    }
}