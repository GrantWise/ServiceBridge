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
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IUserService, UserService>();
        
        return services;
    }
}