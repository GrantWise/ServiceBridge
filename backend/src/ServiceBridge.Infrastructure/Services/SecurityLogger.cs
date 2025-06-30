using Microsoft.Extensions.Logging;
using ServiceBridge.Application.Services;
using System.Security.Cryptography;
using System.Text;

namespace ServiceBridge.Infrastructure.Services;

public class SecurityLogger : ISecurityLogger
{
    private readonly ILogger<SecurityLogger> _logger;

    public SecurityLogger(ILogger<SecurityLogger> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public void LogLoginAttempt(string userIdentifier, bool success, string? reason = null)
    {
        var hashedIdentifier = HashUserIdentifier(userIdentifier);
        
        if (success)
        {
            _logger.LogInformation("Login successful for user {HashedUserId}", hashedIdentifier);
        }
        else
        {
            _logger.LogWarning("Login failed for user {HashedUserId}. Reason: {Reason}", 
                hashedIdentifier, reason ?? "Invalid credentials");
        }
    }

    public void LogPasswordReset(string userIdentifier)
    {
        var hashedIdentifier = HashUserIdentifier(userIdentifier);
        _logger.LogInformation("Password reset requested for user {HashedUserId}", hashedIdentifier);
    }

    public void LogAccountLockout(string userIdentifier)
    {
        var hashedIdentifier = HashUserIdentifier(userIdentifier);
        _logger.LogWarning("Account locked for user {HashedUserId}", hashedIdentifier);
    }

    public void LogSecurityEvent(string eventType, string userIdentifier, string details)
    {
        var hashedIdentifier = HashUserIdentifier(userIdentifier);
        _logger.LogWarning("Security event {EventType} for user {HashedUserId}: {Details}", 
            eventType, hashedIdentifier, details);
    }

    private static string HashUserIdentifier(string userIdentifier)
    {
        // Hash the user identifier for privacy while maintaining correlation capability
        // In production, you might want to use a keyed hash or encryption
        if (string.IsNullOrEmpty(userIdentifier))
            return "unknown";

        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(userIdentifier));
        var hash = Convert.ToHexString(hashBytes)[..12]; // First 12 characters for brevity
        
        return $"user_{hash}";
    }
}