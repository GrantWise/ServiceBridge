using ServiceBridge.Application.DTOs;

namespace ServiceBridge.Application.Hubs;

/// <summary>
/// Strongly-typed interface for SignalR client methods
/// </summary>
public interface IInventoryHubClient
{
    /// <summary>
    /// Notifies client that a product has been updated
    /// </summary>
    /// <param name="product">Updated product information</param>
    Task ProductUpdated(ProductDto product);

    /// <summary>
    /// Notifies client that a scan has been processed
    /// </summary>
    /// <param name="scanResult">Scan processing result</param>
    Task ScanProcessed(ScanProcessedNotification scanResult);

    /// <summary>
    /// Sends live metrics to the client
    /// </summary>
    /// <param name="metrics">Current system metrics</param>
    Task LiveMetricsUpdate(LiveMetricsDto metrics);

    /// <summary>
    /// Notifies client they joined a group
    /// </summary>
    /// <param name="groupName">Name of the group joined</param>
    Task JoinedGroup(string groupName);

    /// <summary>
    /// Notifies client they left a group
    /// </summary>
    /// <param name="groupName">Name of the group left</param>
    Task LeftGroup(string groupName);

    /// <summary>
    /// Notifies client of user connection
    /// </summary>
    /// <param name="userId">User identifier</param>
    Task UserConnected(string? userId);

    /// <summary>
    /// Notifies client of user disconnection
    /// </summary>
    /// <param name="userId">User identifier</param>
    Task UserDisconnected(string? userId);

    /// <summary>
    /// Sends current connection count to client
    /// </summary>
    /// <param name="count">Current connection count</param>
    Task ConnectionCountUpdated(int count);
}