using ServiceBridge.Application.DTOs;

namespace ServiceBridge.Application.Services;

public interface IJwtService
{
    string GenerateToken(UserDto user);
    bool ValidateToken(string token);
    UserDto? GetUserFromToken(string token);
}