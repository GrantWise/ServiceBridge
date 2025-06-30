namespace ServiceBridge.Application.Services;

public interface IJwtConfigurationService
{
    string GetSecretKey();
    string GetIssuer();
    string GetAudience();
    int GetExpirationMinutes();
    bool IsSecretKeySecure();
}