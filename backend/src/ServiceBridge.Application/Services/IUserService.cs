using ServiceBridge.Application.DTOs;

namespace ServiceBridge.Application.Services;

public interface IUserService
{
    Task<UserDto?> AuthenticateAsync(string email, string password);
    Task<UserDto?> GetUserByIdAsync(string userId);
    Task<UserDto?> GetUserByEmailAsync(string email);
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
}