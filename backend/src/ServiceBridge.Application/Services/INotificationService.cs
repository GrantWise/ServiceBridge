using ServiceBridge.Application.DTOs;

namespace ServiceBridge.Application.Services;

public interface INotificationService
{
    Task SendProductUpdatedAsync(ProductDto product);
    Task SendScanProcessedAsync(ScanProcessedNotification scanResult);
    Task SendLiveMetricsAsync(LiveMetricsDto metrics);
    Task SendToGroupAsync<T>(string groupName, string method, T data);
    Task SendToUserAsync<T>(string userId, string method, T data);
    Task SendToAllAsync<T>(string method, T data);
}