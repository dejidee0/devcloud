namespace DevCloud.Infrastructure.Auth;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "DevCloud";
    public string Audience { get; set; } = "DevCloudPortal";
    public string SigningKey { get; set; } = "replace-with-64-byte-secret-in-production";
    public int AccessTokenMinutes { get; set; } = 30;
    public int RefreshTokenDays { get; set; } = 14;
}
