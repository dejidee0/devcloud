using System.Diagnostics;
using DevCloud.Domain.Entities;
using DevCloud.Domain.Enums;

namespace DevCloud.Infrastructure.Services;

public sealed class DockerEnvironmentService
{
    public async Task<string> StartAsync(DevEnvironment env, CancellationToken cancellationToken)
    {
        var image = env.TechStack.ToString().ToLowerInvariant() switch
        {
            "dotnet" => "devcloud/dotnet:latest",
            "nodejs" => "devcloud/nodejs:latest",
            "cpp" => "devcloud/cpp:latest",
            var stack => $"devcloud/{stack}:latest"
        };
        return await RunProcessAsync("docker", $"run -d --name {env.ContainerName} -p 8443 {image}", cancellationToken);
    }

    public Task<string> StopAsync(string containerName, CancellationToken cancellationToken) =>
        RunProcessAsync("docker", $"stop {containerName}", cancellationToken);

    public Task<string> SnapshotAsync(string containerName, string snapshotName, CancellationToken cancellationToken) =>
        RunProcessAsync("docker", $"commit {containerName} {snapshotName}", cancellationToken);

    public Task<string> RemoveAsync(string containerName, CancellationToken cancellationToken) =>
        RunProcessAsync("docker", $"rm -f {containerName}", cancellationToken);

    private static async Task<string> RunProcessAsync(string fileName, string arguments, CancellationToken cancellationToken)
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
        if (process.ExitCode != 0) throw new InvalidOperationException(error);
        return output.Trim();
    }
}
