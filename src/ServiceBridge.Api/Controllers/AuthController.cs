using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Services;

namespace ServiceBridge.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IJwtService _jwtService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUserService userService, 
        IJwtService jwtService,
        ILogger<AuthController> logger)
    {
        _userService = userService;
        _jwtService = jwtService;
        _logger = logger;
    }

    /// <summary>
    /// Authenticate user and return JWT token
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>JWT token and user information</returns>
    /// <response code="200">Login successful</response>
    /// <response code="401">Invalid credentials</response>
    /// <response code="400">Invalid request</response>
    [HttpPost("login")]
    [AllowAnonymous] // Login endpoint should be accessible without authentication
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);

            if (!ModelState.IsValid)
            {
                return BadRequest(new LoginResponse 
                { 
                    Success = false, 
                    Message = "Invalid request data" 
                });
            }

            var user = await _userService.AuthenticateAsync(request.Email, request.Password);
            
            if (user == null)
            {
                _logger.LogWarning("Failed login attempt for email: {Email}", request.Email);
                return Unauthorized(new LoginResponse 
                { 
                    Success = false, 
                    Message = "Invalid email or password" 
                });
            }

            var token = _jwtService.GenerateToken(user);
            var expiresAt = DateTime.UtcNow.AddMinutes(60); // Should match JWT expiration

            _logger.LogInformation("Successful login for user: {UserId} ({Email})", user.UserId, user.Email);

            return Ok(new LoginResponse
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                User = user,
                ExpiresAt = expiresAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
            return StatusCode(500, new LoginResponse 
            { 
                Success = false, 
                Message = "An error occurred during login" 
            });
        }
    }

    /// <summary>
    /// Get current user information from JWT token
    /// </summary>
    /// <returns>Current user information</returns>
    /// <response code="200">User information retrieved</response>
    /// <response code="401">Invalid or missing token</response>
    [HttpGet("me")]
    [Authorize] // Requires valid JWT token
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        try
        {
            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            if (authHeader == null || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { message = "Missing or invalid authorization header" });
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var user = _jwtService.GetUserFromToken(token);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            // Refresh user data from service
            var currentUser = await _userService.GetUserByIdAsync(user.UserId);
            if (currentUser == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            return Ok(currentUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "An error occurred while retrieving user information" });
        }
    }

    /// <summary>
    /// Validate JWT token
    /// </summary>
    /// <param name="token">JWT token to validate</param>
    /// <returns>Token validation result</returns>
    /// <response code="200">Token is valid</response>
    /// <response code="400">Token is invalid</response>
    [HttpPost("validate")]
    [AllowAnonymous] // Token validation should be accessible for client-side validation
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult ValidateToken([FromBody] string token)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { valid = false, message = "Token is required" });
            }

            var isValid = _jwtService.ValidateToken(token);
            var user = isValid ? _jwtService.GetUserFromToken(token) : null;

            return Ok(new { 
                valid = isValid, 
                user = user,
                message = isValid ? "Token is valid" : "Token is invalid or expired"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token");
            return BadRequest(new { valid = false, message = "Token validation failed" });
        }
    }
}