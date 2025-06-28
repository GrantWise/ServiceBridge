namespace ServiceBridge.Api.Services;

public interface IConnectionTrackingService
{
    Task AddConnectionAsync(string connectionId, string? userId);
    Task RemoveConnectionAsync(string connectionId);
    Task<int> GetConnectionCountAsync();
    Task<List<string>> GetConnectionsForUserAsync(string userId);
    Task<Dictionary<string, string?>> GetAllConnectionsAsync();
}