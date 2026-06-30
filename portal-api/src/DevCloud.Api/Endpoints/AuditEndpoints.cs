using DevCloud.Application;
using DevCloud.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class AuditEndpoints
{
    public static RouteGroupBuilder MapAuditEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/audit-logs").WithTags("Audit").RequireAuthorization(RolePolicies.Leadership);

        group.MapGet("/", async (
            Guid? userId, string? action, DateTimeOffset? from, DateTimeOffset? to, int? page, int? pageSize,
            DevCloudDbContext db, CancellationToken ct) =>
        {
            var take = Math.Clamp(pageSize ?? 100, 1, 500);
            var skip = Math.Max(page ?? 0, 0) * take;

            var query = db.AuditLogs.AsQueryable();
            if (userId is { } uid) query = query.Where(a => a.UserId == uid);
            if (!string.IsNullOrWhiteSpace(action)) query = query.Where(a => a.Action == action);
            if (from is { } f) query = query.Where(a => a.CreatedAt >= f);
            if (to is { } t) query = query.Where(a => a.CreatedAt <= t);

            var total = await query.CountAsync(ct);

            var pageRows = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip(skip).Take(take)
                .Select(a => new { a.Id, a.UserId, a.Action, a.Resource, a.Details, a.IpAddress, a.CreatedAt })
                .ToListAsync(ct);

            var userIds = pageRows.Where(r => r.UserId != null).Select(r => r.UserId!.Value).Distinct().ToList();
            var names = await db.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName, ct);

            var rows = pageRows.Select(r => new
            {
                r.Id,
                r.UserId,
                userName = r.UserId is { } uid2 && names.TryGetValue(uid2, out var n) ? n : null,
                r.Action,
                r.Resource,
                r.Details,
                r.IpAddress,
                r.CreatedAt
            }).ToList();

            // Distinct action types for the filter dropdown.
            var actions = await db.AuditLogs.Select(a => a.Action).Distinct().OrderBy(a => a).ToListAsync(ct);

            return Results.Ok(new { items = rows, total, page = page ?? 0, pageSize = take, actions });
        });

        return group;
    }
}
