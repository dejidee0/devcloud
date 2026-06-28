using DevCloud.Application;
using DevCloud.Domain.Entities;
using DevCloud.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class TicketEndpoints
{
    public static RouteGroupBuilder MapTicketEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/tickets").WithTags("Tickets").RequireAuthorization();
        group.MapGet("/", async (Guid? projectId, DevCloudDbContext db) =>
            await db.Tickets.Where(x => projectId == null || x.ProjectId == projectId).OrderByDescending(x => x.UpdatedAt).ToListAsync());
        group.MapGet("/{id:guid}", async (Guid id, DevCloudDbContext db) =>
            await db.Tickets.FindAsync(id) is { } ticket ? Results.Ok(ticket) : Results.NotFound());
        group.MapPost("/", async (UpsertTicketRequest request, DevCloudDbContext db) =>
        {
            var ticket = new Ticket
            {
                ProjectId = request.ProjectId,
                Title = request.Title,
                Description = request.Description,
                AssignedToId = request.AssignedToId,
                CreatedById = request.CreatedById,
                Priority = request.Priority,
                Status = request.Status
            };
            db.Tickets.Add(ticket);
            await db.SaveChangesAsync();
            return Results.Created($"/api/tickets/{ticket.Id}", ticket);
        });
        group.MapPut("/{id:guid}", async (Guid id, UpsertTicketRequest request, DevCloudDbContext db) =>
        {
            var ticket = await db.Tickets.FindAsync(id);
            if (ticket is null) return Results.NotFound();
            ticket.Title = request.Title;
            ticket.Description = request.Description;
            ticket.AssignedToId = request.AssignedToId;
            ticket.Priority = request.Priority;
            ticket.Status = request.Status;
            ticket.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(ticket);
        });
        group.MapDelete("/{id:guid}", async (Guid id, DevCloudDbContext db) =>
        {
            var ticket = await db.Tickets.FindAsync(id);
            if (ticket is null) return Results.NotFound();
            db.Tickets.Remove(ticket);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
        group.MapPut("/{id:guid}/assign", async (Guid id, AssignTicketRequest request, DevCloudDbContext db) =>
        {
            var ticket = await db.Tickets.FindAsync(id);
            if (ticket is null) return Results.NotFound();
            ticket.AssignedToId = request.AssignedToId;
            ticket.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(ticket);
        });
        group.MapPut("/{id:guid}/status", async (Guid id, UpdateTicketStatusRequest request, DevCloudDbContext db) =>
        {
            var ticket = await db.Tickets.FindAsync(id);
            if (ticket is null) return Results.NotFound();
            ticket.Status = request.Status;
            ticket.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(ticket);
        });
        return group;
    }
}
