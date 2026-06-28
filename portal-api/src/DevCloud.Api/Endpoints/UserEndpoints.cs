using DevCloud.Application;
using DevCloud.Domain.Entities;
using DevCloud.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/users").WithTags("Users").RequireAuthorization(RolePolicies.Leadership);

        group.MapGet("/", async (DevCloudDbContext db) => await db.Users.OrderBy(x => x.FullName).ToListAsync());
        group.MapPost("/", async (RegisterRequest request, DevCloudDbContext db) =>
        {
            var user = new User
            {
                Email = request.Email,
                FullName = request.FullName,
                Role = request.Role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Created($"/api/users/{user.Id}", user);
        }).RequireAuthorization(RolePolicies.OwnerOnly);
        group.MapPut("/{id:guid}", async (Guid id, UpsertUserRequest request, DevCloudDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();
            user.Email = request.Email;
            user.FullName = request.FullName;
            user.Role = request.Role;
            user.IsActive = request.IsActive;
            await db.SaveChangesAsync();
            return Results.Ok(user);
        });
        group.MapDelete("/{id:guid}", async (Guid id, DevCloudDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();
            db.Users.Remove(user);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(RolePolicies.OwnerOnly);
        group.MapPost("/{id:guid}/lock", async (Guid id, DevCloudDbContext db) => await SetActive(id, false, db));
        group.MapPost("/{id:guid}/unlock", async (Guid id, DevCloudDbContext db) => await SetActive(id, true, db));
        return group;
    }

    private static async Task<IResult> SetActive(Guid id, bool active, DevCloudDbContext db)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return Results.NotFound();
        user.IsActive = active;
        await db.SaveChangesAsync();
        return Results.Ok(user);
    }
}
