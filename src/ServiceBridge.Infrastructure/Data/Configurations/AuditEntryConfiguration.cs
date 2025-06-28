using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Infrastructure.Data.Configurations;

public class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> builder)
    {
        // Table name
        builder.ToTable("AuditEntries");

        // Primary key
        builder.HasKey(ae => ae.Id);

        // Properties
        builder.Property(ae => ae.Id)
            .ValueGeneratedOnAdd()
            .HasComment("Auto-increment primary key");

        builder.Property(ae => ae.EntityType)
            .HasMaxLength(100)
            .IsRequired()
            .HasComment("Type of entity that was changed (Product, ScanTransaction)");

        builder.Property(ae => ae.EntityId)
            .HasMaxLength(100)
            .IsRequired()
            .HasComment("Primary key value(s) of the changed entity");

        builder.Property(ae => ae.Action)
            .HasMaxLength(20)
            .IsRequired()
            .HasComment("Action performed: Created, Updated, Deleted");

        builder.Property(ae => ae.OldValues)
            .HasColumnType("TEXT")
            .HasComment("JSON representation of old values (null for Created)");

        builder.Property(ae => ae.NewValues)
            .HasColumnType("TEXT")
            .IsRequired()
            .HasComment("JSON representation of new values");

        builder.Property(ae => ae.UserId)
            .HasMaxLength(100)
            .IsRequired()
            .HasComment("ID of user who made the change");

        builder.Property(ae => ae.Timestamp)
            .IsRequired()
            .HasComment("When the change occurred (UTC)");

        builder.Property(ae => ae.Source)
            .HasMaxLength(20)
            .IsRequired()
            .HasComment("Source of change: REST, gRPC, SignalR, EF");

        builder.Property(ae => ae.IpAddress)
            .HasMaxLength(45)
            .IsRequired()
            .HasComment("IP address of the client");

        // Indexes for audit queries and performance
        builder.HasIndex(ae => ae.EntityType)
            .HasDatabaseName("IX_AuditEntries_EntityType");

        builder.HasIndex(ae => ae.EntityId)
            .HasDatabaseName("IX_AuditEntries_EntityId");

        builder.HasIndex(ae => ae.Timestamp)
            .HasDatabaseName("IX_AuditEntries_Timestamp");

        builder.HasIndex(ae => ae.UserId)
            .HasDatabaseName("IX_AuditEntries_UserId");

        builder.HasIndex(ae => ae.Source)
            .HasDatabaseName("IX_AuditEntries_Source");

        // Composite indexes for common audit queries
        builder.HasIndex(ae => new { ae.EntityType, ae.EntityId })
            .HasDatabaseName("IX_AuditEntries_EntityType_EntityId");

        builder.HasIndex(ae => new { ae.EntityType, ae.Timestamp })
            .HasDatabaseName("IX_AuditEntries_EntityType_Timestamp");

        builder.HasIndex(ae => new { ae.UserId, ae.Timestamp })
            .HasDatabaseName("IX_AuditEntries_UserId_Timestamp");
    }
}