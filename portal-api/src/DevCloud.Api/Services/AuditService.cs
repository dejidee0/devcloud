using System.Security.Claims;
using DevCloud.Api.Hubs;
using DevCloud.Domain.Entities;
using DevCloud.Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;

namespace DevCloud.Api.Services;

/// <summary>Formatted, real-time activity item pushed to dashboard clients.</summary>
public sealed record ActivityItem(
    Guid Id,
    string Action,
    string Resource,
    string Icon,
    string Title,
    string? Detail,
    string? UserName,
    DateTimeOffset At);

/// <summary>
/// Writes audit records for meaningful events and broadcasts a nicely-formatted
/// activity item to connected dashboard clients via SignalR.
/// </summary>
public sealed class AuditService
{
    private readonly DevCloudDbContext _db;
    private readonly IHubContext<ActivityHub> _hub;

    public AuditService(DevCloudDbContext db, IHubContext<ActivityHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    public async Task LogAsync(string action, string resource, string? detail, HttpContext? http, CancellationToken cancellationToken = default)
    {
        Guid? userId = null;
        string? userName = null;
        if (http?.User is { } principal && principal.Identity?.IsAuthenticated == true)
        {
            var id = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(id, out var parsed)) userId = parsed;
            userName = principal.FindFirstValue(ClaimTypes.Name);
        }

        var log = new AuditLog
        {
            Action = action,
            Resource = resource,
            Details = detail,
            UserId = userId,
            IpAddress = http?.Connection.RemoteIpAddress?.ToString()
        };
        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(cancellationToken);

        await BroadcastAsync(log, userName, cancellationToken);
    }

    /// <summary>Used by background/system jobs that have no HttpContext.</summary>
    public async Task LogSystemAsync(string action, string resource, string? detail, Guid? userId, string? userName, CancellationToken cancellationToken = default)
    {
        var log = new AuditLog { Action = action, Resource = resource, Details = detail, UserId = userId };
        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(cancellationToken);
        await BroadcastAsync(log, userName, cancellationToken);
    }

    private Task BroadcastAsync(AuditLog log, string? userName, CancellationToken cancellationToken)
    {
        var item = new ActivityItem(
            log.Id,
            log.Action,
            log.Resource,
            IconFor(log.Action),
            TitleFor(log.Action, userName, log.Resource),
            log.Details,
            userName,
            log.CreatedAt);

        return _hub.Clients.All.SendAsync("activity", item, cancellationToken);
    }

    private static string IconFor(string action) => action.Split('.', '_')[0].ToLowerInvariant() switch
    {
        "user" or "login" or "auth" => "user",
        "project" => "folder-kanban",
        "ticket" => "list-checks",
        "deployment" or "deploy" => "rocket",
        "environment" or "env" => "boxes",
        "ai" => "sparkles",
        "security" or "scan" => "shield",
        "infrastructure" or "lockdown" => "lock",
        _ => "activity"
    };

    private static string TitleFor(string action, string? userName, string resource)
    {
        var who = string.IsNullOrWhiteSpace(userName) ? "Someone" : userName;
        return action switch
        {
            "user.login" => $"{who} logged in",
            "user.created" => $"{who} created a new user",
            "project.created" => $"{who} created a project",
            "project.updated" => $"{who} updated a project",
            "ticket.created" => $"{who} created a ticket",
            "ticket.updated" => $"{who} updated a ticket",
            "deployment.triggered" => $"{who} triggered a deployment",
            "environment.started" => $"{who} started an environment",
            "environment.stopped" => $"{who} stopped an environment",
            "ai.review" => $"{who} ran an AI code review",
            "ai.build-environment" => $"{who} used the AI environment builder",
            "ai.generate-tickets" => $"{who} generated tickets with AI",
            "ai.security-scan" => $"{who} ran an AI security scan",
            "ai.generate-report" => $"{who} generated a project report",
            "security.scan" => "Automated security scan completed",
            _ => $"{who} • {action} ({resource})"
        };
    }
}
