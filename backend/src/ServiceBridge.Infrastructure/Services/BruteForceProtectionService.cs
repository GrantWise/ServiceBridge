using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using ServiceBridge.Application.Services;

namespace ServiceBridge.Infrastructure.Services;

public class BruteForceProtectionService : IBruteForceProtectionService
{
    private readonly IMemoryCache _cache;
    private readonly ISecurityLogger _securityLogger;
    private readonly int _maxAttempts;
    private readonly TimeSpan _lockoutDuration;
    private readonly TimeSpan _attemptWindow;

    public BruteForceProtectionService(
        IMemoryCache cache, 
        ISecurityLogger securityLogger,
        IConfiguration configuration)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _securityLogger = securityLogger ?? throw new ArgumentNullException(nameof(securityLogger));
        
        // Configure brute force protection settings
        _maxAttempts = int.Parse(configuration["Security:BruteForce:MaxAttempts"] ?? "5");
        _lockoutDuration = TimeSpan.FromMinutes(int.Parse(configuration["Security:BruteForce:LockoutMinutes"] ?? "15"));
        _attemptWindow = TimeSpan.FromMinutes(int.Parse(configuration["Security:BruteForce:AttemptWindowMinutes"] ?? "15"));
    }

    public Task<bool> IsBlockedAsync(string identifier)
    {
        if (string.IsNullOrEmpty(identifier))
            return Task.FromResult(false);

        var key = GetCacheKey(identifier);
        var lockoutData = _cache.Get<LockoutData>(key);
        
        if (lockoutData?.IsLockedOut == true && DateTime.UtcNow < lockoutData.LockoutUntil)
        {
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }

    public Task RecordFailedAttemptAsync(string identifier)
    {
        if (string.IsNullOrEmpty(identifier))
            return Task.CompletedTask;

        var key = GetCacheKey(identifier);
        var lockoutData = _cache.Get<LockoutData>(key) ?? new LockoutData();

        // Clean old attempts outside the window
        lockoutData.CleanOldAttempts(_attemptWindow);

        // Add new failed attempt
        lockoutData.FailedAttempts.Add(DateTime.UtcNow);

        // Check if should be locked out
        if (lockoutData.FailedAttempts.Count >= _maxAttempts)
        {
            lockoutData.IsLockedOut = true;
            lockoutData.LockoutUntil = DateTime.UtcNow.Add(_lockoutDuration);
            
            _securityLogger.LogAccountLockout(identifier);
        }

        // Cache with longer expiration to maintain lockout state
        var expiration = lockoutData.IsLockedOut ? _lockoutDuration.Add(TimeSpan.FromHours(1)) : _attemptWindow;
        _cache.Set(key, lockoutData, expiration);

        return Task.CompletedTask;
    }

    public Task RecordSuccessfulAttemptAsync(string identifier)
    {
        if (string.IsNullOrEmpty(identifier))
            return Task.CompletedTask;

        var key = GetCacheKey(identifier);
        
        // Clear failed attempts on successful login
        _cache.Remove(key);

        return Task.CompletedTask;
    }

    public Task<TimeSpan?> GetLockoutTimeRemainingAsync(string identifier)
    {
        if (string.IsNullOrEmpty(identifier))
            return Task.FromResult<TimeSpan?>(null);

        var key = GetCacheKey(identifier);
        var lockoutData = _cache.Get<LockoutData>(key);

        if (lockoutData?.IsLockedOut == true && DateTime.UtcNow < lockoutData.LockoutUntil)
        {
            var remaining = lockoutData.LockoutUntil - DateTime.UtcNow;
            return Task.FromResult<TimeSpan?>(remaining);
        }

        return Task.FromResult<TimeSpan?>(null);
    }

    private static string GetCacheKey(string identifier) => $"bruteforce_{identifier}";

    private class LockoutData
    {
        public List<DateTime> FailedAttempts { get; } = new();
        public bool IsLockedOut { get; set; }
        public DateTime LockoutUntil { get; set; }

        public void CleanOldAttempts(TimeSpan window)
        {
            var cutoff = DateTime.UtcNow.Subtract(window);
            FailedAttempts.RemoveAll(attempt => attempt < cutoff);
        }
    }
}