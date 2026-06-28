using System.Net;

namespace DevCloud.Api.Middleware;

public sealed class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger, IHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled API error");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            object payload = environment.IsDevelopment()
                ? new { error = "Unexpected server error", detail = ex.Message, exception = ex.GetType().Name }
                : new { error = "Unexpected server error" };
            await context.Response.WriteAsJsonAsync(payload);
        }
    }
}
