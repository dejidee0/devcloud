using DevCloud.Api.Services;
using DevCloud.Application;
using DevCloud.Domain.Entities;
using DevCloud.Domain.Enums;
using DevCloud.Infrastructure.Data;
using DevCloud.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class DeploymentEndpoints
{
    public static RouteGroupBuilder MapDeploymentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/deployments").WithTags("Deployments").RequireAuthorization();
        group.MapGet("/", async (Guid? projectId, DevCloudDbContext db) =>
            await db.Deployments.Where(x => projectId == null || x.ProjectId == projectId).OrderByDescending(x => x.StartedAt).ToListAsync());
        group.MapPost("/", async (TriggerDeploymentRequest request, DevCloudDbContext db, SshCommandRunner ssh, AuditService audit, HttpContext http, CancellationToken ct) =>
        {
            var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct);
            var deployment = new Deployment
            {
                ProjectId = request.ProjectId,
                Environment = request.Environment,
                CommitHash = request.CommitHash,
                DeployedById = request.DeployedById,
                Status = DeploymentStatus.Running,
                Logs = "Deployment started."
            };
            db.Deployments.Add(deployment);
            await db.SaveChangesAsync(ct);
            await audit.LogAsync("deployment.triggered", $"{request.Environment}", $"Commit: {request.CommitHash ?? "n/a"}", http);

            // Best-effort real deploy: pull latest + rebuild the project's containers on the server.
            if (ssh.IsConfigured && project is not null)
            {
                var baseDir = Environment.GetEnvironmentVariable("DEVCLOUD_PROJECTS_DIR") ?? "/srv";
                var safeName = new string(project.Name.Where(c => char.IsLetterOrDigit(c) || c is '-' or '_').ToArray());
                var script =
                    $"set -e; cd {baseDir}/{safeName} 2>/dev/null || cd /opt/{safeName} 2>/dev/null || {{ echo 'project directory not found'; exit 2; }}; " +
                    "git pull 2>&1 | tail -n 5; " +
                    "(docker compose up -d --build 2>&1 || docker-compose up -d --build 2>&1) | tail -n 15";
                try
                {
                    var output = await ssh.RunAsync(script, ct);
                    var failed = output.Contains("not found") || output.Contains("error", StringComparison.OrdinalIgnoreCase) || output.Contains("fatal", StringComparison.OrdinalIgnoreCase);
                    deployment.Status = failed ? DeploymentStatus.Failed : DeploymentStatus.Success;
                    deployment.Logs = output.Length > 4000 ? output[..4000] : output;
                    deployment.CompletedAt = DateTimeOffset.UtcNow;
                }
                catch (Exception ex)
                {
                    deployment.Status = DeploymentStatus.Failed;
                    deployment.Logs = $"Deploy failed: {ex.Message}";
                    deployment.CompletedAt = DateTimeOffset.UtcNow;
                }
            }
            else
            {
                deployment.Status = DeploymentStatus.Pending;
                deployment.Logs = ssh.IsConfigured ? "Project not found." : "SSH key not configured — recorded only.";
            }

            await db.SaveChangesAsync(ct);
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
