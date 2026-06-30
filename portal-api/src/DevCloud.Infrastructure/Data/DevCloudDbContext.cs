using DevCloud.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Infrastructure.Data;

public sealed class DevCloudDbContext(DbContextOptions<DevCloudDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<DevEnvironment> DevEnvironments => Set<DevEnvironment>();
    public DbSet<Deployment> Deployments => Set<Deployment>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SecurityScan> SecurityScans => Set<SecurityScan>();
    public DbSet<ServerMetricSnapshot> ServerMetricSnapshots => Set<ServerMetricSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(b =>
        {
            b.HasIndex(x => x.Email).IsUnique();
            b.Property(x => x.Email).HasMaxLength(256);
            b.Property(x => x.FullName).HasMaxLength(160);
            b.Property(x => x.Role).HasConversion<string>().HasMaxLength(40);
            b.Property(x => x.PasswordHash).HasMaxLength(512);
            b.Property(x => x.RefreshToken).HasMaxLength(512);
        });

        modelBuilder.Entity<Project>(b =>
        {
            b.Property(x => x.Name).HasMaxLength(160);
            b.Property(x => x.ClientName).HasMaxLength(160);
            b.Property(x => x.Status).HasConversion<string>().HasMaxLength(40);
            b.Property(x => x.TechStack).HasConversion<string>().HasMaxLength(40);
        });

        modelBuilder.Entity<ProjectMember>(b =>
        {
            b.HasIndex(x => new { x.ProjectId, x.UserId }).IsUnique();
            b.Property(x => x.Role).HasMaxLength(80);
        });

        modelBuilder.Entity<Ticket>(b =>
        {
            b.Property(x => x.Title).HasMaxLength(240);
            b.Property(x => x.Priority).HasConversion<string>().HasMaxLength(40);
            b.Property(x => x.Status).HasConversion<string>().HasMaxLength(40);
        });

        modelBuilder.Entity<DevEnvironment>(b =>
        {
            b.Property(x => x.TechStack).HasConversion<string>().HasMaxLength(40);
            b.Property(x => x.Status).HasConversion<string>().HasMaxLength(40);
            b.Property(x => x.ContainerName).HasMaxLength(160);
            b.Property(x => x.SnapshotName).HasMaxLength(160);
        });

        modelBuilder.Entity<Deployment>(b =>
        {
            b.Property(x => x.Environment).HasConversion<string>().HasMaxLength(40);
            b.Property(x => x.Status).HasConversion<string>().HasMaxLength(40);
            b.Property(x => x.CommitHash).HasMaxLength(80);
        });

        modelBuilder.Entity<AuditLog>(b =>
        {
            b.Property(x => x.Action).HasMaxLength(120);
            b.Property(x => x.Resource).HasMaxLength(160);
            b.Property(x => x.IpAddress).HasMaxLength(80);
        });

        modelBuilder.Entity<SecurityScan>(b =>
        {
            b.Property(x => x.Status).HasConversion<string>().HasMaxLength(40);
            b.Property(x => x.HighestSeverity).HasConversion<string>().HasMaxLength(40);
            b.Property(x => x.Summary).HasMaxLength(4000);
            b.HasOne(x => x.Project).WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ServerMetricSnapshot>(b =>
        {
            b.HasIndex(x => x.CapturedAt);
        });
    }
}
