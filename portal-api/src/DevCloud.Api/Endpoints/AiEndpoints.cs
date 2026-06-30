using System.Security.Claims;
using System.Text;
using System.Text.Json;
using DevCloud.Api.Hubs;
using DevCloud.Api.Services;
using DevCloud.Application;
using DevCloud.Domain.Entities;
using DevCloud.Domain.Enums;
using DevCloud.Infrastructure.Data;
using DevCloud.Infrastructure.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Endpoints;

public static class AiEndpoints
{
    public static RouteGroupBuilder MapAiEndpoints(this WebApplication app)
    {
        // AI features are restricted to Owner / CoFounder.
        var group = app.MapGroup("/api/ai").WithTags("AI").RequireAuthorization(RolePolicies.Leadership);

        group.MapGet("/status", () => Results.Ok(new
        {
            anthropicConfigured = ClaudeAiService.IsConfigured,
            model = ClaudeAiService.Model
        }));

        group.MapPost("/review-code", ReviewCode);
        group.MapPost("/build-environment", BuildEnvironment);
        group.MapPost("/generate-tickets", GenerateTickets);
        group.MapPost("/tickets/confirm", ConfirmTickets);
        group.MapPost("/security-scan", SecurityScan);
        group.MapGet("/security-scans", SecurityScanHistory);
        group.MapPost("/generate-report", GenerateReport);
        group.MapGet("/reports", ReportHistory);

        return group;
    }

    // ───────────────────────── Part 4: AI Code Review ─────────────────────────
    private const string ReviewSystemPrompt =
        "You are an expert senior software engineer performing a code review on a git diff. " +
        "Respond with ONLY a JSON object of the form: " +
        "{ \"issues\": [ { \"severity\": \"Critical|Warning|Suggestion\", \"title\": string, \"detail\": string, \"location\": string } ], " +
        "\"suggestions\": [ { \"title\": string, \"detail\": string } ], " +
        "\"securityConcerns\": [ { \"severity\": \"Critical|Warning|Suggestion\", \"title\": string, \"detail\": string } ] }. " +
        "Be precise and actionable. If the diff is trivial, return empty arrays.";

