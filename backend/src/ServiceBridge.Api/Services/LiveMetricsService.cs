using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Services;
using ServiceBridge.Domain.Interfaces;
using ServiceBridge.Api.Services;
using System.Diagnostics;

namespace ServiceBridge.Api.Services;

public class LiveMetricsService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LiveMetricsService> _logger;
    private readonly TimeSpan _updateInterval = TimeSpan.FromSeconds(30);
    private readonly DateTime _serviceStartTime = DateTime.UtcNow;
    private int _totalErrors = 0;

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
                _totalErrors++;
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
            // Start timing database operations
            var dbStopwatch = Stopwatch.StartNew();
            
            // Get metrics data
            var allProducts = await productRepository.GetAllAsync();
            var todayStart = DateTime.UtcNow.Date;
            var todayTransactions = await scanRepository.GetTransactionsByDateRangeAsync(todayStart, DateTime.UtcNow);
            var lastHourStart = DateTime.UtcNow.AddHours(-1);
            var lastHourTransactions = await scanRepository.GetTransactionsByDateRangeAsync(lastHourStart, DateTime.UtcNow);
            var activeConnections = await connectionTracker.GetConnectionCountAsync();

            dbStopwatch.Stop();
            var dbResponseTime = (int)dbStopwatch.ElapsedMilliseconds;

            var allProductsList = allProducts.ToList();
            var todayTransactionsList = todayTransactions.ToList();
            var lastHourTransactionsList = lastHourTransactions.ToList();

            // Calculate system metrics
            var uptime = DateTime.UtcNow.Subtract(_serviceStartTime).TotalDays * 100 / DateTime.UtcNow.Subtract(_serviceStartTime).TotalDays;
            var systemUptime = Math.Min(99.9, Math.Max(95.0, 99.8 - (_totalErrors * 0.1)));
            
            // Get system performance metrics (simulated for demo)
            var process = Process.GetCurrentProcess();
            var cpuUsage = Math.Round(Random.Shared.NextDouble() * 20 + 10, 1); // 10-30%
            var memoryUsageMB = process.WorkingSet64 / (1024 * 1024);
            var memoryUsagePercent = Math.Round((double)memoryUsageMB / 1024 * 100, 1); // Assume 1GB available
            
            // Determine system status based on metrics
            var systemStatus = "Healthy";
            if (systemUptime < 98 || cpuUsage > 80 || memoryUsagePercent > 85 || _totalErrors > 10)
            {
                systemStatus = "Error";
            }
            else if (systemUptime < 99.5 || cpuUsage > 60 || memoryUsagePercent > 70 || _totalErrors > 5)
            {
                systemStatus = "Warning";
            }

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
                SystemStatus = systemStatus,
                
                // Enhanced system health metrics
                SystemUptime = Math.Round(systemUptime, 1),
                ApiResponseTimeMs = Math.Max(25, dbResponseTime / 2), // Simulate API response time
                DatabaseResponseTimeMs = dbResponseTime,
                SignalRConnections = activeConnections,
                ErrorsLastHour = Math.Min(_totalErrors, 50), // Cap errors for display
                CpuUsagePercent = cpuUsage,
                MemoryUsagePercent = Math.Min(memoryUsagePercent, 100),
                PendingBackgroundJobs = 0 // Could be enhanced to track actual background jobs
            };

            await notificationService.SendLiveMetricsAsync(metrics);

            _logger.LogDebug("Broadcasted live metrics: {TotalProducts} products, {ActiveConnections} connections", 
                metrics.TotalProducts, metrics.ActiveConnections);
        }
        catch (Exception ex)
        {
            _totalErrors++;
            _logger.LogError(ex, "Failed to calculate and broadcast live metrics");
        }
    }
}