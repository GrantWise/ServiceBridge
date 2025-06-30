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
    private readonly ISecurityLogger _securityLogger;
    private readonly IBruteForceProtectionService _bruteForceProtection;

    public AuthController(
        IUserService userService, 
        IJwtService jwtService,
        ILogger<AuthController> logger,
        ISecurityLogger securityLogger,
        IBruteForceProtectionService bruteForceProtection)
    {
        _userService = userService;
        _jwtService = jwtService;
        _logger = logger;
        _securityLogger = securityLogger;
        _bruteForceProtection = bruteForceProtection;
    }

    /// <summary>
    /// Authenticate user and set httpOnly cookies
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>User information and expiry time</returns>
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
        _logger.LogInformation("Login attempt received for email: {Email}", request?.Email ?? "null");
        
        try
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Login model validation failed for email: {Email}. Errors: {Errors}", 
                    request?.Email ?? "unknown", 
                    string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                _securityLogger.LogSecurityEvent("InvalidLoginRequest", request?.Email ?? "unknown", "Model validation failed");
                return BadRequest(new LoginResponse 
                { 
                    Success = false, 
                    Message = "Invalid request data" 
                });
            }

            // Check for brute force protection
            var clientIdentifier = GetClientIdentifier(request.Email);
            if (await _bruteForceProtection.IsBlockedAsync(clientIdentifier))
            {
                var lockoutTime = await _bruteForceProtection.GetLockoutTimeRemainingAsync(clientIdentifier);
                _securityLogger.LogSecurityEvent("BlockedLoginAttempt", request.Email, $"Account locked, {lockoutTime?.TotalMinutes:F0} minutes remaining");
                
                return StatusCode(429, new LoginResponse 
                { 
                    Success = false, 
                    Message = $"Account temporarily locked. Try again in {lockoutTime?.TotalMinutes:F0} minutes." 
                });
            }

            var user = await _userService.AuthenticateAsync(request.Email, request.Password);
            
            if (user == null)
            {
                // Record failed attempt for brute force protection
                await _bruteForceProtection.RecordFailedAttemptAsync(clientIdentifier);
                
                _securityLogger.LogLoginAttempt(request.Email, false, "Invalid credentials");
                return Unauthorized(new LoginResponse 
                { 
                    Success = false, 
                    Message = "Invalid email or password" 
                });
            }

            // Record successful attempt (clears failed attempts)
            await _bruteForceProtection.RecordSuccessfulAttemptAsync(clientIdentifier);

            var token = _jwtService.GenerateToken(user);
            var expiresAt = DateTime.UtcNow.AddMinutes(60); // Should match JWT expiration

            // Set httpOnly cookies
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps, // Use secure cookies in HTTPS
                SameSite = SameSiteMode.Strict,
                Expires = expiresAt,
                Path = "/"
            };

            Response.Cookies.Append("access_token", token, cookieOptions);

            _securityLogger.LogLoginAttempt(user.Email, true);

            // Return user data and expiry time (no token in response body)
            return Ok(new LoginResponse
            {
                Success = true,
                Message = "Login successful",
                Token = "", // Token is now in httpOnly cookie
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
            // Get user ID from JWT claims (set by JWT middleware)
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                _logger.LogWarning("GetCurrentUser called but no user ID claim found in JWT");
                return Unauthorized(new { message = "Authentication required" });
            }

            var userId = userIdClaim.Value;
            var currentUser = await _userService.GetUserByIdAsync(userId);
            if (currentUser == null)
            {
                _logger.LogWarning("User not found for ID: {UserId}", userId);
                return Unauthorized(new { message = "User not found" });
            }

            _logger.LogDebug("Successfully retrieved current user: {Email}", currentUser.Email);
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

    /// <summary>
    /// Logout user and clear httpOnly cookies
    /// </summary>
    /// <returns>Logout confirmation</returns>
    /// <response code="200">Logout successful</response>
    [HttpPost("logout")]
    [AllowAnonymous] // Logout should be accessible without authentication
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult Logout()
    {
        try
        {
            // Clear httpOnly cookies
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(-1), // Expire immediately
                Path = "/"
            };

            Response.Cookies.Append("access_token", "", cookieOptions);

            _logger.LogInformation("User logged out successfully");

            return Ok(new { 
                success = true, 
                message = "Logout successful" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { 
                success = false, 
                message = "An error occurred during logout" 
            });
        }
    }

    /// <summary>
    /// Get JWT token for gRPC authentication when using httpOnly cookies
    /// This endpoint bridges the gap between cookie-based web authentication and gRPC Bearer token requirements
    /// </summary>
    /// <returns>JWT token for gRPC client authentication</returns>
    /// <response code="200">Returns JWT token for gRPC use</response>
    /// <response code="401">User is not authenticated or token is invalid</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("grpc-token")]
    [ProducesResponseType<GrpcTokenResponse>(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public ActionResult<GrpcTokenResponse> GetGrpcToken()
    {
        try
        {
            // Check if user is authenticated via httpOnly cookie
            var cookieToken = Request.Cookies["access_token"];
            if (string.IsNullOrEmpty(cookieToken))
            {
                _securityLogger.LogSecurityEvent("GrpcTokenRequest", "unknown", "No authentication cookie found");
                return Unauthorized(new ErrorResponse 
                { 
                    Message = "Authentication required",
                    ErrorCode = "AUTH_COOKIE_MISSING",
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            // Validate the existing token
            if (!_jwtService.ValidateToken(cookieToken))
            {
                _securityLogger.LogSecurityEvent("GrpcTokenRequest", "unknown", "Invalid authentication cookie");
                return Unauthorized(new ErrorResponse 
                { 
                    Message = "Invalid authentication",
                    ErrorCode = "AUTH_COOKIE_INVALID",
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            // Extract user from token
            var user = _jwtService.GetUserFromToken(cookieToken);
            if (user == null)
            {
                _securityLogger.LogSecurityEvent("GrpcTokenRequest", "unknown", "Failed to extract user from token");
                return Unauthorized(new ErrorResponse 
                { 
                    Message = "Invalid user context",
                    ErrorCode = "USER_EXTRACTION_FAILED",
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            // Generate new token specifically for gRPC use
            // This token will be passed as Authorization header for gRPC calls
            var grpcToken = _jwtService.GenerateToken(user);
            var expiresAt = DateTime.UtcNow.AddMinutes(60);

            _securityLogger.LogSecurityEvent("GrpcTokenIssued", user.Email, "gRPC token issued for authenticated user");

            return Ok(new GrpcTokenResponse
            {
                Token = grpcToken,
                ExpiresAt = expiresAt,
                TokenType = "Bearer"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating gRPC token");
            _securityLogger.LogSecurityEvent("GrpcTokenError", "unknown", "Internal error during token generation");
            return StatusCode(500, new ErrorResponse 
            { 
                Message = "Internal server error",
                ErrorCode = "GRPC_TOKEN_GENERATION_ERROR",
                TraceId = HttpContext.TraceIdentifier
            });
        }
    }

    /// <summary>
    /// Get client identifier for brute force protection (combines IP and email for better accuracy)
    /// </summary>
    private string GetClientIdentifier(string email)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return $"{clientIp}_{email}";
    }
}