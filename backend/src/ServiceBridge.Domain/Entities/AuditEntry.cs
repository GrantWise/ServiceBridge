using System.ComponentModel.DataAnnotations;

namespace ServiceBridge.Domain.Entities;

public class AuditEntry
{
    [Key]
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string NewValues { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Source { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
}
