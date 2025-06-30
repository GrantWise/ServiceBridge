using System.Text.Json.Serialization;

namespace ServiceBridge.Application.DTOs;

public class UserStatsDto
{
    [JsonPropertyName("total")]
    public int Total { get; set; }
    
    [JsonPropertyName("active")]
    public int Active { get; set; }
    
    [JsonPropertyName("inactive")]
    public int Inactive { get; set; }
    
    [JsonPropertyName("byRole")]
    public Dictionary<string, int> ByRole { get; set; } = new();
    
    [JsonPropertyName("byDepartment")]
    public Dictionary<string, int> ByDepartment { get; set; } = new();
    
    [JsonPropertyName("recentSignups")]
    public int RecentSignups { get; set; }
    
    [JsonPropertyName("activeToday")]
    public int ActiveToday { get; set; }
    
    [JsonPropertyName("lastUpdated")]
    public DateTime LastUpdated { get; set; }
}