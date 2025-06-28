using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Infrastructure.Data.Configurations;

public class ScanTransactionConfiguration : IEntityTypeConfiguration<ScanTransaction>
{
    public void Configure(EntityTypeBuilder<ScanTransaction> builder)
    {
        // Table name
        builder.ToTable("ScanTransactions");

        // Primary key
        builder.HasKey(st => st.Id);

        // Properties
        builder.Property(st => st.Id)
            .ValueGeneratedOnAdd()
            .HasComment("Auto-increment primary key");

        builder.Property(st => st.ProductCode)
            .HasMaxLength(6)
            .IsRequired()
            .HasComment("Foreign key to Product");

        builder.Property(st => st.QuantityScanned)
            .IsRequired()
            .HasComment("Quantity scanned (can be negative for adjustments)");

        builder.Property(st => st.PreviousQuantity)
            .IsRequired()
            .HasComment("Stock quantity before scan");

        builder.Property(st => st.NewQuantity)
            .IsRequired()
            .HasComment("Stock quantity after scan");

        builder.Property(st => st.ScanDateTime)
            .IsRequired()
            .HasComment("When the scan occurred (UTC)");

        builder.Property(st => st.ScannedBy)
            .HasMaxLength(100)
            .IsRequired()
            .HasComment("User who performed the scan");

        builder.Property(st => st.TransactionType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired()
            .HasComment("Type of transaction: StockCount, Adjustment, Receiving");

        builder.Property(st => st.Notes)
            .HasMaxLength(500)
            .HasComment("Optional notes for the transaction");

        // Indexes for performance
        builder.HasIndex(st => st.ProductCode)
            .HasDatabaseName("IX_ScanTransactions_ProductCode");

        builder.HasIndex(st => st.ScanDateTime)
            .HasDatabaseName("IX_ScanTransactions_ScanDateTime");

        builder.HasIndex(st => st.ScannedBy)
            .HasDatabaseName("IX_ScanTransactions_ScannedBy");

        builder.HasIndex(st => st.TransactionType)
            .HasDatabaseName("IX_ScanTransactions_TransactionType");

        // Composite index for common queries
        builder.HasIndex(st => new { st.ProductCode, st.ScanDateTime })
            .HasDatabaseName("IX_ScanTransactions_ProductCode_ScanDateTime");

        // Foreign key relationship
        builder.HasOne(st => st.Product)
            .WithMany(p => p.ScanTransactions)
            .HasForeignKey(st => st.ProductCode)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("FK_ScanTransactions_Products_ProductCode");
    }
}