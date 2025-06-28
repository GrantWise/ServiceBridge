using System.Collections.Concurrent;

namespace ServiceBridge.Api.Services;

public class ConnectionTrackingService : IConnectionTrackingService
{
    private readonly ConcurrentDictionary<string, string?> _connections = new();
    private readonly ILogger<ConnectionTrackingService> _logger;

    public ConnectionTrackingService(ILogger<ConnectionTrackingService> logger)
    {
        _logger = logger;
    }

    public Task AddConnectionAsync(string connectionId, string? userId)
    {
        _connections.TryAdd(connectionId, userId);
        _logger.LogDebug("Added connection {ConnectionId} for user {UserId}", connectionId, userId);
        return Task.CompletedTask;
    }

    public Task RemoveConnectionAsync(string connectionId)
    {
        if (_connections.TryRemove(connectionId, out var userId))
        {
            _logger.LogDebug("Removed connection {ConnectionId} for user {UserId}", connectionId, userId);
        }
        return Task.CompletedTask;
    }

    public Task<int> GetConnectionCountAsync()
    {
        return Task.FromResult(_connections.Count);
    }

    public Task<List<string>> GetConnectionsForUserAsync(string userId)
    {
        var userConnections = _connections
            .Where(kvp => kvp.Value == userId)
            .Select(kvp => kvp.Key)
            .ToList();
            
        return Task.FromResult(userConnections);
    }

    public Task<Dictionary<string, string?>> GetAllConnectionsAsync()
    {
        return Task.FromResult(_connections.ToDictionary(kvp => kvp.Key, kvp => kvp.Value));
    }
}