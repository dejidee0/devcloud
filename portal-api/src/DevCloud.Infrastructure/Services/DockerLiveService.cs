using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace DevCloud.Infrastructure.Services;

public sealed record LiveContainer(string Id, string Name, string Image, string Status, string State, string Ports);

/// <summary>
/// Reads real Docker state from the Hetzner host over SSH and starts new
/// environments from the per-stack Dockerfiles that live under /environments on the server.
/// </summary>
public sealed class DockerLiveService
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    private static readonly IReadOnlyDictionary<string, string> StackImages = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["dotnet"] = "devcloud/dotnet:latest",
        ["node"] = "devcloud/node:latest",
        ["nodejs"] = "devcloud/node:latest",
        ["python"] = "devcloud/python:latest",
        ["java"] = "devcloud/java:latest",
        ["react"] = "devcloud/react:latest",
        ["flutter"] = "devcloud/flutter:latest",
        ["cpp"] = "devcloud/cpp:latest"
    };

    private readonly SshCommandRunner _ssh;
    private readonly ILogger<DockerLiveService> _logger;

    public DockerLiveService(SshCommandRunner ssh, ILogger<DockerLiveService> logger)
    {
        _ssh = ssh;
        _logger = logger;
    }

    public static IReadOnlyCollection<string> SupportedStacks { get; } =
        new[] { "dotnet", "node", "python", "java", "react", "flutter", "cpp" };

    public async Task<IReadOnlyList<LiveContainer>> ListContainersAsync(CancellationToken cancellationToken)
    {
        var raw = await _ssh.RunAsync("docker ps --all --no-trunc --format '{{json .}}'", cancellationToken);
        var containers = new List<LiveContainer>();

        foreach (var line in raw.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!line.StartsWith('{')) continue;
            try
            {
                using var doc = JsonDocument.Parse(line);
                var root = doc.RootElement;
                containers.Add(new LiveContainer(
                    Id: Get(root, "ID"),
                    Name: Get(root, "Names"),
                    Image: Get(root, "Image"),
                    Status: Get(root, "Status"),
                    State: Get(root, "State"),
                    Ports: Get(root, "Ports")));
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to parse docker ps line: {Line}", line);
            }
        }

        return containers;
    }

    /// <summary>Starts a new container for a stack, building from /environments/{stack}/Dockerfile if no image exists yet.</summary>
    public async Task<LiveContainer> StartStackAsync(string stack, CancellationToken cancellationToken)
    {
        var normalized = stack.Trim().ToLowerInvariant();
        if (!StackImages.TryGetValue(normalized, out var image))
        {
            throw new ArgumentException($"Unsupported stack '{stack}'. Supported: {string.Join(", ", SupportedStacks)}.");
        }

        var containerName = $"devcloud-{normalized}-{Guid.NewGuid():N}"[..28];
        var stackDir = $"/environments/{normalized}";

        // Build the image from the stack Dockerfile if it isn't present, then run a detached container.
        var script =
            $"set -e; " +
            $"if ! docker image inspect {image} >/dev/null 2>&1; then " +
            $"  if [ -f {stackDir}/Dockerfile ]; then docker build -t {image} {stackDir}; fi; " +
            $"fi; " +
            $"docker run -d --name {containerName} -P {image} >/dev/null; " +
            $"docker ps --all --no-trunc --format '{{{{json .}}}}' --filter name={containerName}";

        var output = await _ssh.RunAsync(script, cancellationToken);
        var created = ParseFirst(output) ?? new LiveContainer(containerName, containerName, image, "starting", "created", "");
        _logger.LogInformation("Started environment {Container} from {Image}", containerName, image);
        return created;
    }

    public Task<string> StopAsync(string containerName, CancellationToken cancellationToken) =>
        _ssh.RunAsync($"docker stop {Sanitize(containerName)}", cancellationToken);

    private LiveContainer? ParseFirst(string raw)
    {
        foreach (var line in raw.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!line.StartsWith('{')) continue;
            try
            {
                using var doc = JsonDocument.Parse(line);
                var root = doc.RootElement;
                return new LiveContainer(Get(root, "ID"), Get(root, "Names"), Get(root, "Image"), Get(root, "Status"), Get(root, "State"), Get(root, "Ports"));
            }
            catch (JsonException) { }
        }
        return null;
    }

    private static string Get(JsonElement el, string name) =>
        el.TryGetProperty(name, out var v) ? v.GetString() ?? "" : "";

    private static string Sanitize(string name) =>
        new string(name.Where(c => char.IsLetterOrDigit(c) || c is '-' or '_' or '.').ToArray());
}
