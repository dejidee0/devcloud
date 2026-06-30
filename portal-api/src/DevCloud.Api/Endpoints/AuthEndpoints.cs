using DevCloud.Api.Services;
using DevCloud.Application;
using DevCloud.Domain.Entities;
using DevCloud.Domain.Enums;
using DevCloud.Infrastructure.Auth;
using DevCloud.Infrastructure.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/login", async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> (
            LoginRequest request, DevCloudDbContext db, JwtTokenService tokens, AuditService audit, HttpContext http) =>
        {
            var user = await db.Users.SingleOrDefaultAsync(x => x.Email == request.Email && x.IsActive);
            if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)) return TypedResults.Unauthorized();

            user.LastLogin = DateTimeOffset.UtcNow;
            user.RefreshToken = JwtTokenService.CreateRefreshToken();
            var accessToken = tokens.CreateAccessToken(user);
            await db.SaveChangesAsync();
            WriteAuthCookies(http, accessToken, user.RefreshToken);
            await audit.LogSystemAsync("user.login", user.Email, null, user.Id, user.FullName);
            return TypedResults.Ok(new AuthResponse(user.Id, user.Email, user.FullName, user.Role, accessToken, user.RefreshToken));
        });

        group.MapPost("/setup", async (SetupOwnerRequest request, DevCloudDbContext db, JwtTokenService tokens, HttpContext http) =>
        {
            if (await db.Users.AnyAsync())
            {
                return Results.Json(new { error = "Setup has already been completed." }, statusCode: StatusCodes.Status410Gone);
            }

            var user = new User
            {
                Email = request.Email,
                FullName = request.FullName,
                Role = UserRole.Owner,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                RefreshToken = JwtTokenService.CreateRefreshToken()
            };
            var accessToken = tokens.CreateAccessToken(user);
            db.Users.Add(user);
            await db.SaveChangesAsync();
            WriteAuthCookies(http, accessToken, user.RefreshToken);
            return Results.Created($"/api/users/{user.Id}", new AuthResponse(user.Id, user.Email, user.FullName, user.Role, accessToken, user.RefreshToken));
        });

        group.MapPost("/register", async (RegisterRequest request, DevCloudDbContext db, JwtTokenService tokens, HttpContext http) =>
        {
            var hasUsers = await db.Users.AnyAsync();
            if (hasUsers && !http.User.IsInRole(UserRole.Owner.ToString())) return Results.Forbid();
            if (!hasUsers && request.Role != UserRole.Owner) return Results.BadRequest(new { error = "The first DevCloud user must be an Owner." });
            if (await db.Users.AnyAsync(x => x.Email == request.Email)) return Results.Conflict(new { error = "Email already exists" });

            var user = new User
            {
                Email = request.Email,
                FullName = request.FullName,
                Role = request.Role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                RefreshToken = JwtTokenService.CreateRefreshToken()
            };
            var accessToken = tokens.CreateAccessToken(user);
            db.Users.Add(user);
            await db.SaveChangesAsync();
            WriteAuthCookies(http, accessToken, user.RefreshToken);
            return Results.Created($"/api/users/{user.Id}", new AuthResponse(user.Id, user.Email, user.FullName, user.Role, accessToken, user.RefreshToken));
        });

        group.MapPost("/refresh", async Task<Results<Ok, UnauthorizedHttpResult>> (
            DevCloudDbContext db, JwtTokenService tokens, HttpContext http) =>
        {
            var refresh = http.Request.Cookies["devcloud_refresh"];
            if (string.IsNullOrWhiteSpace(refresh)) return TypedResults.Unauthorized();
            var user = await db.Users.SingleOrDefaultAsync(x => x.RefreshToken == refresh && x.IsActive);
            if (user is null) return TypedResults.Unauthorized();
            user.RefreshToken = JwtTokenService.CreateRefreshToken();
            var accessToken = tokens.CreateAccessToken(user);
            await db.SaveChangesAsync();
            WriteAuthCookies(http, accessToken, user.RefreshToken);
            return TypedResults.Ok();
        });

        group.MapPost("/logout", async (DevCloudDbContext db, HttpContext http) =>
        {
            var refresh = http.Request.Cookies["devcloud_refresh"];
            var user = await db.Users.SingleOrDefaultAsync(x => x.RefreshToken == refresh);
            if (user is not null) user.RefreshToken = null;
            http.Response.Cookies.Delete("devcloud_access");
            http.Response.Cookies.Delete("devcloud_refresh");
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();

        return group;
    }

    private static void WriteAuthCookies(HttpContext http, string accessToken, string refreshToken)
    {
        var secure = http.Request.IsHttps;
        var hasCrossSiteOrigin = !string.IsNullOrWhiteSpace(http.Request.Headers.Origin.ToString());
        var sameSite = secure && hasCrossSiteOrigin ? SameSiteMode.None : SameSiteMode.Lax;
        http.Response.Cookies.Append("devcloud_access", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = sameSite,
            Expires = DateTimeOffset.UtcNow.AddMinutes(30)
        });
        http.Response.Cookies.Append("devcloud_refresh", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = sameSite,
            Expires = DateTimeOffset.UtcNow.AddDays(14)
        });
    }
}
