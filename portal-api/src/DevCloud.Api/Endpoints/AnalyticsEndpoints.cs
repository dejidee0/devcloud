using System.Globalization;
using DevCloud.Application;
using DevCloud.Domain.Enums;
using DevCloud.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class AnalyticsEndpoints
{
    public static RouteGroupBuilder MapAnalyticsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/analytics").WithTags("Analytics").RequireAuthorization(RolePolicies.Leadership);

        group.MapGet("/overview", async (int? days, DevCloudDbContext db, CancellationToken ct) =>
        {
            var window = Math.Clamp(days ?? 30, 1, 365);
            var since = DateTimeOffset.UtcNow.AddDays(-window);
            var weekAnchor = DateTimeOffset.UtcNow;

            var audits = await db.AuditLogs.Where(a => a.CreatedAt >= since).Select(a => new { a.Action, a.CreatedAt }).ToListAsync(ct);
            var envs = await db.DevEnvironments.Select(e => new { e.TechStack, e.Status }).ToListAsync(ct);
            var deployments = await db.Deployments.Select(d => new { d.Status, d.StartedAt }).ToListAsync(ct);
            var sessions = await db.Sessions.Where(s => s.StartedAt >= weekAnchor.AddDays(-56)).Select(s => new { s.DurationMinutes, s.StartedAt, s.UserId }).ToListAsync(ct);
            var tickets = await db.Tickets.Select(t => new { t.CreatedAt, t.UpdatedAt, t.Status }).ToListAsync(ct);
            var snapshots = await db.ServerMetricSnapshots
                .Where(s => s.CapturedAt >= DateTimeOffset.UtcNow.AddHours(-24))
                .OrderBy(s => s.CapturedAt)
                .ToListAsync(ct);

            // 1. Team activity over time (per day)
            var teamActivity = Enumerable.Range(0, window)
                .Select(i => DateTimeOffset.UtcNow.Date.AddDays(-(window - 1 - i)))
                .Select(day => new
                {
                    date = day.ToString("yyyy-MM-dd"),
                    count = audits.Count(a => a.CreatedAt.UtcDateTime.Date == day)
                }).ToList();

            // 2. Environment usage by stack
            var envByStack = envs.GroupBy(e => e.TechStack.ToString())
                .Select(g => new { stack = g.Key, count = g.Count() }).OrderByDescending(x => x.count).ToList();

            // 3. Deployment success rate
            var totalDeploys = deployments.Count;
            var successDeploys = deployments.Count(d => d.Status == DeploymentStatus.Success);
            var deploymentSuccess = new
            {
                success = successDeploys,
                total = totalDeploys,
                rate = totalDeploys == 0 ? 0 : (int)Math.Round(successDeploys * 100.0 / totalDeploys)
            };

            // 4. Session duration trends (per ISO week, last 8 weeks, total hours)
            var sessionTrends = Enumerable.Range(0, 8).Reverse()
                .Select(w => weekAnchor.AddDays(-7 * w))
                .Select(weekDate => new
                {
                    week = $"W{IsoWeek(weekDate)}",
                    hours = Math.Round(sessions
                        .Where(s => IsoWeek(s.StartedAt) == IsoWeek(weekDate) && s.StartedAt.Year == weekDate.Year)
                        .Sum(s => s.DurationMinutes) / 60.0, 1)
                }).ToList();

            // 5. Server resource history (last 24h snapshots)
            var resourceHistory = snapshots.Select(s => new
            {
                at = s.CapturedAt,
                cpu = Math.Round(s.CpuPercent, 1),
                ram = s.RamTotalMb == 0 ? 0 : Math.Round(s.RamUsedMb * 100.0 / s.RamTotalMb, 1),
                disk = s.DiskTotalGb == 0 ? 0 : Math.Round(s.DiskUsedGb * 100.0 / s.DiskTotalGb, 1)
            }).ToList();

            // 6. Tickets velocity (created vs closed, last 8 weeks)
            var ticketsVelocity = Enumerable.Range(0, 8).Reverse()
                .Select(w => weekAnchor.AddDays(-7 * w))
                .Select(weekDate => new
                {
                    week = $"W{IsoWeek(weekDate)}",
                    created = tickets.Count(t => SameWeek(t.CreatedAt, weekDate)),
                    closed = tickets.Count(t => t.Status == TicketStatus.Done && SameWeek(t.UpdatedAt, weekDate))
                }).ToList();

            // 7. AI usage breakdown
            var aiUsage = audits.Where(a => a.Action.StartsWith("ai.", StringComparison.OrdinalIgnoreCase))
                .GroupBy(a => a.Action)
                .Select(g => new { feature = FriendlyAi(g.Key), count = g.Count() })
                .OrderByDescending(x => x.count).ToList();

            var summary = new
            {
                activeEnvironments = envs.Count(e => e.Status == DevEnvironmentStatus.Running),
                deployments = totalDeploys,
                hoursLogged = Math.Round(sessions.Where(s => s.StartedAt >= since).Sum(s => s.DurationMinutes) / 60.0, 1),
                aiCalls = audits.Count(a => a.Action.StartsWith("ai.", StringComparison.OrdinalIgnoreCase))
            };

            return Results.Ok(new
            {
                window,
                summary,
                teamActivity,
                envByStack,
                deploymentSuccess,
                sessionTrends,
                resourceHistory,
                ticketsVelocity,
                aiUsage
            });
        });

        return group;
    }

    private static int IsoWeek(DateTimeOffset date) =>
        ISOWeek.GetWeekOfYear(date.UtcDateTime);

    private static bool SameWeek(DateTimeOffset a, DateTimeOffset b) =>
        IsoWeek(a) == IsoWeek(b) && a.Year == b.Year;

    private static string FriendlyAi(string action) => action switch
    {
        "ai.review" => "Code Review",
        "ai.build-environment" => "Env Builder",
        "ai.generate-tickets" => "Tickets",
        "ai.security-scan" => "Security",
        "ai.generate-report" => "Reports",
        _ => action
    };
}
