using Microsoft.IdentityModel.Tokens;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ServiceBridge.Infrastructure.Services;

public class JwtService : IJwtService
{
    private readonly IJwtConfigurationService _jwtConfig;
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expirationMinutes;

    public JwtService(IJwtConfigurationService jwtConfigurationService)
    {
        _jwtConfig = jwtConfigurationService ?? throw new ArgumentNullException(nameof(jwtConfigurationService));
        
        _secretKey = _jwtConfig.GetSecretKey();
        _issuer = _jwtConfig.GetIssuer();
        _audience = _jwtConfig.GetAudience();
        _expirationMinutes = _jwtConfig.GetExpirationMinutes();

        // Security validation for demo
        if (!_jwtConfig.IsSecretKeySecure())
        {
            Console.WriteLine("⚠️  WARNING: JWT secret key may not meet production security requirements");
        }
    }

    public string GenerateToken(UserDto user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("FullName", user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, 
                new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(), 
                ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public bool ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_secretKey);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public UserDto? GetUserFromToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwt = tokenHandler.ReadJwtToken(token);

            return new UserDto
            {
                UserId = jwt.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value ?? string.Empty,
                Username = jwt.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Name)?.Value ?? string.Empty,
                Email = jwt.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Email)?.Value ?? string.Empty,
                Role = jwt.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Role)?.Value ?? string.Empty,
                FullName = jwt.Claims.FirstOrDefault(x => x.Type == "FullName")?.Value ?? string.Empty
            };
        }
        catch
        {
            return null;
        }
    }
}