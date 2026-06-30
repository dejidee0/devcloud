using DevCloud.Domain.Entities;
using DevCloud.Infrastructure.Data;
using DevCloud.Infrastructure.Services;

namespace DevCloud.Api.Services;

/// <summary>Captures a real CPU/RAM/Disk snapshot from the Hetzner host every 30 minutes for the analytics resource-history chart.</summary>
public sealed class ServerMetricSnapshotJob : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(30);

    private readonly IServiceProvider _services;
    private readonly ServerMonitorService _monitor;
    private readonly ILogger<ServerMetricSnapshotJob> _logger;

    public ServerMetricSnapshotJob(IServiceProvider services, ServerMonitorService monitor, ILogger<ServerMetricSnapshotJob> logger)
    {
        _services = services;
        _monitor = monitor;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try { await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            if (!string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("DEVCLOUD_SSH_KEY")))
            {
                try
                {
                    var stats = await _monitor.GetStatsAsync(stoppingToken);
                    using var scope = _services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<DevCloudDbContext>();
                    db.ServerMetricSnapshots.Add(new ServerMetricSnapshot
                    {
                        CpuPercent = stats.Cpu.Percent,
                        RamUsedMb = stats.Ram.UsedMb,
                        RamTotalMb = stats.Ram.TotalMb,
                        DiskUsedGb = stats.Disk.UsedGb,
                        DiskTotalGb = stats.Disk.TotalGb
                    });
                    await db.SaveChangesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to capture server metric snapshot.");
                }
            }

            try { await Task.Delay(Interval, stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }
}
