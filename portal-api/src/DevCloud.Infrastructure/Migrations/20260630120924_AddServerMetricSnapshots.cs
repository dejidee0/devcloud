using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DevCloud.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddServerMetricSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServerMetricSnapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CpuPercent = table.Column<double>(type: "float", nullable: false),
                    RamUsedMb = table.Column<int>(type: "int", nullable: false),
                    RamTotalMb = table.Column<int>(type: "int", nullable: false),
                    DiskUsedGb = table.Column<double>(type: "float", nullable: false),
                    DiskTotalGb = table.Column<double>(type: "float", nullable: false),
                    CapturedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServerMetricSnapshots", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServerMetricSnapshots_CapturedAt",
                table: "ServerMetricSnapshots",
                column: "CapturedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServerMetricSnapshots");
        }
    }
}
