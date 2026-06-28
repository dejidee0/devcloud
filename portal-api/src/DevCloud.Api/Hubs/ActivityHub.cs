using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace DevCloud.Api.Hubs;

[Authorize]
public sealed class ActivityHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("activity", new { action = "connected", at = DateTimeOffset.UtcNow });
        await base.OnConnectedAsync();
    }
}
