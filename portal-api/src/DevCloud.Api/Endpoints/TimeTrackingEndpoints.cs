using DevCloud.Application;
using DevCloud.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class TimeTrackingEndpoints
{
    public static RouteGroupBuilder MapTimeTrackingEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/time-tracking").WithTags("TimeTracking").RequireAuthorization(RolePolicies.Leadership);

        group.MapGet("/summary", async (DateTimeOffset? from, DateTimeOffset? to, DevCloudDbContext db, CancellationToken ct) =>
        {
            var now = DateTimeOffset.UtcNow;
            var rangeFrom = from ?? now.AddDays(-90);
            var rangeTo = to ?? now;

            var users = await db.Users.ToDictionaryAsync(u => u.Id, u => u.FullName, ct);
            var projects = await db.Projects.ToDictionaryAsync(p => p.Id, p => p.Name, ct);

            var sessions = await db.Sessions
                .Where(s => s.StartedAt >= rangeFrom && s.StartedAt <= rangeTo)
                .OrderByDescending(s => s.StartedAt)
                .Select(s => new { s.UserId, s.ProjectId, s.StartedAt, s.DurationMinutes })
                .ToListAsync(ct);

            string DevName(Guid id) => users.TryGetValue(id, out var n) ? n : "Unknown";
            string ProjName(Guid? id) => id is { } pid && projects.TryGetValue(pid, out var n) ? n : "—";

            var weekStart = now.AddDays(-7);
            var monthStart = now.AddDays(-30);
            var weekHours = Math.Round(sessions.Where(s => s.StartedAt >= weekStart).Sum(s => s.DurationMinutes) / 60.0, 1);
            var monthHours = Math.Round(sessions.Where(s => s.StartedAt >= monthStart).Sum(s => s.DurationMinutes) / 60.0, 1);

            var mostActive = sessions
                .GroupBy(s => s.UserId)
                .Select(g => new { user = DevName(g.Key), minutes = g.Sum(s => s.DurationMinutes) })
                .OrderByDescending(x => x.minutes)
                .FirstOrDefault();

            var rows = sessions.Select(s => new
            {
                developer = DevName(s.UserId),
                project = ProjName(s.ProjectId),
                date = s.StartedAt,
                durationMinutes = s.DurationMinutes
            }).ToList();

            var perDeveloper = sessions
                .GroupBy(s => s.UserId)
                .Select(g => new { developer = DevName(g.Key), hours = Math.Round(g.Sum(s => s.DurationMinutes) / 60.0, 1) })
                .OrderByDescending(x => x.hours)
                .ToList();

            return Results.Ok(new
            {
                weekHours,
                monthHours,
                mostActiveDeveloper = mostActive?.user,
                mostActiveHours = mostActive is null ? 0 : Math.Round(mostActive.minutes / 60.0, 1),
                rows,
                perDeveloper
            });
        });

        return group;
    }
}
