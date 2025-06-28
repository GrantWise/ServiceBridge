using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Hubs;
using ServiceBridge.Application.Services;

namespace ServiceBridge.Infrastructure.Services;

public class SignalRNotificationService : INotificationService
{
    private readonly IHubContext<Hub> _hubContext;
    private readonly ILogger<SignalRNotificationService> _logger;

    public SignalRNotificationService(
        IHubContext<Hub> hubContext,
        ILogger<SignalRNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendProductUpdatedAsync(ProductDto product)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("ProductUpdated", product);
            _logger.LogDebug("Sent ProductUpdated notification for product {ProductCode}", product.ProductCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send ProductUpdated notification for product {ProductCode}", product.ProductCode);
        }
    }

    public async Task SendScanProcessedAsync(ScanProcessedNotification scanResult)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("ScanProcessed", scanResult);
            _logger.LogDebug("Sent ScanProcessed notification for product {ProductCode}", scanResult.ProductCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send ScanProcessed notification for product {ProductCode}", scanResult.ProductCode);
        }
    }

    public async Task SendLiveMetricsAsync(LiveMetricsDto metrics)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("LiveMetricsUpdate", metrics);
            _logger.LogDebug("Sent LiveMetrics update with {TotalProducts} products", metrics.TotalProducts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send LiveMetrics notification");
        }
    }

    public async Task SendToGroupAsync<T>(string groupName, string method, T data)
    {
        try
        {
            await _hubContext.Clients.Group(groupName).SendCoreAsync(method, new object[] { data });
            _logger.LogDebug("Sent {Method} to group {GroupName}", method, groupName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send {Method} to group {GroupName}", method, groupName);
        }
    }

    public async Task SendToUserAsync<T>(string userId, string method, T data)
    {
        try
        {
            await _hubContext.Clients.User(userId).SendCoreAsync(method, new object[] { data });
            _logger.LogDebug("Sent {Method} to user {UserId}", method, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send {Method} to user {UserId}", method, userId);
        }
    }

    public async Task SendToAllAsync<T>(string method, T data)
    {
        try
        {
            await _hubContext.Clients.All.SendCoreAsync(method, new object[] { data });
            _logger.LogDebug("Sent {Method} to all clients", method);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send {Method} to all clients", method);
        }
    }
}