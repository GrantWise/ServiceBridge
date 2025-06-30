using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceBridge.Application.Services;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Api.Services;

namespace ServiceBridge.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
[Authorize] // Require authentication for all endpoints
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IConnectionTrackingService _connectionTracker;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserService userService,
        IConnectionTrackingService connectionTracker,
        ILogger<UsersController> logger)
    {
        _userService = userService;
        _connectionTracker = connectionTracker;
        _logger = logger;
    }

    /// <summary>
    /// Get user statistics for dashboard
    /// </summary>
    /// <returns>User statistics including active users, total users, etc.</returns>
    /// <response code="200">User statistics retrieved successfully</response>
    /// <response code="401">Authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(UserStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserStatsDto>> GetUserStats()
    {
        try
        {
            _logger.LogDebug("Getting user statistics");

            // Get active connections (proxy for active users)
            var activeConnections = await _connectionTracker.GetConnectionCountAsync();
            
            // Get all users to calculate totals
            var allUsers = await _userService.GetAllUsersAsync();
            var usersList = allUsers?.ToList() ?? new List<UserDto>();
            var totalUsers = usersList.Count;
            
            // Calculate recent signups (last 7 days)
            var lastWeek = DateTime.UtcNow.AddDays(-7);
            var recentSignups = usersList.Count(u => u.CreatedAt >= lastWeek);
            
            // Calculate active/inactive users (mock data for demo)
            var activeUsers = Math.Max(1, totalUsers - 1); // All but one are active
            var inactiveUsers = totalUsers - activeUsers;
            
            // Calculate by role
            var byRole = new Dictionary<string, int>
            {
                ["Admin"] = usersList.Count(u => u.Role == "Admin"),
                ["Manager"] = usersList.Count(u => u.Role == "Manager"),
                ["Scanner"] = usersList.Count(u => u.Role == "Scanner"),
                ["Operator"] = usersList.Count(u => u.Role == "Operator"),
                ["Viewer"] = usersList.Count(u => u.Role == "Viewer")
            };
            
            // Calculate by department (mock data based on user service)
            var byDepartment = new Dictionary<string, int>
            {
                ["IT"] = 2,
                ["Operations"] = 2,
                ["Support"] = 1,
                ["Management"] = 1
            };
            
            var stats = new UserStatsDto
            {
                Total = totalUsers,
                Active = activeUsers,
                Inactive = inactiveUsers,
                ByRole = byRole,
                ByDepartment = byDepartment,
                ActiveToday = activeConnections, // Use connections as proxy for active users today
                RecentSignups = recentSignups,
                LastUpdated = DateTime.UtcNow
            };

            _logger.LogDebug("User statistics calculated: {Total} total, {Active} active, {Recent} recent signups", 
                stats.Total, stats.ActiveToday, stats.RecentSignups);

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user statistics");
            return StatusCode(500, new { message = "An error occurred while retrieving user statistics" });
        }
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    /// <returns>Current user profile information</returns>
    /// <response code="200">User profile retrieved successfully</response>
    /// <response code="401">Authentication required</response>
    /// <response code="404">User not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserDto>> GetProfile()
    {
        try
        {
            // Get user ID from JWT claims
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                _logger.LogWarning("GetProfile called but no user ID claim found in JWT");
                return Unauthorized(new { message = "Authentication required" });
            }

            var userId = userIdClaim.Value;
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("User not found for ID: {UserId}", userId);
                return NotFound(new { message = "User not found" });
            }

            _logger.LogDebug("Successfully retrieved user profile: {Email}", user.Email);
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile");
            return StatusCode(500, new { message = "An error occurred while retrieving user profile" });
        }
    }
}