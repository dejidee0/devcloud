using System.Text;
using Microsoft.Extensions.Logging;
using Renci.SshNet;

namespace DevCloud.Infrastructure.Services;

/// <summary>
/// Establishes SSH connections to the Hetzner host and runs commands.
/// Connection details come from environment variables only — no secrets in code:
///   DEVCLOUD_SSH_HOST (default 167.233.97.163)
///   DEVCLOUD_SSH_USER (default root)
///   DEVCLOUD_SSH_PORT (default 22)
///   DEVCLOUD_SSH_KEY  (base64-encoded OpenSSH private key, REQUIRED)
/// The key is loaded from an in-memory stream so the secret never touches disk.
/// </summary>
public sealed class SshCommandRunner
{
    private readonly ILogger<SshCommandRunner> _logger;

    public SshCommandRunner(ILogger<SshCommandRunner> logger) => _logger = logger;

    private static string Host => Environment.GetEnvironmentVariable("DEVCLOUD_SSH_HOST") ?? "167.233.97.163";
    private static string User => Environment.GetEnvironmentVariable("DEVCLOUD_SSH_USER") ?? "root";
    private static int Port => int.TryParse(Environment.GetEnvironmentVariable("DEVCLOUD_SSH_PORT"), out var p) ? p : 22;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("DEVCLOUD_SSH_KEY"));

    private static PrivateKeyFile LoadKey()
    {
        var b64 = Environment.GetEnvironmentVariable("DEVCLOUD_SSH_KEY");
        if (string.IsNullOrWhiteSpace(b64))
        {
            throw new InvalidOperationException("DEVCLOUD_SSH_KEY environment variable is not set.");
        }

        byte[] keyBytes;
        try
        {
            keyBytes = Convert.FromBase64String(b64.Trim());
        }
        catch (FormatException)
        {
            // Allow a raw (non-base64) PEM to be provided directly as a fallback.
            keyBytes = Encoding.UTF8.GetBytes(b64);
        }

        using var stream = new MemoryStream(keyBytes);
        return new PrivateKeyFile(stream);
    }

    /// <summary>Creates and connects an SshClient for interactive shell sessions. Caller owns disposal.</summary>
    public SshClient CreateConnectedClient()
    {
        var key = LoadKey();
        var connectionInfo = new ConnectionInfo(Host, Port, User, new PrivateKeyAuthenticationMethod(User, key))
        {
            Timeout = TimeSpan.FromSeconds(15)
        };
        var client = new SshClient(connectionInfo);
        client.Connect();
        return client;
    }

    /// <summary>Runs a single command and returns stdout (or stderr if the command failed).</summary>
    public Task<string> RunAsync(string command, CancellationToken cancellationToken = default) =>
        RunManyAsync(new[] { command }, cancellationToken).ContinueWith(t => t.Result[command], cancellationToken);

    /// <summary>Runs several commands over one connection and returns a map of command -> output.</summary>
    public async Task<IReadOnlyDictionary<string, string>> RunManyAsync(IEnumerable<string> commands, CancellationToken cancellationToken = default)
    {
        var key = LoadKey();
        var connectionInfo = new ConnectionInfo(Host, Port, User, new PrivateKeyAuthenticationMethod(User, key))
        {
            Timeout = TimeSpan.FromSeconds(15)
        };

        var results = new Dictionary<string, string>();
        using var client = new SshClient(connectionInfo);

        await Task.Run(() =>
        {
            client.Connect();
            try
            {
                foreach (var command in commands)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    using var cmd = client.CreateCommand(command);
                    cmd.CommandTimeout = TimeSpan.FromSeconds(20);
                    var output = cmd.Execute();
                    results[command] = cmd.ExitStatus == 0 || !string.IsNullOrWhiteSpace(output)
                        ? output
                        : cmd.Error;
                }
            }
            finally
            {
                client.Disconnect();
            }
        }, cancellationToken);

        return results;
    }
}
