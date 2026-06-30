using System.Text.Json;
using DevCloud.Application;
using DevCloud.Domain.Entities;
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

        // Real network security posture read over SSH (public IP, geo, ports, firewall, DNS), cached 60s.
        group.MapGet("/network-verification", async (NetworkVerificationService service, DevCloudDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("DEVCLOUD_SSH_KEY")))
            {
                return Results.Json(new { error = "DEVCLOUD_SSH_KEY is not configured on the server." }, statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            try
            {
                var (result, fresh) = await service.GetAsync(ct);
                if (fresh)
                {
                    // Persist a compact history record (no SignalR broadcast — avoids feed noise).
                    db.AuditLogs.Add(new AuditLog
                    {
                        Action = "network.verify",
                        Resource = result.PublicIp ?? "unknown",
                        Details = JsonSerializer.Serialize(new { status = result.Status, openPorts = result.OpenPorts.Count, dnsLeak = result.DnsLeakDetected, firewall = result.FirewallActive })
                    });
                    await db.SaveChangesAsync(ct);
                }
                return Results.Ok(result);
            }
            catch (Exception ex)
            {
                return Results.Json(new { error = $"Failed to verify network: {ex.Message}", status = "unable to verify" }, statusCode: StatusCodes.Status502BadGateway);
            }
        });

        // Last 20 network verification checks for the status timeline.
        group.MapGet("/network-history", async (DevCloudDbContext db, CancellationToken ct) =>
        {
            var logs = await db.AuditLogs
                .Where(a => a.Action == "network.verify")
                .OrderByDescending(a => a.CreatedAt)
                .Take(20)
                .ToListAsync(ct);

            var history = logs.Select(l =>
            {
                string status = "unknown";
                try
                {
                    using var doc = JsonDocument.Parse(l.Details ?? "{}");
                    if (doc.RootElement.TryGetProperty("status", out var s)) status = s.GetString() ?? "unknown";
                }
                catch (JsonException) { }
                return new { at = l.CreatedAt, status, ip = l.Resource };
            }).ToList();

            return Results.Ok(history);
        });

        group.MapGet("/audit-logs", async (DevCloudDbContext db) => await db.AuditLogs.OrderByDescending(x => x.CreatedAt).Take(500).ToListAsync());
        return group;
    }
}
