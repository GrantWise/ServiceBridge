namespace ServiceBridge.Application.Services;

public interface IBruteForceProtectionService
{
    Task<bool> IsBlockedAsync(string identifier);
    Task RecordFailedAttemptAsync(string identifier);
    Task RecordSuccessfulAttemptAsync(string identifier);
    Task<TimeSpan?> GetLockoutTimeRemainingAsync(string identifier);
}