using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using ServiceBridge.Application.Behaviors;
using ServiceBridge.Application.Mappings;
using System.Reflection;

namespace ServiceBridge.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();
        
        // Register AutoMapper
        services.AddAutoMapper(typeof(MappingProfile));
        
        // Register MediatR
        services.AddMediatR(assembly);
        
        // Register FluentValidation
        services.AddValidatorsFromAssembly(assembly);
        
        // Register MediatR behaviors (order matters - they wrap each other)
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ExceptionHandlingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        
        // Future additions:
        // - Application services will be registered here
        
        return services;
    }
}