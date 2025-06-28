namespace ServiceBridge.Api.Hubs;

/// <summary>
/// API-specific SignalR client interface that inherits from the application interface
/// </summary>
public interface IInventoryHubClient : ServiceBridge.Application.Hubs.IInventoryHubClient
{
    // API-specific extensions can be added here if needed
}