    private static async Task<IResult> ReviewCode(
        ReviewCodeRequest request, ClaudeAiService ai, AuditService audit, HttpContext http, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Diff)) return Results.BadRequest(new { error = "A diff is required." });
        if (!ClaudeAiService.IsConfigured) return AiNotConfigured();

        var userMessage = $"Project path: {request.ProjectPath ?? "(unspecified)"}\n\nGit diff to review:\n```diff\n{request.Diff}\n```";
        var (json, raw) = await ai.CompleteJsonAsync(ReviewSystemPrompt, userMessage, 3000, ct);

        await audit.LogAsync("ai.review", request.ProjectPath ?? "code",
            $"Code review ({raw.InputTokens} in / {raw.OutputTokens} out tokens)", http, ct);

        return Results.Json(new { review = json, usage = new { raw.InputTokens, raw.OutputTokens } });
    }

    // ───────────────────────── Part 5: AI Environment Builder ─────────────────────────
    private const string BuildSystemPrompt =
        "You are a DevOps expert. Given a natural-language description of what a developer needs, respond with ONLY a JSON object: " +
        "{ \"stack\": string (one of dotnet,node,python,java,react,flutter,cpp), \"services\": [string], " +
        "\"dockerCompose\": string (a complete, valid docker-compose.yml as a single string), \"setupCommands\": [string] }. " +
        "Pin image versions and expose sensible ports.";

    private static async Task<IResult> BuildEnvironment(
        BuildEnvironmentRequest request, ClaudeAiService ai, SshCommandRunner ssh,
        AuditService audit, IHubContext<ActivityHub> hub, HttpContext http, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Description)) return Results.BadRequest(new { error = "A description is required." });
        if (!ClaudeAiService.IsConfigured) return AiNotConfigured();

        await Progress(hub, "analyzing", "Analyzing requirements...", ct);
        var (plan, raw) = await ai.CompleteJsonAsync(BuildSystemPrompt, request.Description, 3000, ct);

        object provision;
        var dockerCompose = plan.TryGetProperty("dockerCompose", out var dc) ? dc.GetString() ?? "" : "";

        if (ssh.IsConfigured && !string.IsNullOrWhiteSpace(dockerCompose))
        {
            await Progress(hub, "provisioning", "Provisioning environment...", ct);
            var dir = $"/tmp/devcloud-ai-{Guid.NewGuid():N}"[..32];
            var b64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(dockerCompose));
            var script =
                $"mkdir -p {dir} && echo {b64} | base64 -d > {dir}/docker-compose.yml && " +
                $"cd {dir} && (docker compose up -d 2>&1 || docker-compose up -d 2>&1) | tail -n 30";
            var output = await ssh.RunAsync(script, ct);
            provision = new { provisioned = true, directory = dir, output };
            await Progress(hub, "ready", "Environment ready.", ct);
        }
        else
        {
            provision = new { provisioned = false, reason = ssh.IsConfigured ? "No docker-compose produced." : "SSH key not configured — plan generated only." };
            await Progress(hub, "ready", "Plan generated.", ct);
        }

        await audit.LogAsync("ai.build-environment", "environment",
            $"AI environment builder ({raw.InputTokens} in / {raw.OutputTokens} out tokens)", http, ct);

        return Results.Json(new { plan, provision, usage = new { raw.InputTokens, raw.OutputTokens } });
    }

    private static Task Progress(IHubContext<ActivityHub> hub, string phase, string message, CancellationToken ct) =>
        hub.Clients.All.SendAsync("provision", new { phase, message, at = DateTimeOffset.UtcNow }, ct);

    // ───────────────────────── Part 6: AI Ticket Generator ─────────────────────────
    private const string TicketSystemPrompt =
        "You are a senior product manager. Break a feature request into well-formed engineering tickets. " +
        "Respond with ONLY a JSON array: [ { \"title\": string, \"description\": string, " +
        "\"acceptanceCriteria\": string, \"suggestedAssigneeRole\": string, \"priority\": \"Low|Medium|High|Critical\" } ]. " +
        "Produce 3-7 focused tickets.";

    private static async Task<IResult> GenerateTickets(
        GenerateTicketsRequest request, ClaudeAiService ai, DevCloudDbContext db, AuditService audit, HttpContext http, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.FeatureDescription)) return Results.BadRequest(new { error = "A feature description is required." });
        if (!ClaudeAiService.IsConfigured) return AiNotConfigured();

        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct);
        if (project is null) return Results.NotFound(new { error = "Project not found." });

        var userMessage = $"Project: {project.Name} ({project.TechStack})\nFeature request: {request.FeatureDescription}";
        var (json, raw) = await ai.CompleteJsonAsync(TicketSystemPrompt, userMessage, 3000, ct);

        await audit.LogAsync("ai.generate-tickets", $"project:{project.Id}",
            $"Generated ticket draft ({raw.OutputTokens} out tokens)", http, ct);

        // Return drafts only — the owner reviews/edits before confirming.
        return Results.Json(new { tickets = json, projectId = project.Id, usage = new { raw.InputTokens, raw.OutputTokens } });
    }

    private static async Task<IResult> ConfirmTickets(
        ConfirmTicketsRequest request, DevCloudDbContext db, AuditService audit, HttpContext http, CancellationToken ct)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct);
        if (project is null) return Results.NotFound(new { error = "Project not found." });
        if (request.Tickets.Count == 0) return Results.BadRequest(new { error = "No tickets to create." });

        var createdById = CurrentUserId(http) ?? project.OwnerId;
        var created = new List<Ticket>();
        foreach (var draft in request.Tickets)
        {
            var description = draft.Description ?? "";
            if (!string.IsNullOrWhiteSpace(draft.AcceptanceCriteria))
            {
                description += $"\n\n**Acceptance criteria:**\n{draft.AcceptanceCriteria}";
            }
            if (!string.IsNullOrWhiteSpace(draft.SuggestedAssigneeRole))
            {
                description += $"\n\n_Suggested assignee role: {draft.SuggestedAssigneeRole}_";
            }

            var ticket = new Ticket
            {
                ProjectId = project.Id,
                Title = draft.Title,
                Description = description.Trim(),
                CreatedById = createdById,
                Priority = draft.Priority,
                Status = TicketStatus.Backlog
            };
            db.Tickets.Add(ticket);
            created.Add(ticket);
        }

        await db.SaveChangesAsync(ct);
        await audit.LogAsync("ticket.created", $"project:{project.Id}", $"Created {created.Count} tickets from AI draft", http, ct);
        return Results.Ok(new { created = created.Count, tickets = created });
    }

    // ───────────────────────── Part 7: AI Security Scanner ─────────────────────────
    private static async Task<IResult> SecurityScan(
        SecurityScanRequest request, SecurityScanRunner runner, AuditService audit, HttpContext http, CancellationToken ct)
    {
        if (!ClaudeAiService.IsConfigured) return AiNotConfigured();

        var scan = await runner.RunAsync(request.ProjectId, CurrentUserId(http), automated: false, ct);
        await audit.LogAsync("ai.security-scan", $"project:{request.ProjectId}",
            $"{scan.FindingsCount} findings, risk {scan.RiskScore}", http, ct);
        return Results.Ok(scan);
    }

    private static async Task<IResult> SecurityScanHistory(DevCloudDbContext db, CancellationToken ct) =>
        Results.Ok(await db.SecurityScans.OrderByDescending(s => s.CreatedAt).Take(100).ToListAsync(ct));

    // ───────────────────────── Part 8: AI Project Reports ─────────────────────────
    private const string ReportSystemPrompt =
        "You are a professional delivery manager writing a concise, well-structured client-facing project status report. " +
        "Given the metrics, write a clear narrative (3-5 short paragraphs) covering progress, delivery, team effort, and outlook. " +
        "Return plain prose only — no markdown headers.";

    private static async Task<IResult> GenerateReport(
        GenerateReportRequest request, ClaudeAiService ai, DevCloudDbContext db, ReportPdfService pdf,
        AuditService audit, HttpContext http, CancellationToken ct)
    {
        if (!ClaudeAiService.IsConfigured) return AiNotConfigured();

        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct);
        if (project is null) return Results.NotFound(new { error = "Project not found." });

        var start = request.StartDate;
        var end = request.EndDate;

        var ticketsClosed = await db.Tickets.CountAsync(t =>
            t.ProjectId == project.Id && t.Status == TicketStatus.Done && t.UpdatedAt >= start && t.UpdatedAt <= end, ct);
        var deployments = await db.Deployments.CountAsync(d =>
            d.ProjectId == project.Id && d.StartedAt >= start && d.StartedAt <= end, ct);
        var minutesLogged = await db.Sessions
            .Where(s => s.ProjectId == project.Id && s.StartedAt >= start && s.StartedAt <= end)
            .SumAsync(s => (int?)s.DurationMinutes, ct) ?? 0;
        var hoursLogged = Math.Round(minutesLogged / 60.0, 1);

        var metrics = new List<ReportMetric>
        {
            new("Tickets closed", ticketsClosed.ToString()),
            new("Deployments", deployments.ToString()),
            new("Hours logged", hoursLogged.ToString("0.0")),
            new("Tech stack", project.TechStack.ToString()),
            new("Status", project.Status.ToString())
        };

        var metricsText = string.Join("\n", metrics.Select(m => $"- {m.Label}: {m.Value}"));
        var userMessage =
            $"Project: {project.Name} for {project.ClientName}\nPeriod: {start:yyyy-MM-dd} to {end:yyyy-MM-dd}\n\nMetrics:\n{metricsText}";

        var result = await ai.CompleteAsync(ReportSystemPrompt, userMessage, 1500, ct);
        var report = new ReportData(project.Name, project.ClientName, start, end, metrics, result.Text);
        var bytes = pdf.Generate(report);

        await audit.LogAsync("ai.generate-report", $"project:{project.Id}",
            $"Report {start:yyyy-MM-dd}..{end:yyyy-MM-dd} ({result.OutputTokens} out tokens)", http, ct);

        var fileName = $"devcloud-report-{project.Name}-{start:yyyyMMdd}-{end:yyyyMMdd}.pdf"
            .Replace(' ', '-');
        return Results.File(bytes, "application/pdf", fileName);
    }

    private static async Task<IResult> ReportHistory(DevCloudDbContext db, CancellationToken ct)
    {
        var logs = await db.AuditLogs
            .Where(a => a.Action == "ai.generate-report")
            .OrderByDescending(a => a.CreatedAt)
            .Take(50)
            .ToListAsync(ct);
        return Results.Ok(logs);
    }

    // ───────────────────────── helpers ─────────────────────────
    private static Guid? CurrentUserId(HttpContext http)
    {
        var id = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var parsed) ? parsed : null;
    }

    private static IResult AiNotConfigured() =>
        Results.Json(new { error = "ANTHROPIC_API_KEY is not configured on the server." }, statusCode: StatusCodes.Status503ServiceUnavailable);
}
