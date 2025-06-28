using FluentValidation;
using System.Net;
using System.Text.Json;

namespace ServiceBridge.Api.Middleware;

public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred while processing the request");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        int statusCode;
        object response;

        switch (exception)
        {
            case ValidationException validationEx:
                statusCode = (int)HttpStatusCode.BadRequest;
                response = new
                {
                    title = "Validation Error",
                    status = statusCode,
                    errors = validationEx.Errors.GroupBy(e => e.PropertyName)
                        .ToDictionary(
                            g => g.Key,
                            g => g.Select(e => e.ErrorMessage).ToArray()
                        )
                };
                break;

            case ArgumentException argEx:
                statusCode = (int)HttpStatusCode.BadRequest;
                response = new
                {
                    title = "Invalid Argument",
                    status = statusCode,
                    detail = argEx.Message
                };
                break;

            case InvalidOperationException invalidOpEx:
                statusCode = (int)HttpStatusCode.BadRequest;
                response = new
                {
                    title = "Invalid Operation",
                    status = statusCode,
                    detail = invalidOpEx.Message
                };
                break;

            default:
                statusCode = (int)HttpStatusCode.InternalServerError;
                response = new
                {
                    title = "Internal Server Error",
                    status = statusCode,
                    detail = "An unexpected error occurred. Please try again later."
                };
                break;
        }

        context.Response.StatusCode = statusCode;

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}