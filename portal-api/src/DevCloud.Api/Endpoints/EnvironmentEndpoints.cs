using DevCloud.Application;
using DevCloud.Domain.Entities;
using DevCloud.Domain.Enums;
using DevCloud.Infrastructure.Data;
using DevCloud.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class EnvironmentEndpoints
{
    public static RouteGroupBuilder MapEnvironmentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/environments").WithTags("Environments").RequireAuthorization();
        group.MapGet("/", async (DevCloudDbContext db) => await db.DevEnvironments.OrderByDescending(x => x.LastActive).ToListAsync());
        group.MapPost("/start", async (StartEnvironmentRequest request, DevCloudDbContext db, DockerEnvironmentService docker, CancellationToken ct) =>
        {
            var env = new DevEnvironment
            {
                ProjectId = request.ProjectId,
                UserId = request.UserId,
                TechStack = request.TechStack,
                ContainerName = $"devcloud-{request.TechStack.ToString().ToLowerInvariant()}-{Guid.NewGuid():N}"[..28],
                Status = DevEnvironmentStatus.Running,
                LastActive = DateTimeOffset.UtcNow
            };
            await docker.StartAsync(env, ct);
            db.DevEnvironments.Add(env);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/environments/{env.Id}", env);
        });
        group.MapPost("/{id:guid}/stop", async (Guid id, DevCloudDbContext db, DockerEnvironmentService docker, CancellationToken ct) =>
        {
            var env = await db.DevEnvironments.FindAsync([id], ct);
            if (env is null) return Results.NotFound();
            await docker.StopAsync(env.ContainerName, ct);
            env.Status = DevEnvironmentStatus.Stopped;
            await db.SaveChangesAsync(ct);
            return Results.Ok(env);
        });
        group.MapPost("/{id:guid}/snapshot", async (Guid id, DevCloudDbContext db, DockerEnvironmentService docker, CancellationToken ct) =>
        {
            var env = await db.DevEnvironments.FindAsync([id], ct);
            if (env is null) return Results.NotFound();
            env.SnapshotName = $"{env.ContainerName}-snapshot";
            await docker.SnapshotAsync(env.ContainerName, env.SnapshotName, ct);
            env.Status = DevEnvironmentStatus.Snapshotted;
            await db.SaveChangesAsync(ct);
            return Results.Ok(env);
        });
        group.MapPost("/{id:guid}/restore", async (Guid id, DevCloudDbContext db) =>
        {
            var env = await db.DevEnvironments.FindAsync(id);
            if (env is null) return Results.NotFound();
            env.Status = DevEnvironmentStatus.Running;
            env.LastActive = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(env);
        });
        group.MapDelete("/{id:guid}", async (Guid id, DevCloudDbContext db, DockerEnvironmentService docker, CancellationToken ct) =>
        {
            var env = await db.DevEnvironments.FindAsync([id], ct);
            if (env is null) return Results.NotFound();
            await docker.RemoveAsync(env.ContainerName, ct);
            db.DevEnvironments.Remove(env);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });
        return group;
    }
}
