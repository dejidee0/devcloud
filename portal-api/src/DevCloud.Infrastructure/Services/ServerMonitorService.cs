using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace DevCloud.Infrastructure.Services;

public sealed record CpuStat(double Percent);
public sealed record RamStat(int UsedMb, int TotalMb);
public sealed record DiskStat(double UsedGb, double TotalGb);
public sealed record ServerStats(CpuStat Cpu, RamStat Ram, DiskStat Disk, DateTimeOffset CheckedAt);

/// <summary>
/// SSHes into the Hetzner host, runs top/free/df, parses real CPU/RAM/Disk numbers,
/// and caches the result for 30 seconds to avoid hammering SSH.
/// </summary>
public sealed class ServerMonitorService
{
    private const string CpuCmd = "top -bn1 | grep -i 'Cpu(s)'";
    private const string MemCmd = "free -m";
    private const string DiskCmd = "df -h /";

    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(30);
    private static readonly SemaphoreSlim Gate = new(1, 1);

    private readonly SshCommandRunner _ssh;
    private readonly ILogger<ServerMonitorService> _logger;

    private ServerStats? _cached;
    private DateTimeOffset _cachedAt;

    public ServerMonitorService(SshCommandRunner ssh, ILogger<ServerMonitorService> logger)
    {
        _ssh = ssh;
        _logger = logger;
    }

    public async Task<ServerStats> GetStatsAsync(CancellationToken cancellationToken)
    {
        if (_cached is not null && DateTimeOffset.UtcNow - _cachedAt < CacheTtl)
        {
            return _cached;
        }

        await Gate.WaitAsync(cancellationToken);
        try
        {
            if (_cached is not null && DateTimeOffset.UtcNow - _cachedAt < CacheTtl)
            {
                return _cached;
            }

            var outputs = await _ssh.RunManyAsync(new[] { CpuCmd, MemCmd, DiskCmd }, cancellationToken);
            var stats = new ServerStats(
                ParseCpu(outputs.GetValueOrDefault(CpuCmd, "")),
                ParseRam(outputs.GetValueOrDefault(MemCmd, "")),
                ParseDisk(outputs.GetValueOrDefault(DiskCmd, "")),
                DateTimeOffset.UtcNow);

            _cached = stats;
            _cachedAt = DateTimeOffset.UtcNow;
            return stats;
        }
        finally
        {
            Gate.Release();
        }
    }

    // "%Cpu(s):  2.9 us,  5.7 sy,  0.0 ni, 91.4 id, ..."  ->  100 - idle
    internal static CpuStat ParseCpu(string raw)
    {
        var idle = Regex.Match(raw, @"([\d.]+)\s*id");
        if (idle.Success && double.TryParse(idle.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var id))
        {
            return new CpuStat(Math.Round(Math.Clamp(100 - id, 0, 100), 1));
        }

        // Fallback: sum the us + sy components.
        var us = MatchNumber(raw, @"([\d.]+)\s*us");
        var sy = MatchNumber(raw, @"([\d.]+)\s*sy");
        return new CpuStat(Math.Round(Math.Clamp(us + sy, 0, 100), 1));
    }

    // free -m: "Mem:  7743  2888  353  87  4501  4457"  -> total, used
    internal static RamStat ParseRam(string raw)
    {
        foreach (var line in raw.Split('\n'))
        {
            if (!line.TrimStart().StartsWith("Mem:", StringComparison.OrdinalIgnoreCase)) continue;
            var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (parts.Length >= 3
                && int.TryParse(parts[1], out var total)
                && int.TryParse(parts[2], out var used))
            {
                return new RamStat(used, total);
            }
        }
        return new RamStat(0, 0);
    }

    // df -h /: "/dev/sda1  75G  15G  58G  21% /"  -> total, used
    internal static DiskStat ParseDisk(string raw)
    {
        var lines = raw.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        for (var i = lines.Length - 1; i >= 0; i--)
        {
            var parts = lines[i].Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (parts.Length >= 4 && (parts[0].StartsWith('/') || lines[i].Contains('%')))
            {
                var total = ParseSize(parts[1]);
                var used = ParseSize(parts[2]);
                if (total > 0) return new DiskStat(used, total);
            }
        }
        return new DiskStat(0, 0);
    }

    // "75G" / "1.4T" / "512M" -> gigabytes
    private static double ParseSize(string token)
    {
        var m = Regex.Match(token, @"([\d.]+)\s*([KMGTP]?)", RegexOptions.IgnoreCase);
        if (!m.Success || !double.TryParse(m.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var value))
        {
            return 0;
        }

        return m.Groups[2].Value.ToUpperInvariant() switch
        {
            "K" => Math.Round(value / 1_000_000, 2),
            "M" => Math.Round(value / 1_000, 2),
            "G" => Math.Round(value, 2),
            "T" => Math.Round(value * 1_000, 2),
            "P" => Math.Round(value * 1_000_000, 2),
            _ => Math.Round(value / 1_000_000_000, 2)
        };
    }

    private static double MatchNumber(string raw, string pattern)
    {
        var m = Regex.Match(raw, pattern);
        return m.Success && double.TryParse(m.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var v) ? v : 0;
    }
}
