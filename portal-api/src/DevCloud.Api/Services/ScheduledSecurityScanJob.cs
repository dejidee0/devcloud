using DevCloud.Domain.Enums;
using DevCloud.Infrastructure.Data;
using DevCloud.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Services;

/// <summary>Runs an automated AI security scan on every active project once every 24 hours.</summary>
public sealed class ScheduledSecurityScanJob : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

    private readonly IServiceProvider _services;
    private readonly ILogger<ScheduledSecurityScanJob> _logger;

    public ScheduledSecurityScanJob(IServiceProvider services, ILogger<ScheduledSecurityScanJob> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait a bit after startup so the app and DB are ready.
        try { await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (SshCommandRunner_IsConfigured() && ClaudeAiService.IsConfigured)
                {
                    await RunOnceAsync(stoppingToken);
                }
                else
                {
                    _logger.LogInformation("Skipping scheduled security scan — SSH key or Anthropic key not configured.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Scheduled security scan cycle failed.");
            }

            try { await Task.Delay(Interval, stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private static bool SshCommandRunner_IsConfigured() =>
        !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("DEVCLOUD_SSH_KEY"));

    private async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DevCloudDbContext>();
        var runner = scope.ServiceProvider.GetRequiredService<SecurityScanRunner>();
        var audit = scope.ServiceProvider.GetRequiredService<AuditService>();

        var projectIds = await db.Projects
            .Where(p => p.Status == ProjectStatus.Active)
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Running automated security scans on {Count} active projects.", projectIds.Count);

        foreach (var id in projectIds)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var scan = await runner.RunAsync(id, triggeredById: null, automated: true, cancellationToken);
            await audit.LogSystemAsync("security.scan", $"project:{id}",
                $"Automated scan: {scan.FindingsCount} findings, risk {scan.RiskScore}", null, "DevCloud AI", cancellationToken);
        }
    }
}
