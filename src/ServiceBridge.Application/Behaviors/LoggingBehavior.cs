using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace ServiceBridge.Application.Behaviors;

public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var correlationId = Guid.NewGuid();

        _logger.LogInformation(
            "Handling request {RequestName} with correlation ID {CorrelationId}",
            requestName,
            correlationId);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var response = await next();

            stopwatch.Stop();

            _logger.LogInformation(
                "Request {RequestName} completed successfully in {ElapsedMilliseconds}ms with correlation ID {CorrelationId}",
                requestName,
                stopwatch.ElapsedMilliseconds,
                correlationId);

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(ex,
                "Request {RequestName} failed after {ElapsedMilliseconds}ms with correlation ID {CorrelationId}",
                requestName,
                stopwatch.ElapsedMilliseconds,
                correlationId);

            throw;
        }
    }
}