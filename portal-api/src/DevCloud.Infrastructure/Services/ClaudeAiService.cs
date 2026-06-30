using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace DevCloud.Infrastructure.Services;

public sealed record ClaudeResult(string Text, int InputTokens, int OutputTokens);

/// <summary>
/// Thin client over the Anthropic Messages API (https://api.anthropic.com/v1/messages).
/// The API key is read from the ANTHROPIC_API_KEY environment variable only — never hardcoded.
/// </summary>
public sealed class ClaudeAiService
{
    public const string Model = "claude-sonnet-4-6";
    private const string Endpoint = "https://api.anthropic.com/v1/messages";
    private const string ApiVersion = "2023-06-01";

    private static readonly JsonSerializerOptions Json = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly HttpClient _http;
    private readonly ILogger<ClaudeAiService> _logger;

    public ClaudeAiService(HttpClient http, ILogger<ClaudeAiService> logger)
    {
        _http = http;
        _logger = logger;
    }

    public static bool IsConfigured => !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY"));

    public async Task<ClaudeResult> CompleteAsync(string system, string userMessage, int maxTokens, CancellationToken cancellationToken)
    {
        var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("ANTHROPIC_API_KEY environment variable is not set.");
        }

        var payload = new
        {
            model = Model,
            max_tokens = maxTokens,
            system,
            messages = new[] { new { role = "user", content = userMessage } }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", ApiVersion);

        using var response = await _http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Anthropic API error {Status}: {Body}", (int)response.StatusCode, body);
            throw new InvalidOperationException($"Anthropic API returned {(int)response.StatusCode}: {body}");
        }

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        var text = "";
        if (root.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.Array)
        {
            foreach (var block in content.EnumerateArray())
            {
                if (block.TryGetProperty("type", out var t) && t.GetString() == "text"
                    && block.TryGetProperty("text", out var txt))
                {
                    text += txt.GetString();
                }
            }
        }

        var input = 0;
        var output = 0;
        if (root.TryGetProperty("usage", out var usage))
        {
            if (usage.TryGetProperty("input_tokens", out var it)) input = it.GetInt32();
            if (usage.TryGetProperty("output_tokens", out var ot)) output = ot.GetInt32();
        }

        return new ClaudeResult(text, input, output);
    }

    /// <summary>
    /// Calls Claude and parses the first JSON object/array found in the reply.
    /// Tolerates markdown fences and surrounding prose so callers always get clean JSON.
    /// </summary>
    public async Task<(JsonElement Json, ClaudeResult Raw)> CompleteJsonAsync(string system, string userMessage, int maxTokens, CancellationToken cancellationToken)
    {
        var result = await CompleteAsync(system, userMessage, maxTokens, cancellationToken);
        var json = ExtractJson(result.Text);
        return (json, result);
    }

    internal static JsonElement ExtractJson(string text)
    {
        var trimmed = text.Trim();

        // Strip ```json ... ``` fences if present.
        if (trimmed.StartsWith("```"))
        {
            var firstNewline = trimmed.IndexOf('\n');
            if (firstNewline >= 0) trimmed = trimmed[(firstNewline + 1)..];
            if (trimmed.EndsWith("```")) trimmed = trimmed[..^3];
            trimmed = trimmed.Trim();
        }

        var startObj = trimmed.IndexOf('{');
        var startArr = trimmed.IndexOf('[');
        var start = (startObj, startArr) switch
        {
            (-1, var a) => a,
            (var o, -1) => o,
            var (o, a) => Math.Min(o, a)
        };
        var endObj = trimmed.LastIndexOf('}');
        var endArr = trimmed.LastIndexOf(']');
        var end = Math.Max(endObj, endArr);

        if (start >= 0 && end > start)
        {
            trimmed = trimmed[start..(end + 1)];
        }

        using var doc = JsonDocument.Parse(trimmed);
        return doc.RootElement.Clone();
    }
}
