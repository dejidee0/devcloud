using System.Diagnostics;

namespace DevCloud.Infrastructure.Services;

public sealed class InfrastructureStatusService
{
    public async Task<object> GetStatusAsync(CancellationToken cancellationToken)
    {
        var docker = await RunAsync("docker", "ps --format \"{{.Names}}|{{.Status}}|{{.Ports}}\"", cancellationToken);
        var disk = await RunAsync("df", "-h /", cancellationToken);
        var memory = await RunAsync("free", "-m", cancellationToken);
        return new { docker, disk, memory, checkedAt = DateTimeOffset.UtcNow };
    }

    public Task<string> LockdownAsync(CancellationToken cancellationToken) => RunAsync("bash", "scripts/svc-lock.sh", cancellationToken);
    public Task<string> UnlockAsync(CancellationToken cancellationToken) => RunAsync("bash", "scripts/svc-unlock.sh", cancellationToken);

    private static async Task<string> RunAsync(string fileName, string arguments, CancellationToken cancellationToken)
    {
        var start = new ProcessStartInfo(fileName, arguments)
        {
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false
        };
        using var process = Process.Start(start) ?? throw new InvalidOperationException("Process failed to start.");
        var output = await process.StandardOutput.ReadToEndAsync(cancellationToken);
        var error = await process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);
        return process.ExitCode == 0 ? output : error;
    }
}
