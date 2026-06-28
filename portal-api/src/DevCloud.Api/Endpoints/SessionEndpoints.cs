using DevCloud.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class SessionEndpoints
{
    public static RouteGroupBuilder MapSessionEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/sessions").WithTags("Sessions").RequireAuthorization();
        group.MapGet("/", async (Guid? userId, Guid? projectId, DevCloudDbContext db) =>
            await db.Sessions.Where(x => (userId == null || x.UserId == userId) && (projectId == null || x.ProjectId == projectId))
                .OrderByDescending(x => x.StartedAt).ToListAsync());
        group.MapGet("/summary", async (DevCloudDbContext db) =>
            await db.Sessions.GroupBy(x => new { x.UserId, x.ProjectId })
                .Select(x => new { x.Key.UserId, x.Key.ProjectId, Hours = x.Sum(s => s.DurationMinutes) / 60.0 })
                .ToListAsync());
        return group;
    }
}
