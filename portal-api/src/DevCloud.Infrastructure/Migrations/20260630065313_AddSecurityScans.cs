using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DevCloud.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSecurityScans : Migration
    {
        // NOTE: The original InitialCreate migration was hand-written without a model
        // snapshot, so EF generated a full-schema diff. All base tables already exist in
        // the live database, so this migration only adds the new SecurityScans table.
        // The Users/Projects tables referenced by the foreign keys already exist.

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SecurityScans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    HighestSeverity = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    RiskScore = table.Column<int>(type: "int", nullable: false),
                    FindingsCount = table.Column<int>(type: "int", nullable: false),
                    FindingsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    TriggeredById = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsAutomated = table.Column<bool>(type: "bit", nullable: false),
                    InputTokens = table.Column<int>(type: "int", nullable: true),
                    OutputTokens = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityScans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SecurityScans_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SecurityScans_Users_TriggeredById",
                        column: x => x.TriggeredById,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_SecurityScans_ProjectId",
                table: "SecurityScans",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityScans_TriggeredById",
                table: "SecurityScans",
                column: "TriggeredById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "SecurityScans");
        }
    }
}
