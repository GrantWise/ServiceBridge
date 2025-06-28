using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Infrastructure.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        // Table name
        builder.ToTable("Products");

        // Primary key
        builder.HasKey(p => p.ProductCode);

        // Properties
        builder.Property(p => p.ProductCode)
            .HasMaxLength(6)
            .IsRequired()
            .HasComment("Product code in format ABC123 (3 letters + 3 digits)");

        builder.Property(p => p.Description)
            .HasMaxLength(200)
            .IsRequired()
            .HasComment("Product description");

        builder.Property(p => p.QuantityOnHand)
            .IsRequired()
            .HasComment("Current stock quantity");

        builder.Property(p => p.AverageMonthlyConsumption)
            .HasColumnType("decimal(18,2)")
            .IsRequired()
            .HasComment("Average monthly consumption for reorder calculations");

        builder.Property(p => p.LeadTimeDays)
            .IsRequired()
            .HasComment("Lead time in days (1-365)");

        builder.Property(p => p.QuantityOnOrder)
            .IsRequired()
            .HasComment("Quantity currently on order");

        builder.Property(p => p.LastUpdated)
            .IsRequired()
            .HasComment("Last update timestamp");

        builder.Property(p => p.LastUpdatedBy)
            .HasMaxLength(100)
            .IsRequired()
            .HasComment("User who last updated the product");

        // Indexes for performance
        builder.HasIndex(p => p.ProductCode)
            .IsUnique()
            .HasDatabaseName("IX_Products_ProductCode");

        builder.HasIndex(p => p.Description)
            .HasDatabaseName("IX_Products_Description");

        builder.HasIndex(p => p.LastUpdated)
            .HasDatabaseName("IX_Products_LastUpdated");

        // Calculated properties are not mapped to database
        builder.Ignore(p => p.DaysCoverRemaining);
        builder.Ignore(p => p.ReorderPoint);
        builder.Ignore(p => p.StockStatus);

        // Navigation properties
        builder.HasMany(p => p.ScanTransactions)
            .WithOne(st => st.Product)
            .HasForeignKey(st => st.ProductCode)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("FK_ScanTransactions_Products_ProductCode");
    }
}