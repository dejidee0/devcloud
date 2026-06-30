using DevCloud.Api.Services;
using DevCloud.Application;
using DevCloud.Domain.Entities;
using DevCloud.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class ProjectEndpoints
{
    public static RouteGroupBuilder MapProjectEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/projects").WithTags("Projects").RequireAuthorization();
        group.MapGet("/", async (DevCloudDbContext db) => await db.Projects.OrderByDescending(x => x.CreatedAt).ToListAsync());
        group.MapGet("/{id:guid}", async (Guid id, DevCloudDbContext db) =>
            await db.Projects.FindAsync(id) is { } project ? Results.Ok(project) : Results.NotFound());
        group.MapPost("/", async (UpsertProjectRequest request, DevCloudDbContext db, AuditService audit, HttpContext http) =>
        {
            var project = new Project
            {
                Name = request.Name,
                Description = request.Description,
                ClientName = request.ClientName,
                Status = request.Status,
                TechStack = request.TechStack,
                OwnerId = request.OwnerId
            };
            db.Projects.Add(project);
            await db.SaveChangesAsync();
            await audit.LogAsync("project.created", project.Name, $"Client: {project.ClientName}", http);
            return Results.Created($"/api/projects/{project.Id}", project);
        }).RequireAuthorization(RolePolicies.Leadership);
        group.MapPut("/{id:guid}", async (Guid id, UpsertProjectRequest request, DevCloudDbContext db) =>
        {
            var project = await db.Projects.FindAsync(id);
            if (project is null) return Results.NotFound();
            project.Name = request.Name;
            project.Description = request.Description;
            project.ClientName = request.ClientName;
            project.Status = request.Status;
            project.TechStack = request.TechStack;
            project.OwnerId = request.OwnerId;
            await db.SaveChangesAsync();
            return Results.Ok(project);
        }).RequireAuthorization(RolePolicies.Leadership);
        group.MapDelete("/{id:guid}", async (Guid id, DevCloudDbContext db) =>
        {
            var project = await db.Projects.FindAsync(id);
            if (project is null) return Results.NotFound();
            db.Projects.Remove(project);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(RolePolicies.Leadership);
        group.MapPost("/{id:guid}/members", async (Guid id, AddProjectMemberRequest request, DevCloudDbContext db) =>
        {
            var member = new ProjectMember { ProjectId = id, UserId = request.UserId, Role = request.Role };
            db.ProjectMembers.Add(member);
            await db.SaveChangesAsync();
            return Results.Created($"/api/projects/{id}/members/{request.UserId}", member);
        }).RequireAuthorization(RolePolicies.Leadership);
        group.MapDelete("/{id:guid}/members/{userId:guid}", async (Guid id, Guid userId, DevCloudDbContext db) =>
        {
            var member = await db.ProjectMembers.SingleOrDefaultAsync(x => x.ProjectId == id && x.UserId == userId);
            if (member is null) return Results.NotFound();
            db.ProjectMembers.Remove(member);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(RolePolicies.Leadership);
        return group;
    }
}
