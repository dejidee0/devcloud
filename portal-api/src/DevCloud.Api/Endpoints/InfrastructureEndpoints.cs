using DevCloud.Application;
using DevCloud.Infrastructure.Data;
using DevCloud.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class InfrastructureEndpoints
{
    public static RouteGroupBuilder MapInfrastructureEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/infrastructure").WithTags("Infrastructure").RequireAuthorization(RolePolicies.OwnerOnly);
        group.MapPost("/lockdown", async (InfrastructureStatusService service, CancellationToken ct) => Results.Ok(new { output = await service.LockdownAsync(ct) }));
        group.MapPost("/unlock", async (InfrastructureStatusService service, CancellationToken ct) => Results.Ok(new { output = await service.UnlockAsync(ct) }));
        group.MapGet("/status", async (InfrastructureStatusService service, CancellationToken ct) => Results.Ok(await service.GetStatusAsync(ct)));

        // Real server stats (CPU / RAM / Disk) read over SSH from the Hetzner host, cached 30s.
        group.MapGet("/stats", async (ServerMonitorService monitor, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("DEVCLOUD_SSH_KEY")))
            {
                return Results.Json(new { error = "DEVCLOUD_SSH_KEY is not configured on the server." }, statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            try
            {
                var stats = await monitor.GetStatsAsync(ct);
                return Results.Ok(stats);
            }
            catch (Exception ex)
            {
                return Results.Json(new { error = $"Failed to read server stats: {ex.Message}" }, statusCode: StatusCodes.Status502BadGateway);
            }
        });

        group.MapGet("/audit-logs", async (DevCloudDbContext db) => await db.AuditLogs.OrderByDescending(x => x.CreatedAt).Take(500).ToListAsync());
        return group;
    }
}
