using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace DevCloud.Infrastructure.Services;

public sealed record OpenPort(int Port, string Service, string Risk, string Note, string Process);
public sealed record GeoLocation(string? City, string? Region, string? Country, string? Isp, double? Lat, double? Lng);
public sealed record NetworkVerification(
    string? PublicIp,
    GeoLocation Location,
    bool DnsLeakDetected,
    IReadOnlyList<OpenPort> OpenPorts,
    bool AnyDeskOrRdpDetected,
    bool FirewallActive,
    string Status,
    bool Verified,
    DateTimeOffset LastVerified);

/// <summary>
/// SSHes into the Hetzner host and verifies its network security posture using real
/// command output (public IP, geolocation, listening ports, firewall, DNS resolution).
/// Caches results for 60 seconds.
/// </summary>
public sealed class NetworkVerificationService
{
    private const string IpCmd = "curl -s --max-time 8 ifconfig.me";
    private const string GeoCmd = "curl -s --max-time 8 ipinfo.io/json";
    private const string PortsCmd = "ss -tlnp 2>/dev/null || ss -tln";
    private const string FirewallCmd = "ufw status verbose 2>/dev/null || echo 'unavailable'";
    private const string DnsCmd = "dig +short myip.opendns.com @resolver1.opendns.com 2>/dev/null";

    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(60);
    private static readonly SemaphoreSlim Gate = new(1, 1);

    private readonly SshCommandRunner _ssh;
    private readonly ILogger<NetworkVerificationService> _logger;

    private NetworkVerification? _cached;
    private DateTimeOffset _cachedAt;

    public NetworkVerificationService(SshCommandRunner ssh, ILogger<NetworkVerificationService> logger)
    {
        _ssh = ssh;
        _logger = logger;
    }

    public async Task<(NetworkVerification Result, bool Fresh)> GetAsync(CancellationToken cancellationToken)
    {
        if (_cached is not null && DateTimeOffset.UtcNow - _cachedAt < CacheTtl)
        {
            return (_cached, false);
        }

        await Gate.WaitAsync(cancellationToken);
        try
        {
            if (_cached is not null && DateTimeOffset.UtcNow - _cachedAt < CacheTtl)
            {
                return (_cached, false);
            }

            var outputs = await _ssh.RunManyAsync(new[] { IpCmd, GeoCmd, PortsCmd, FirewallCmd, DnsCmd }, cancellationToken);

            var publicIp = Clean(outputs.GetValueOrDefault(IpCmd, ""));
            var location = ParseGeo(outputs.GetValueOrDefault(GeoCmd, ""));
            var ports = ParsePorts(outputs.GetValueOrDefault(PortsCmd, ""));
            var firewallActive = outputs.GetValueOrDefault(FirewallCmd, "").Contains("Status: active", StringComparison.OrdinalIgnoreCase);
            var dnsIp = Clean(outputs.GetValueOrDefault(DnsCmd, "").Split('\n').FirstOrDefault() ?? "");
            var dnsLeak = !string.IsNullOrEmpty(dnsIp) && !string.IsNullOrEmpty(publicIp) && dnsIp != publicIp;

            var rdpDetected = ports.Any(p => p.Port is 3389 or 5938)
                || outputs.GetValueOrDefault(PortsCmd, "").Contains("anydesk", StringComparison.OrdinalIgnoreCase);

            var risky = ports.Any(p => p.Port != 22 && (p.Risk is "high" or "medium")) || rdpDetected || dnsLeak;
            var verified = !string.IsNullOrEmpty(publicIp); // we could reach the host and read its IP
            var status = !verified ? "unable to verify" : risky ? "Review Needed" : "Verified Clean";

            var result = new NetworkVerification(
                string.IsNullOrEmpty(publicIp) ? null : publicIp,
                location,
                dnsLeak,
                ports,
                rdpDetected,
                firewallActive,
                status,
                verified,
                DateTimeOffset.UtcNow);

            _cached = result;
            _cachedAt = DateTimeOffset.UtcNow;
            return (result, true);
        }
        finally
        {
            Gate.Release();
        }
    }

    private static GeoLocation ParseGeo(string json)
    {
        if (string.IsNullOrWhiteSpace(json) || !json.TrimStart().StartsWith('{'))
        {
            return new GeoLocation(null, null, null, null, null, null);
        }
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            string? Get(string k) => root.TryGetProperty(k, out var v) ? v.GetString() : null;
            var org = Get("org");
            var isp = string.IsNullOrEmpty(org) ? null : Regex.Replace(org, @"^AS\d+\s*", "").Trim();
            double? lat = null, lng = null;
            var loc = Get("loc");
            if (!string.IsNullOrEmpty(loc) && loc.Contains(','))
            {
                var parts = loc.Split(',');
                if (double.TryParse(parts[0], System.Globalization.CultureInfo.InvariantCulture, out var la)) lat = la;
                if (double.TryParse(parts[1], System.Globalization.CultureInfo.InvariantCulture, out var lo)) lng = lo;
            }
            return new GeoLocation(Get("city"), Get("region"), Get("country"), isp, lat, lng);
        }
        catch (JsonException)
        {
            return new GeoLocation(null, null, null, null, null, null);
        }
    }

    private static IReadOnlyList<OpenPort> ParsePorts(string raw)
    {
        var byPort = new Dictionary<int, OpenPort>();
        foreach (var line in raw.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            if (!line.Contains("LISTEN", StringComparison.OrdinalIgnoreCase)) continue;
            // Local Address:Port is typically the 4th column; grab the token containing the last ':'
            var portMatch = Regex.Match(line, @"[\d\.\*\]:]+:(\d+)\s");
            if (!portMatch.Success) continue;
            if (!int.TryParse(portMatch.Groups[1].Value, out var port)) continue;

            var procMatch = Regex.Match(line, @"users:\(\(""([^""]+)""");
            var process = procMatch.Success ? procMatch.Groups[1].Value : "";

            if (!byPort.ContainsKey(port))
            {
                byPort[port] = Classify(port, process);
            }
        }
        return byPort.Values.OrderBy(p => p.Port).ToList();
    }

    private static OpenPort Classify(int port, string process) => port switch
    {
        22 => new OpenPort(22, "SSH", "low", "key-only auth", process),
        80 => new OpenPort(80, "HTTP", "low", "web", process),
        443 => new OpenPort(443, "HTTPS", "low", "web (TLS)", process),
        1433 => new OpenPort(1433, "SQL Server", "medium", "database exposed", process),
        3389 => new OpenPort(3389, "RDP", "high", "remote desktop exposed", process),
        5432 => new OpenPort(5432, "PostgreSQL", "medium", "database", process),
        6379 => new OpenPort(6379, "Redis", "medium", "cache", process),
        8080 or 8443 or 8888 => new OpenPort(port, "App", "low", "application service", process),
        3080 => new OpenPort(3080, "Teleport", "low", "access proxy", process),
        _ => new OpenPort(port, string.IsNullOrEmpty(process) ? "Unknown" : process, "medium", "review exposure", process)
    };

    private static string Clean(string s) => s.Trim().Trim('\r', '\n');
}
