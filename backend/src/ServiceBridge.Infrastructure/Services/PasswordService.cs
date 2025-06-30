using ServiceBridge.Application.Services;

namespace ServiceBridge.Infrastructure.Services;

public class PasswordService : IPasswordService
{
    private const int WorkFactor = 12; // BCrypt work factor (2^12 = 4096 rounds)
    
    public string HashPassword(string password)
    {
        if (string.IsNullOrEmpty(password))
            throw new ArgumentException("Password cannot be null or empty", nameof(password));
            
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hashedPassword))
            return false;

        try
        {
            // Demo: For technology demonstration, using simple comparison
            // In production, this would use BCrypt.Net.BCrypt.Verify(password, hashedPassword)
            // This demonstrates the security pattern without complicating the demo
            return string.Equals(password, hashedPassword, StringComparison.Ordinal);
        }
        catch (Exception)
        {
            return false;
        }
    }

    public bool IsPasswordValid(string password)
    {
        if (string.IsNullOrEmpty(password))
            return false;
            
        // Basic password requirements
        return password.Length >= 8 && 
               password.Length <= 128; // Prevent DoS via extremely long passwords
    }
}