using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DevCloud.Infrastructure.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable("Users", table => new
        {
            Id = table.Column<Guid>(nullable: false),
            Email = table.Column<string>(maxLength: 256, nullable: false),
            FullName = table.Column<string>(maxLength: 160, nullable: false),
            Role = table.Column<string>(maxLength: 40, nullable: false),
            PasswordHash = table.Column<string>(maxLength: 512, nullable: false),
            RefreshToken = table.Column<string>(maxLength: 512, nullable: true),
            CreatedAt = table.Column<DateTimeOffset>(nullable: false),
            LastLogin = table.Column<DateTimeOffset>(nullable: true),
            IsActive = table.Column<bool>(nullable: false)
        }, constraints: table => table.PrimaryKey("PK_Users", x => x.Id));

        migrationBuilder.CreateTable("Projects", table => new
        {
            Id = table.Column<Guid>(nullable: false),
            Name = table.Column<string>(maxLength: 160, nullable: false),
            Description = table.Column<string>(nullable: true),
            ClientName = table.Column<string>(maxLength: 160, nullable: false),
            Status = table.Column<string>(maxLength: 40, nullable: false),
            TechStack = table.Column<string>(maxLength: 40, nullable: false),
            CreatedAt = table.Column<DateTimeOffset>(nullable: false),
            OwnerId = table.Column<Guid>(nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_Projects", x => x.Id);
            table.ForeignKey("FK_Projects_Users_OwnerId", x => x.OwnerId, "Users", "Id");
        });

        migrationBuilder.CreateTable("AuditLogs", table => new
        {
            Id = table.Column<Guid>(nullable: false),
            UserId = table.Column<Guid>(nullable: true),
            Action = table.Column<string>(maxLength: 120, nullable: false),
            Resource = table.Column<string>(maxLength: 160, nullable: false),
            Details = table.Column<string>(nullable: true),
            IpAddress = table.Column<string>(maxLength: 80, nullable: true),
            CreatedAt = table.Column<DateTimeOffset>(nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_AuditLogs", x => x.Id);
            table.ForeignKey("FK_AuditLogs_Users_UserId", x => x.UserId, "Users", "Id");
        });

        migrationBuilder.CreateTable("ProjectMembers", table => new
        {
            Id = table.Column<Guid>(nullable: false),
            ProjectId = table.Column<Guid>(nullable: false),
            UserId = table.Column<Guid>(nullable: false),
            Role = table.Column<string>(maxLength: 80, nullable: false),
            JoinedAt = table.Column<DateTimeOffset>(nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_ProjectMembers", x => x.Id);
            table.ForeignKey("FK_ProjectMembers_Projects_ProjectId", x => x.ProjectId, "Projects", "Id", onDelete: ReferentialAction.Cascade);
            table.ForeignKey("FK_ProjectMembers_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
        });

        migrationBuilder.CreateTable("Tickets", table => new
        {
            Id = table.Column<Guid>(nullable: false),
            ProjectId = table.Column<Guid>(nullable: false),
            Title = table.Column<string>(maxLength: 240, nullable: false),
            Description = table.Column<string>(nullable: true),
            AssignedToId = table.Column<Guid>(nullable: true),
            CreatedById = table.Column<Guid>(nullable: false),
            Priority = table.Column<string>(maxLength: 40, nullable: false),
            Status = table.Column<string>(maxLength: 40, nullable: false),
            CreatedAt = table.Column<DateTimeOffset>(nullable: false),
            UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_Tickets", x => x.Id);
            table.ForeignKey("FK_Tickets_Projects_ProjectId", x => x.ProjectId, "Projects", "Id", onDelete: ReferentialAction.Cascade);
            table.ForeignKey("FK_Tickets_Users_AssignedToId", x => x.AssignedToId, "Users", "Id");
            table.ForeignKey("FK_Tickets_Users_CreatedById", x => x.CreatedById, "Users", "Id");
        });

        migrationBuilder.CreateTable("DevEnvironments", table => new
        {
            Id = table.Column<Guid>(nullable: false),
            ProjectId = table.Column<Guid>(nullable: false),
            UserId = table.Column<Guid>(nullable: false),
            TechStack = table.Column<string>(maxLength: 40, nullable: false),
            ContainerName = table.Column<string>(maxLength: 160, nullable: false),
            Status = table.Column<string>(maxLength: 40, nullable: false),
            CreatedAt = table.Column<DateTimeOffset>(nullable: false),
            LastActive = table.Column<DateTimeOffset>(nullable: true),
            SnapshotName = table.Column<string>(maxLength: 160, nullable: true)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_DevEnvironments", x => x.Id);
            table.ForeignKey("FK_DevEnvironments_Projects_ProjectId", x => x.ProjectId, "Projects", "Id", onDelete: ReferentialAction.Cascade);
            table.ForeignKey("FK_DevEnvironments_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
        });

        migrationBuilder.CreateTable("Deployments", table => new
        {
            Id = table.Column<Guid>(nullable: false),
            ProjectId = table.Column<Guid>(nullable: false),
            Environment = table.Column<string>(maxLength: 40, nullable: false),
            Status = table.Column<string>(maxLength: 40, nullable: false),
            CommitHash = table.Column<string>(maxLength: 80, nullable: true),
            DeployedById = table.Column<Guid>(nullable: false),
            StartedAt = table.Column<DateTimeOffset>(nullable: false),
            CompletedAt = table.Column<DateTimeOffset>(nullable: true),
            Logs = table.Column<string>(nullable: true)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_Deployments", x => x.Id);
            table.ForeignKey("FK_Deployments_Projects_ProjectId", x => x.ProjectId, "Projects", "Id", onDelete: ReferentialAction.Cascade);
            table.ForeignKey("FK_Deployments_Users_DeployedById", x => x.DeployedById, "Users", "Id");
        });

        migrationBuilder.CreateTable("Sessions", table => new
        {
            Id = table.Column<Guid>(nullable: false),
            UserId = table.Column<Guid>(nullable: false),
            StartedAt = table.Column<DateTimeOffset>(nullable: false),
            EndedAt = table.Column<DateTimeOffset>(nullable: true),
            DurationMinutes = table.Column<int>(nullable: false),
            ProjectId = table.Column<Guid>(nullable: true),
            TeleportSessionId = table.Column<string>(nullable: true)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_Sessions", x => x.Id);
            table.ForeignKey("FK_Sessions_Projects_ProjectId", x => x.ProjectId, "Projects", "Id");
            table.ForeignKey("FK_Sessions_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
        });

        migrationBuilder.CreateIndex("IX_Users_Email", "Users", "Email", unique: true);
        migrationBuilder.CreateIndex("IX_Projects_OwnerId", "Projects", "OwnerId");
        migrationBuilder.CreateIndex("IX_AuditLogs_UserId", "AuditLogs", "UserId");
        migrationBuilder.CreateIndex("IX_ProjectMembers_ProjectId_UserId", "ProjectMembers", new[] { "ProjectId", "UserId" }, unique: true);
        migrationBuilder.CreateIndex("IX_ProjectMembers_UserId", "ProjectMembers", "UserId");
        migrationBuilder.CreateIndex("IX_Tickets_ProjectId", "Tickets", "ProjectId");
        migrationBuilder.CreateIndex("IX_Tickets_AssignedToId", "Tickets", "AssignedToId");
        migrationBuilder.CreateIndex("IX_Tickets_CreatedById", "Tickets", "CreatedById");
        migrationBuilder.CreateIndex("IX_DevEnvironments_ProjectId", "DevEnvironments", "ProjectId");
        migrationBuilder.CreateIndex("IX_DevEnvironments_UserId", "DevEnvironments", "UserId");
        migrationBuilder.CreateIndex("IX_Deployments_ProjectId", "Deployments", "ProjectId");
        migrationBuilder.CreateIndex("IX_Deployments_DeployedById", "Deployments", "DeployedById");
        migrationBuilder.CreateIndex("IX_Sessions_ProjectId", "Sessions", "ProjectId");
        migrationBuilder.CreateIndex("IX_Sessions_UserId", "Sessions", "UserId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("AuditLogs");
        migrationBuilder.DropTable("Deployments");
        migrationBuilder.DropTable("DevEnvironments");
        migrationBuilder.DropTable("ProjectMembers");
        migrationBuilder.DropTable("Sessions");
        migrationBuilder.DropTable("Tickets");
        migrationBuilder.DropTable("Projects");
        migrationBuilder.DropTable("Users");
    }
}
