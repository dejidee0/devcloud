using DevCloud.Domain.Enums;

namespace DevCloud.Domain.Entities;

public sealed class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public UserRole Role { get; set; }
    public required string PasswordHash { get; set; }
    public string? RefreshToken { get; set; }
    public string? Organization { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLogin { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string ClientName { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public TechStack TechStack { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid OwnerId { get; set; }
    public User? Owner { get; set; }
}

public sealed class ProjectMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public required string Role { get; set; }
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public Guid? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }
    public Guid CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketStatus Status { get; set; } = TicketStatus.Backlog;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class DevEnvironment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public TechStack TechStack { get; set; }
    public required string ContainerName { get; set; }
    public DevEnvironmentStatus Status { get; set; } = DevEnvironmentStatus.Stopped;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastActive { get; set; }
    public string? SnapshotName { get; set; }
}

public sealed class Deployment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public DeploymentEnvironment Environment { get; set; }
    public DeploymentStatus Status { get; set; } = DeploymentStatus.Pending;
    public string? CommitHash { get; set; }
    public Guid DeployedById { get; set; }
    public User? DeployedBy { get; set; }
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
    public string? Logs { get; set; }
}

public sealed class Session
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? EndedAt { get; set; }
    public int DurationMinutes { get; set; }
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }
    public string? TeleportSessionId { get; set; }
}

public sealed class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public required string Action { get; set; }
    public required string Resource { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ServerMetricSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public double CpuPercent { get; set; }
    public int RamUsedMb { get; set; }
    public int RamTotalMb { get; set; }
    public double DiskUsedGb { get; set; }
    public double DiskTotalGb { get; set; }
    public DateTimeOffset CapturedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class SecurityScan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }
    public SecurityScanStatus Status { get; set; } = SecurityScanStatus.Pending;
    public SecuritySeverity HighestSeverity { get; set; } = SecuritySeverity.Info;
    public int RiskScore { get; set; }
    public int FindingsCount { get; set; }
    /// <summary>JSON array of findings: { severity, title, detail, location, recommendation }.</summary>
    public string FindingsJson { get; set; } = "[]";
    public string? Summary { get; set; }
    public Guid? TriggeredById { get; set; }
    public User? TriggeredBy { get; set; }
    public bool IsAutomated { get; set; }
    public int? InputTokens { get; set; }
    public int? OutputTokens { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
}
