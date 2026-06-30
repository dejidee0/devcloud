using DevCloud.Api.Services;
using DevCloud.Application;
using DevCloud.Domain.Entities;
using DevCloud.Domain.Enums;
using DevCloud.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class DeploymentEndpoints
{
    public static RouteGroupBuilder MapDeploymentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/deployments").WithTags("Deployments").RequireAuthorization();
        group.MapGet("/", async (Guid? projectId, DevCloudDbContext db) =>
            await db.Deployments.Where(x => projectId == null || x.ProjectId == projectId).OrderByDescending(x => x.StartedAt).ToListAsync());
        group.MapPost("/", async (TriggerDeploymentRequest request, DevCloudDbContext db, AuditService audit, HttpContext http) =>
        {
            var deployment = new Deployment
            {
                ProjectId = request.ProjectId,
                Environment = request.Environment,
                CommitHash = request.CommitHash,
                DeployedById = request.DeployedById,
                Status = DeploymentStatus.Pending,
                Logs = "Deployment queued."
            };
            db.Deployments.Add(deployment);
            await db.SaveChangesAsync();
            await audit.LogAsync("deployment.triggered", $"{request.Environment}", $"Commit: {request.CommitHash ?? "n/a"}", http);
            return Results.Created($"/api/deployments/{deployment.Id}", deployment);
        }).RequireAuthorization(RolePolicies.Leadership);
        group.MapPost("/{id:guid}/rollback", async (Guid id, DevCloudDbContext db) =>
        {
            var deployment = await db.Deployments.FindAsync(id);
            if (deployment is null) return Results.NotFound();
            deployment.Logs += Environment.NewLine + "Rollback requested.";
            await db.SaveChangesAsync();
            return Results.Ok(deployment);
        }).RequireAuthorization(RolePolicies.Leadership);
        group.MapGet("/{id:guid}/logs", async (Guid id, DevCloudDbContext db) =>
            await db.Deployments.FindAsync(id) is { } deployment ? Results.Text(deployment.Logs ?? "") : Results.NotFound());
        return group;
    }
}
