using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ServiceBridge.Api.Services;

namespace ServiceBridge.Api.Hubs;

[Authorize(Policy = "Scanner")] // All SignalR connections require at least Scanner role
public class InventoryHub : Hub<IInventoryHubClient>
{
    private readonly IConnectionTrackingService _connectionTracker;
    private readonly ILogger<InventoryHub> _logger;

    public InventoryHub(IConnectionTrackingService connectionTracker, ILogger<InventoryHub> logger)
    {
        _connectionTracker = connectionTracker;
        _logger = logger;
    }

    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.Caller.JoinedGroup(groupName);
        
        _logger.LogInformation("Connection {ConnectionId} joined group {GroupName}", 
            Context.ConnectionId, groupName);
    }

    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        await Clients.Caller.LeftGroup(groupName);
        
        _logger.LogInformation("Connection {ConnectionId} left group {GroupName}", 
            Context.ConnectionId, groupName);
    }

    public async Task<int> GetConnectionCount()
    {
        return await _connectionTracker.GetConnectionCountAsync();
    }

    public override async Task OnConnectedAsync()
    {
        await _connectionTracker.AddConnectionAsync(Context.ConnectionId, Context.UserIdentifier);
        await Clients.All.UserConnected(Context.UserIdentifier);
        
        var connectionCount = await _connectionTracker.GetConnectionCountAsync();
        await Clients.All.ConnectionCountUpdated(connectionCount);
        
        var userName = Context.User?.Identity?.Name ?? "Anonymous";
        var userRole = Context.User?.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value ?? "Unknown";
        
        _logger.LogInformation("User {UserName} ({UserRole}) connected with connection {ConnectionId}. Total connections: {ConnectionCount}", 
            userName, userRole, Context.ConnectionId, connectionCount);
            
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await _connectionTracker.RemoveConnectionAsync(Context.ConnectionId);
        await Clients.All.UserDisconnected(Context.UserIdentifier);
        
        var connectionCount = await _connectionTracker.GetConnectionCountAsync();
        await Clients.All.ConnectionCountUpdated(connectionCount);
        
        if (exception != null)
        {
            _logger.LogWarning(exception, "User {UserIdentifier} disconnected with error. Connection {ConnectionId}", 
                Context.UserIdentifier, Context.ConnectionId);
        }
        else
        {
            var userName = Context.User?.Identity?.Name ?? "Anonymous";
            
            _logger.LogInformation("User {UserName} disconnected. Connection {ConnectionId}. Total connections: {ConnectionCount}", 
                userName, Context.ConnectionId, connectionCount);
        }
            
        await base.OnDisconnectedAsync(exception);
    }
}
