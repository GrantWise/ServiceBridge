using Microsoft.Extensions.Configuration;
using ServiceBridge.Application.Services;
using System.Security.Cryptography;
using System.Text;

namespace ServiceBridge.Infrastructure.Services;

public class JwtConfigurationService : IJwtConfigurationService
{
    private readonly IConfiguration _configuration;
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expirationMinutes;

    public JwtConfigurationService(IConfiguration configuration)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        
        // Security: Get secret from environment variables first, then fallback
        _secretKey = GetSecureSecretKey();
        _issuer = _configuration["Jwt:Issuer"] ?? "ServiceBridge";
        _audience = _configuration["Jwt:Audience"] ?? "ServiceBridge-API";
        _expirationMinutes = int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "60");
    }

    public string GetSecretKey() => _secretKey;
    public string GetIssuer() => _issuer;
    public string GetAudience() => _audience;
    public int GetExpirationMinutes() => _expirationMinutes;

    public bool IsSecretKeySecure()
    {
        // Check if secret key meets security requirements
        return _secretKey.Length >= 32 && // Minimum 256 bits
               !_secretKey.Contains("Development") && // Not a development key
               !_secretKey.Contains("Demo"); // Not a demo key
    }

    private string GetSecureSecretKey()
    {
        // Priority 1: Environment variable (production)
        var envSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
        if (!string.IsNullOrEmpty(envSecret) && envSecret.Length >= 32)
        {
            return envSecret;
        }

        // Priority 2: Configuration (not recommended for production)
        var configSecret = _configuration["Jwt:SecretKey"];
        if (!string.IsNullOrEmpty(configSecret) && configSecret.Length >= 32)
        {
            return configSecret;
        }

        // Priority 3: Generate secure random key for demo (not persistent)
        // In production, this would be configured externally
        return GenerateSecureRandomKey();
    }

    private static string GenerateSecureRandomKey()
    {
        // Generate cryptographically secure random key for demonstration
        // In production, this should be configured via secure key management
        using var rng = RandomNumberGenerator.Create();
        var keyBytes = new byte[32]; // 256 bits
        rng.GetBytes(keyBytes);
        
        var base64Key = Convert.ToBase64String(keyBytes);
        
        // Log warning for demo purposes
        Console.WriteLine("⚠️  DEMO: Generated random JWT secret key. In production, use environment variables or secure key management.");
        
        return base64Key;
    }
}