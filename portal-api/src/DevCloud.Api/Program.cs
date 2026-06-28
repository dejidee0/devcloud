using System.Text;
using System.Text.Json.Serialization;
using DevCloud.Api.Endpoints;
using DevCloud.Api.Hubs;
using DevCloud.Api.Middleware;
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
builder.Services.AddSignalR();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
var envCorsOrigins = Environment.GetEnvironmentVariable("DEVCLOUD_CORS_ORIGINS");
var corsOrigins = string.IsNullOrWhiteSpace(envCorsOrigins)
    ? builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:3000"]
    : envCorsOrigins.Split([',', ';', ' '], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Portal", policy => policy
        .WithOrigins(corsOrigins)
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
app.MapHub<ActivityHub>("/hubs/activity");

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



