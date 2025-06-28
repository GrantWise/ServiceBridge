using Microsoft.EntityFrameworkCore;
using ServiceBridge.Domain.Entities;
using ServiceBridge.Infrastructure.Data.Configurations;
using System.Text.Json;

namespace ServiceBridge.Infrastructure.Data;

public class ServiceBridgeDbContext : DbContext
{
    public ServiceBridgeDbContext(DbContextOptions<ServiceBridgeDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }
    public DbSet<ScanTransaction> ScanTransactions { get; set; }
    public DbSet<AuditEntry> AuditEntries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations
        modelBuilder.ApplyConfiguration(new ProductConfiguration());
        modelBuilder.ApplyConfiguration(new ScanTransactionConfiguration());
        modelBuilder.ApplyConfiguration(new AuditEntryConfiguration());
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var auditEntries = new List<AuditEntry>();
        var currentTime = DateTime.UtcNow;
        var userId = "system"; // TODO: Get from current user context

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditEntry)
                continue;

            var auditEntry = new AuditEntry
            {
                EntityType = entry.Entity.GetType().Name,
                EntityId = GetPrimaryKeyValue(entry),
                UserId = userId,
                Timestamp = currentTime,
                Source = "EF", // Will be updated by controllers to REST/gRPC/SignalR
                IpAddress = "localhost" // TODO: Get from HTTP context
            };

            switch (entry.State)
            {
                case EntityState.Added:
                    auditEntry.Action = "Created";
                    auditEntry.NewValues = JsonSerializer.Serialize(entry.CurrentValues.ToObject());
                    break;

                case EntityState.Modified:
                    auditEntry.Action = "Updated";
                    auditEntry.OldValues = JsonSerializer.Serialize(entry.OriginalValues.ToObject());
                    auditEntry.NewValues = JsonSerializer.Serialize(entry.CurrentValues.ToObject());
                    break;

                case EntityState.Deleted:
                    auditEntry.Action = "Deleted";
                    auditEntry.OldValues = JsonSerializer.Serialize(entry.OriginalValues.ToObject());
                    break;
            }

            if (auditEntry.Action != null)
            {
                auditEntries.Add(auditEntry);
            }
        }

        var result = await base.SaveChangesAsync(cancellationToken);

        // Add audit entries after the main save to avoid circular references
        if (auditEntries.Any())
        {
            AuditEntries.AddRange(auditEntries);
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    private string GetPrimaryKeyValue(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
    {
        var keyValues = new List<object>();
        foreach (var property in entry.Properties)
        {
            if (property.Metadata.IsPrimaryKey())
            {
                keyValues.Add(property.CurrentValue ?? property.OriginalValue ?? "");
            }
        }
        return string.Join("|", keyValues);
    }
}