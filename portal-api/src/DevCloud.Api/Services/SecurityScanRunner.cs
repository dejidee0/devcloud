using System.Text.Json;
using DevCloud.Domain.Entities;
using DevCloud.Domain.Enums;
using DevCloud.Infrastructure.Data;
using DevCloud.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DevCloud.Api.Services;

/// <summary>
/// Runs a real secret/vulnerability grep over the project folder on the Hetzner host,
/// then sends the findings to Claude for risk scoring and analysis. Results persist to SecurityScans.
/// </summary>
public sealed class SecurityScanRunner
{
    private const string ScanSystemPrompt =
        "You are a senior application security engineer. You will be given raw grep output from a codebase " +
        "(potential secrets, credentials, and risky patterns). Analyse it and respond with ONLY a JSON object: " +
        "{ \"summary\": string, \"riskScore\": number (0-100), \"highestSeverity\": \"Info|Low|Medium|High|Critical\", " +
        "\"findings\": [ { \"severity\": \"Info|Low|Medium|High|Critical\", \"title\": string, \"detail\": string, " +
        "\"location\": string, \"recommendation\": string } ] }. Discount obvious test fixtures, placeholders, and " +
        "example values. If nothing meaningful is found, return an empty findings array with a low risk score.";

    private readonly DevCloudDbContext _db;
    private readonly SshCommandRunner _ssh;
    private readonly ClaudeAiService _ai;

    public SecurityScanRunner(DevCloudDbContext db, SshCommandRunner ssh, ClaudeAiService ai)
    {
        _db = db;
        _ssh = ssh;
        _ai = ai;
    }

    public async Task<SecurityScan> RunAsync(Guid? projectId, Guid? triggeredById, bool automated, CancellationToken cancellationToken)
    {
        var scan = new SecurityScan
        {
            ProjectId = projectId,
            TriggeredById = triggeredById,
            IsAutomated = automated,
            Status = SecurityScanStatus.Running
        };
        _db.SecurityScans.Add(scan);
        await _db.SaveChangesAsync(cancellationToken);

        try
        {
            var baseDir = Environment.GetEnvironmentVariable("DEVCLOUD_PROJECTS_DIR") ?? "/srv";
            string scanDir = baseDir;

            if (projectId is { } pid)
            {
                var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == pid, cancellationToken);
                if (project is not null)
                {
                    var safeName = new string(project.Name.Where(c => char.IsLetterOrDigit(c) || c is '-' or '_').ToArray());
                    if (!string.IsNullOrWhiteSpace(safeName))
                    {
                        var found = await _ssh.RunAsync(
                            $"find {baseDir} /opt /root /home -maxdepth 4 -type d -iname '*{safeName}*' 2>/dev/null | head -n1",
                            cancellationToken);
                        if (!string.IsNullOrWhiteSpace(found.Trim())) scanDir = found.Trim();
                    }
                }
            }

            var grep =
                "timeout 25 grep -rInE --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=bin " +
                "--exclude-dir=obj --exclude-dir=dist --exclude-dir=.next " +
                "'(api[_-]?key|secret|passwo?rd|access[_-]?token|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|bearer [A-Za-z0-9._-]+)' " +
                $"{scanDir} 2>/dev/null | head -n 80";

            var rawFindings = await _ssh.RunAsync(grep, cancellationToken);
            if (string.IsNullOrWhiteSpace(rawFindings))
            {
                rawFindings = "(no matching secret or vulnerable patterns found)";
            }

            var userMessage =
                $"Scanned directory: {scanDir}\n\nRaw grep findings (file:line:content):\n{rawFindings}";

            var (json, raw) = await _ai.CompleteJsonAsync(ScanSystemPrompt, userMessage, 2000, cancellationToken);

            scan.Summary = GetString(json, "summary");
            scan.RiskScore = GetInt(json, "riskScore");
            scan.HighestSeverity = ParseSeverity(GetString(json, "highestSeverity"));
            if (json.TryGetProperty("findings", out var findings) && findings.ValueKind == JsonValueKind.Array)
            {
                scan.FindingsJson = findings.GetRawText();
                scan.FindingsCount = findings.GetArrayLength();
            }
            scan.InputTokens = raw.InputTokens;
            scan.OutputTokens = raw.OutputTokens;
            scan.Status = SecurityScanStatus.Completed;
            scan.CompletedAt = DateTimeOffset.UtcNow;
        }
        catch (Exception ex)
        {
            scan.Status = SecurityScanStatus.Failed;
            scan.Summary = $"Scan failed: {ex.Message}";
            scan.CompletedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return scan;
    }

    private static string? GetString(JsonElement el, string name) =>
        el.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private static int GetInt(JsonElement el, string name) =>
        el.TryGetProperty(name, out var v) && v.TryGetInt32(out var i) ? i : 0;

    private static SecuritySeverity ParseSeverity(string? value) =>
        Enum.TryParse<SecuritySeverity>(value, true, out var s) ? s : SecuritySeverity.Info;
}
