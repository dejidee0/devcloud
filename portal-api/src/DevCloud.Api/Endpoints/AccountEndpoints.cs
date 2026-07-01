using System.Security.Claims;
using DevCloud.Application;
using DevCloud.Infrastructure.Auth;
using DevCloud.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class AccountEndpoints
{
    public static RouteGroupBuilder MapAccountEndpoints(this WebApplication app)
    {
        // Any authenticated user manages their own account.
        var group = app.MapGroup("/api/account").WithTags("Account").RequireAuthorization(RolePolicies.Authenticated);

        group.MapGet("/profile", async (DevCloudDbContext db, HttpContext http, CancellationToken ct) =>
        {
            var uid = CurrentUserId(http);
            if (uid is null) return Results.Unauthorized();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == uid, ct);
            if (user is null) return Results.NotFound();

            var projectsOwned = await db.Projects.CountAsync(p => p.OwnerId == uid, ct);
            var teamMembers = await db.Users.CountAsync(ct);
            var environments = await db.DevEnvironments.CountAsync(e => e.UserId == uid, ct);

            return Results.Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                role = user.Role.ToString(),
                organization = user.Organization ?? "Codewithmonk Technology",
                user.CreatedAt,
                user.LastLogin,
                projectsOwned,
                teamMembers,
                environments
            });
        });

        group.MapPut("/profile", async (UpdateAccountRequest request, DevCloudDbContext db, HttpContext http, CancellationToken ct) =>
            await UpdateProfile(request, db, http, ct));

        // Alias used by the Account Details "Organization" save.
        group.MapPut("/organization", async (UpdateAccountRequest request, DevCloudDbContext db, HttpContext http, CancellationToken ct) =>
            await UpdateProfile(new UpdateAccountRequest(null, request.Organization), db, http, ct));

        group.MapPost("/change-password", async (ChangePasswordRequest request, DevCloudDbContext db, HttpContext http, CancellationToken ct) =>
        {
            var uid = CurrentUserId(http);
            if (uid is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
                return Results.BadRequest(new { error = "New password must be at least 8 characters." });

            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == uid, ct);
            if (user is null) return Results.NotFound();
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return Results.BadRequest(new { error = "Current password is incorrect." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { updated = true });
        });

        group.MapGet("/sessions", async (DevCloudDbContext db, HttpContext http, CancellationToken ct) =>
        {
            var uid = CurrentUserId(http);
            if (uid is null) return Results.Unauthorized();
            var sessions = await db.AuditLogs
                .Where(a => a.UserId == uid && a.Action == "user.login")
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .Select(a => new { a.Id, a.IpAddress, a.CreatedAt })
                .ToListAsync(ct);
            return Results.Ok(sessions);
        });

        group.MapPost("/revoke-sessions", async (DevCloudDbContext db, JwtTokenService tokens, HttpContext http, CancellationToken ct) =>
        {
            var uid = CurrentUserId(http);
            if (uid is null) return Results.Unauthorized();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == uid, ct);
            if (user is null) return Results.NotFound();

            // Rotate the refresh token — invalidates other devices. Re-issue cookies so this session stays signed in.
            user.RefreshToken = JwtTokenService.CreateRefreshToken();
            await db.SaveChangesAsync(ct);
            var access = tokens.CreateAccessToken(user);
            WriteAuthCookies(http, access, user.RefreshToken);
            return Results.Ok(new { revoked = true });
        });

        group.MapPost("/export", async (DevCloudDbContext db, HttpContext http, CancellationToken ct) =>
        {
            var uid = CurrentUserId(http);
            if (uid is null) return Results.Unauthorized();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == uid, ct);
            if (user is null) return Results.NotFound();

            var projects = await db.Projects.Where(p => p.OwnerId == uid).ToListAsync(ct);
            var tickets = await db.Tickets.Where(t => t.CreatedById == uid || t.AssignedToId == uid).ToListAsync(ct);
            var sessions = await db.Sessions.Where(s => s.UserId == uid).ToListAsync(ct);

            var export = new
            {
                exportedAt = DateTimeOffset.UtcNow,
                account = new { user.Id, user.FullName, user.Email, role = user.Role.ToString(), organization = user.Organization, user.CreatedAt },
                projects,
                tickets,
                sessions
            };
            return Results.Ok(export);
        });

        return group;
    }

    private static async Task<IResult> UpdateProfile(UpdateAccountRequest request, DevCloudDbContext db, HttpContext http, CancellationToken ct)
    {
        var uid = CurrentUserId(http);
        if (uid is null) return Results.Unauthorized();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == uid, ct);
        if (user is null) return Results.NotFound();

        if (!string.IsNullOrWhiteSpace(request.FullName)) user.FullName = request.FullName.Trim();
        if (request.Organization is not null) user.Organization = request.Organization.Trim();
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { user.Id, user.FullName, organization = user.Organization });
    }

    private static Guid? CurrentUserId(HttpContext http)
    {
        var id = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var parsed) ? parsed : null;
    }

    private static void WriteAuthCookies(HttpContext http, string accessToken, string refreshToken)
    {
        var secure = http.Request.IsHttps;
        var hasCrossSiteOrigin = !string.IsNullOrWhiteSpace(http.Request.Headers.Origin.ToString());
        var sameSite = secure && hasCrossSiteOrigin ? SameSiteMode.None : SameSiteMode.Lax;
        http.Response.Cookies.Append("devcloud_access", accessToken, new CookieOptions
        {
            HttpOnly = true, Secure = secure, SameSite = sameSite, Expires = DateTimeOffset.UtcNow.AddMinutes(30)
        });
        http.Response.Cookies.Append("devcloud_refresh", refreshToken, new CookieOptions
        {
            HttpOnly = true, Secure = secure, SameSite = sameSite, Expires = DateTimeOffset.UtcNow.AddDays(14)
        });
    }
}
