using Microsoft.Extensions.DependencyInjection;
using ServiceBridge.Application.Services;
using ServiceBridge.Infrastructure.Services;

namespace ServiceBridge.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        // Register notification services
        // Note: SignalR registration will be handled in the API layer
        services.AddScoped<INotificationService, SignalRNotificationService>();
        
        // Register authentication services
        services.AddSingleton<IJwtConfigurationService, JwtConfigurationService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ISecurityLogger, SecurityLogger>();
        services.AddScoped<IBruteForceProtectionService, BruteForceProtectionService>();
        
        return services;
    }
}