using System.Collections.Concurrent;
using System.Text;
using DevCloud.Application;
using DevCloud.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Renci.SshNet;

namespace DevCloud.Api.Hubs;

/// <summary>
/// Streams a real interactive SSH shell on the Hetzner host to an xterm.js client.
/// Owner-only: this is a root shell on the production server.
/// </summary>
[Authorize(Policy = RolePolicies.OwnerOnly)]
public sealed class TerminalHub : Hub
{
    private sealed record Session(SshClient Client, ShellStream Stream);

    private static readonly ConcurrentDictionary<string, Session> Sessions = new();

    private readonly SshCommandRunner _ssh;
    private readonly IHubContext<TerminalHub> _hub;
    private readonly ILogger<TerminalHub> _logger;

    public TerminalHub(SshCommandRunner ssh, IHubContext<TerminalHub> hub, ILogger<TerminalHub> logger)
    {
        _ssh = ssh;
        _hub = hub;
        _logger = logger;
    }

    public Task Start(int cols, int rows)
    {
        var connectionId = Context.ConnectionId;
        EndSession(connectionId);

        if (!_ssh.IsConfigured)
        {
            return Clients.Caller.SendAsync("output", "\r\nDEVCLOUD_SSH_KEY is not configured on the server.\r\n");
        }

        try
        {
            var client = _ssh.CreateConnectedClient();
            var stream = client.CreateShellStream("xterm-256color",
                (uint)Math.Clamp(cols, 20, 400), (uint)Math.Clamp(rows, 5, 200), 800, 600, 8192);

            stream.DataReceived += (_, e) =>
            {
                try
                {
                    var text = Encoding.UTF8.GetString(e.Data);
                    _hub.Clients.Client(connectionId).SendAsync("output", text);
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Terminal data relay failed.");
                }
            };

            Sessions[connectionId] = new Session(client, stream);
            return Clients.Caller.SendAsync("ready");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to open SSH shell.");
            return Clients.Caller.SendAsync("output", $"\r\nFailed to connect: {ex.Message}\r\n");
        }
    }

    public Task Input(string data)
    {
        if (Sessions.TryGetValue(Context.ConnectionId, out var session))
        {
            var bytes = Encoding.UTF8.GetBytes(data);
            session.Stream.Write(bytes, 0, bytes.Length);
            session.Stream.Flush();
        }
        return Task.CompletedTask;
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        EndSession(Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }

    private static void EndSession(string connectionId)
    {
        if (Sessions.TryRemove(connectionId, out var session))
        {
            try { session.Stream.Dispose(); } catch { /* ignore */ }
            try { if (session.Client.IsConnected) session.Client.Disconnect(); session.Client.Dispose(); } catch { /* ignore */ }
        }
    }
}
