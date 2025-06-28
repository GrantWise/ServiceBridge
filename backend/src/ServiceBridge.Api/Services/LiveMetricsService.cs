using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Services;
using ServiceBridge.Domain.Interfaces;
using ServiceBridge.Api.Services;

namespace ServiceBridge.Api.Services;

public class LiveMetricsService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LiveMetricsService> _logger;
    private readonly TimeSpan _updateInterval = TimeSpan.FromSeconds(5);

    public LiveMetricsService(IServiceProvider serviceProvider, ILogger<LiveMetricsService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("LiveMetricsService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await BroadcastLiveMetricsAsync();
                await Task.Delay(_updateInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while broadcasting live metrics");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken); // Wait longer on error
            }
        }

        _logger.LogInformation("LiveMetricsService stopped");
    }

    private async Task BroadcastLiveMetricsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        
        var productRepository = scope.ServiceProvider.GetRequiredService<IProductRepository>();
        var scanRepository = scope.ServiceProvider.GetRequiredService<IScanTransactionRepository>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var connectionTracker = scope.ServiceProvider.GetRequiredService<IConnectionTrackingService>();

        try
        {
            // Get metrics data
            var allProducts = await productRepository.GetAllAsync();
            var todayStart = DateTime.UtcNow.Date;
            var todayTransactions = await scanRepository.GetTransactionsByDateRangeAsync(todayStart, DateTime.UtcNow);
            var lastHourStart = DateTime.UtcNow.AddHours(-1);
            var lastHourTransactions = await scanRepository.GetTransactionsByDateRangeAsync(lastHourStart, DateTime.UtcNow);
            var activeConnections = await connectionTracker.GetConnectionCountAsync();

            var allProductsList = allProducts.ToList();
            var todayTransactionsList = todayTransactions.ToList();
            var lastHourTransactionsList = lastHourTransactions.ToList();

            var metrics = new LiveMetricsDto
            {
                TotalProducts = allProductsList.Count,
                LowStockProducts = allProductsList.Count(p => p.StockStatus == Domain.Entities.StockStatus.Low),
                OverstockedProducts = allProductsList.Count(p => p.StockStatus == Domain.Entities.StockStatus.Overstocked),
                RequireReorderProducts = allProductsList.Count(p => p.DaysCoverRemaining <= p.LeadTimeDays),
                TotalTransactionsToday = todayTransactionsList.Count,
                ActiveConnections = activeConnections,
                LastUpdated = DateTime.UtcNow,
                TotalInventoryValue = allProductsList.Sum(p => p.QuantityOnHand * 10m), // Assuming $10 per unit for demo
                ProductsScannedLastHour = lastHourTransactionsList.Select(t => t.ProductCode).Distinct().Count(),
                SystemStatus = "Healthy"
            };

            await notificationService.SendLiveMetricsAsync(metrics);

            _logger.LogDebug("Broadcasted live metrics: {TotalProducts} products, {ActiveConnections} connections", 
                metrics.TotalProducts, metrics.ActiveConnections);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate and broadcast live metrics");
        }
    }
}