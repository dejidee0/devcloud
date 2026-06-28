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
        group.MapGet("/audit-logs", async (DevCloudDbContext db) => await db.AuditLogs.OrderByDescending(x => x.CreatedAt).Take(500).ToListAsync());
        return group;
    }
}
