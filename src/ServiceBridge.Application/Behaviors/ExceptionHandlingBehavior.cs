using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ServiceBridge.Application.Behaviors;

public class ExceptionHandlingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<ExceptionHandlingBehavior<TRequest, TResponse>> _logger;

    public ExceptionHandlingBehavior(ILogger<ExceptionHandlingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        try
        {
            return await next();
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(
                "Validation failed for request {RequestName}: {ValidationErrors}",
                typeof(TRequest).Name,
                string.Join(", ", ex.Errors.Select(e => e.ErrorMessage)));

            throw; // Re-throw validation exceptions as-is
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex,
                "Invalid argument provided for request {RequestName}: {Message}",
                typeof(TRequest).Name,
                ex.Message);

            throw; // Re-throw argument exceptions as-is
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex,
                "Invalid operation attempted for request {RequestName}: {Message}",
                typeof(TRequest).Name,
                ex.Message);

            throw; // Re-throw invalid operation exceptions as-is
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Unhandled exception occurred while processing request {RequestName}",
                typeof(TRequest).Name);

            throw; // Re-throw all other exceptions
        }
    }
}