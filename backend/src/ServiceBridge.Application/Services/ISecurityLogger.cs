namespace ServiceBridge.Application.Services;

public interface ISecurityLogger
{
    void LogLoginAttempt(string userIdentifier, bool success, string? reason = null);
    void LogPasswordReset(string userIdentifier);
    void LogAccountLockout(string userIdentifier);
    void LogSecurityEvent(string eventType, string userIdentifier, string details);
}