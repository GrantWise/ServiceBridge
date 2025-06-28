using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Services;

namespace ServiceBridge.Infrastructure.Services;

public class UserService : IUserService
{
    private static readonly List<UserDto> _users = new()
    {
        new UserDto 
        { 
            UserId = "1", 
            Username = "admin", 
            Email = "admin@servicebridge.com", 
            Role = "Admin", 
            FullName = "System Administrator" 
        },
        new UserDto 
        { 
            UserId = "2", 
            Username = "manager", 
            Email = "manager@servicebridge.com", 
            Role = "Manager", 
            FullName = "Inventory Manager" 
        },
        new UserDto 
        { 
            UserId = "3", 
            Username = "scanner1", 
            Email = "scanner1@servicebridge.com", 
            Role = "Scanner", 
            FullName = "Scanner User 1" 
        },
        new UserDto 
        { 
            UserId = "4", 
            Username = "scanner2", 
            Email = "scanner2@servicebridge.com", 
            Role = "Scanner", 
            FullName = "Scanner User 2" 
        }
    };

    private static readonly Dictionary<string, string> _credentials = new()
    {
        { "admin@servicebridge.com", "admin123" },
        { "manager@servicebridge.com", "manager123" },
        { "scanner1@servicebridge.com", "scanner123" },
        { "scanner2@servicebridge.com", "scanner123" }
    };

    public Task<UserDto?> AuthenticateAsync(string email, string password)
    {
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            return Task.FromResult<UserDto?>(null);

        if (_credentials.TryGetValue(email.ToLowerInvariant(), out var storedPassword) && 
            storedPassword == password)
        {
            var user = _users.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(user);
        }

        return Task.FromResult<UserDto?>(null);
    }

    public Task<UserDto?> GetUserByIdAsync(string userId)
    {
        var user = _users.FirstOrDefault(u => u.UserId == userId);
        return Task.FromResult(user);
    }

    public Task<UserDto?> GetUserByEmailAsync(string email)
    {
        var user = _users.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(user);
    }

    public Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        return Task.FromResult<IEnumerable<UserDto>>(_users);
    }
}