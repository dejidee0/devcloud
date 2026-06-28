using DevCloud.Domain.Enums;

namespace DevCloud.Application;

public static class RolePolicies
{
    public const string OwnerOnly = "OwnerOnly";
    public const string Leadership = "Leadership";
    public const string Authenticated = "Authenticated";

    public static bool CanCreateUsers(UserRole role) => role == UserRole.Owner;
    public static bool CanControlInfrastructure(UserRole role) => role == UserRole.Owner;
    public static bool CanManageProjects(UserRole role) => role is UserRole.Owner or UserRole.CoFounder;
    public static bool CanManageTickets(UserRole role) => role is UserRole.Owner or UserRole.CoFounder or UserRole.ProductManager;
}
