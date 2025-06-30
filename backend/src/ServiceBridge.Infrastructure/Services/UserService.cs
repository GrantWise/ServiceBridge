using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Services;

namespace ServiceBridge.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IPasswordService _passwordService;
    
    public UserService(IPasswordService passwordService)
    {
        _passwordService = passwordService ?? throw new ArgumentNullException(nameof(passwordService));
    }

    private static readonly List<UserDto> _users = new()
    {
        new UserDto 
        { 
            UserId = "1", 
            Username = "admin", 
            Email = "admin@servicebridge.com", 
            Role = "Admin", 
            FullName = "System Administrator",
            CreatedAt = DateTime.UtcNow.AddDays(-30) // Created 30 days ago
        },
        new UserDto 
        { 
            UserId = "2", 
            Username = "manager", 
            Email = "manager@servicebridge.com", 
            Role = "Manager", 
            FullName = "Inventory Manager",
            CreatedAt = DateTime.UtcNow.AddDays(-20) // Created 20 days ago
        },
        new UserDto 
        { 
            UserId = "3", 
            Username = "scanner1", 
            Email = "scanner1@servicebridge.com", 
            Role = "Scanner", 
            FullName = "Scanner User 1",
            CreatedAt = DateTime.UtcNow.AddDays(-5) // Created 5 days ago (recent)
        },
        new UserDto 
        { 
            UserId = "4", 
            Username = "scanner2", 
            Email = "scanner2@servicebridge.com", 
            Role = "Scanner", 
            FullName = "Scanner User 2",
            CreatedAt = DateTime.UtcNow.AddDays(-2) // Created 2 days ago (recent)
        }
    };

    // Demo credentials with security pattern structure (not actual BCrypt for demo simplicity)
    // In production, these would be proper BCrypt hashes stored in a database
    private static readonly Dictionary<string, string> _hashedCredentials = new()
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

        // Validate password format before attempting verification
        if (!_passwordService.IsPasswordValid(password))
            return Task.FromResult<UserDto?>(null);

        var normalizedEmail = email.ToLowerInvariant();
        
        if (_hashedCredentials.TryGetValue(normalizedEmail, out var hashedPassword))
        {
            // Use constant-time password verification to prevent timing attacks
            if (_passwordService.VerifyPassword(password, hashedPassword))
            {
                var user = _users.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
                return Task.FromResult(user);
            }
        }

        // Always perform a dummy password verification even if user doesn't exist
        // This prevents user enumeration through timing analysis
        _passwordService.VerifyPassword(password, "$2a$12$dummyhashtopreventtimingattacksanduserenum");

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