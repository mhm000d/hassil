using Hassil.Api.Exceptions;

namespace Hassil.Api.Middleware;

public class ErrorHandlingMiddleware(
    RequestDelegate next,
    ILogger<ErrorHandlingMiddleware> logger,
    IHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (AppException ex)
        {
            await WriteErrorAsync(
                context,
                statusCode: ex.StatusCode,
                error:      ex.Message,
                code:       ex.Code,
                details:    ex.Details);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Unhandled exception. TraceId={TraceId}",
                context.TraceIdentifier);

            await WriteErrorAsync(
                context,
                statusCode: StatusCodes.Status500InternalServerError,
                error:      "An unexpected error occurred.",
                code:       "INTERNAL_ERROR",
                details:    environment.IsDevelopment() ? ex.Message : null);
        }
    }

    private static Task WriteErrorAsync(
        HttpContext context,
        int statusCode,
        string error,
        string code,
        object? details)
    {
        if (context.Response.HasStarted)
            throw new InvalidOperationException("The response has already started.");

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        return context.Response.WriteAsJsonAsync(new
        {
            error,
            code,
            details,
            traceId = context.TraceIdentifier
        });
    }
}
