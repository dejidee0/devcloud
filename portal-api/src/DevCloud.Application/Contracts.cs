using DevCloud.Domain.Enums;

namespace DevCloud.Application;

public sealed record LoginRequest(string Email, string Password);
public sealed record SetupOwnerRequest(string Email, string FullName, string Password);
public sealed record RegisterRequest(string Email, string FullName, UserRole Role, string Password);
public sealed record AuthResponse(Guid UserId, string Email, string FullName, UserRole Role, string AccessToken, string RefreshToken);

public sealed record UpsertUserRequest(string Email, string FullName, UserRole Role, bool IsActive);
public sealed record UpsertProjectRequest(string Name, string? Description, string ClientName, ProjectStatus Status, TechStack TechStack, Guid OwnerId);
public sealed record AddProjectMemberRequest(Guid UserId, string Role);
public sealed record UpsertTicketRequest(Guid ProjectId, string Title, string? Description, Guid? AssignedToId, Guid CreatedById, TicketPriority Priority, TicketStatus Status);
public sealed record AssignTicketRequest(Guid AssignedToId);
public sealed record UpdateTicketStatusRequest(TicketStatus Status);
public sealed record StartEnvironmentRequest(Guid ProjectId, Guid UserId, TechStack TechStack);
public sealed record TriggerDeploymentRequest(Guid ProjectId, DeploymentEnvironment Environment, string? CommitHash, Guid DeployedById);

// AI feature requests
public sealed record ReviewCodeRequest(string? ProjectPath, string Diff);
public sealed record BuildEnvironmentRequest(string Description);
public sealed record GenerateTicketsRequest(Guid ProjectId, string FeatureDescription);
public sealed record ConfirmTicketsRequest(Guid ProjectId, IReadOnlyList<GeneratedTicket> Tickets);
public sealed record GeneratedTicket(string Title, string? Description, string? AcceptanceCriteria, string? SuggestedAssigneeRole, TicketPriority Priority);
public sealed record SecurityScanRequest(Guid ProjectId);
public sealed record GenerateReportRequest(Guid ProjectId, DateTimeOffset StartDate, DateTimeOffset EndDate);
public sealed record StartLiveEnvironmentRequest(string Stack);
