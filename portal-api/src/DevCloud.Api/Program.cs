using System.Text;
using System.Text.Json.Serialization;
using DevCloud.Api.Endpoints;
using DevCloud.Api.Hubs;
using DevCloud.Api.Middleware;
using DevCloud.Api.Services;
using DevCloud.Application;
using DevCloud.Infrastructure.Auth;
using DevCloud.Infrastructure.Data;
using DevCloud.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwt = jwtSection.Get<JwtOptions>() ?? new JwtOptions();
var envJwtKey = Environment.GetEnvironmentVariable("DEVCLOUD_JWT_KEY");
if (!string.IsNullOrWhiteSpace(envJwtKey))
{
    jwt.SigningKey = envJwtKey;
}

builder.Services.Configure<JwtOptions>(options =>
{
    jwtSection.Bind(options);
    if (!string.IsNullOrWhiteSpace(envJwtKey))
    {
        options.SigningKey = envJwtKey;
    }
});

var connectionString = Environment.GetEnvironmentVariable("DEVCLOUD_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Database connection string is not configured.");

builder.Services.AddDbContext<DevCloudDbContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<DockerEnvironmentService>();
builder.Services.AddScoped<InfrastructureStatusService>();

// Real-server + AI services
builder.Services.AddSingleton<SshCommandRunner>();
builder.Services.AddSingleton<ServerMonitorService>();
builder.Services.AddSingleton<NetworkVerificationService>();
builder.Services.AddScoped<DockerLiveService>();
builder.Services.AddScoped<ReportPdfService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<SecurityScanRunner>();
builder.Services.AddHttpClient<ClaudeAiService>(client =>
{
    client.Timeout = TimeSpan.FromMinutes(3);
});
builder.Services.AddHostedService<ScheduledSecurityScanJob>();
builder.Services.AddHostedService<ServerMetricSnapshotJob>();

builder.Services.AddSignalR().AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
var configuredCorsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();
var envCorsOrigins = Environment.GetEnvironmentVariable("DEVCLOUD_CORS_ORIGINS")
    ?.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? Array.Empty<string>();
var corsOrigins = configuredCorsOrigins
    .Concat(envCorsOrigins)
    .Concat(new[]
    {
        "http://localhost:3000",
        "https://devcloud-three.vercel.app"
    })
    .Select(origin => origin.Trim().TrimEnd('/'))
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

static bool IsAllowedCorsOrigin(string origin, string[] allowedOrigins)
{
    var normalizedOrigin = origin.TrimEnd('/');
    if (allowedOrigins.Contains(normalizedOrigin, StringComparer.OrdinalIgnoreCase))
    {
        return true;
    }

    return Uri.TryCreate(normalizedOrigin, UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttps
        && uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Portal", policy => policy
        .SetIsOriginAllowed(origin => IsAllowedCorsOrigin(origin, corsOrigins))
        .AllowCredentials()
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["devcloud_access"];
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(RolePolicies.OwnerOnly, p => p.RequireRole("Owner"));
    options.AddPolicy(RolePolicies.Leadership, p => p.RequireRole("Owner", "CoFounder"));
    options.AddPolicy(RolePolicies.Authenticated, p => p.RequireAuthenticatedUser());
});

var app = builder.Build();

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("Portal");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok", at = DateTimeOffset.UtcNow }));
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapProjectEndpoints();
app.MapTicketEndpoints();
app.MapEnvironmentEndpoints();
app.MapDeploymentEndpoints();
app.MapSessionEndpoints();
app.MapInfrastructureEndpoints();
app.MapAiEndpoints();
app.MapAnalyticsEndpoints();
app.MapAuditEndpoints();
app.MapTimeTrackingEndpoints();
app.MapHub<ActivityHub>("/hubs/activity");
app.MapHub<TerminalHub>("/hubs/terminal");

_ = Task.Run(async () =>
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DevCloudDbContext>();
        await db.Database.MigrateAsync();
        app.Logger.LogInformation("Database migration check completed.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Database migration check failed during background startup.");
    }
});

app.Logger.LogInformation("DevCloud API routes mapped. Starting Kestrel.");
app.Run();



