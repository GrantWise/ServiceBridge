using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using ServiceBridge.Api.Controllers;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Services;
using Xunit;

namespace ServiceBridge.Api.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IUserService> _mockUserService;
    private readonly Mock<IJwtService> _mockJwtService;
    private readonly Mock<ILogger<AuthController>> _mockLogger;
    private readonly Mock<ISecurityLogger> _mockSecurityLogger;
    private readonly Mock<IBruteForceProtectionService> _mockBruteForceProtection;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockUserService = new Mock<IUserService>();
        _mockJwtService = new Mock<IJwtService>();
        _mockLogger = new Mock<ILogger<AuthController>>();
        _mockSecurityLogger = new Mock<ISecurityLogger>();
        _mockBruteForceProtection = new Mock<IBruteForceProtectionService>();
        _controller = new AuthController(_mockUserService.Object, _mockJwtService.Object, _mockLogger.Object, _mockSecurityLogger.Object, _mockBruteForceProtection.Object);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsSuccessResponse()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "admin@servicebridge.com",
            Password = "admin123"
        };

        var user = new UserDto
        {
            UserId = "1",
            Username = "admin",
            Email = "admin@servicebridge.com",
            Role = "Admin",
            FullName = "System Administrator"
        };

        var token = "mock-jwt-token";

        _mockUserService.Setup(x => x.AuthenticateAsync(request.Email, request.Password))
            .ReturnsAsync(user);
        _mockJwtService.Setup(x => x.GenerateToken(user))
            .Returns(token);

        // Act
        var result = await _controller.Login(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<LoginResponse>(okResult.Value);
        
        Assert.True(response.Success);
        Assert.Equal("Login successful", response.Message);
        Assert.Equal(token, response.Token);
        Assert.Equal(user.UserId, response.User!.UserId);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "invalid@servicebridge.com",
            Password = "wrongpassword"
        };

        _mockUserService.Setup(x => x.AuthenticateAsync(request.Email, request.Password))
            .ReturnsAsync((UserDto?)null);

        // Act
        var result = await _controller.Login(request);

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        var response = Assert.IsType<LoginResponse>(unauthorizedResult.Value);
        
        Assert.False(response.Success);
        Assert.Equal("Invalid email or password", response.Message);
    }

    [Fact]
    public void ValidateToken_ValidToken_ReturnsValid()
    {
        // Arrange
        var token = "valid-jwt-token";
        var user = new UserDto
        {
            UserId = "1",
            Username = "admin",
            Email = "admin@servicebridge.com",
            Role = "Admin"
        };

        _mockJwtService.Setup(x => x.ValidateToken(token))
            .Returns(true);
        _mockJwtService.Setup(x => x.GetUserFromToken(token))
            .Returns(user);

        // Act
        var result = _controller.ValidateToken(token);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = okResult.Value;
        
        Assert.NotNull(response);
    }

    [Fact]
    public void ValidateToken_InvalidToken_ReturnsInvalid()
    {
        // Arrange
        var token = "invalid-jwt-token";

        _mockJwtService.Setup(x => x.ValidateToken(token))
            .Returns(false);
        _mockJwtService.Setup(x => x.GetUserFromToken(token))
            .Returns((UserDto?)null);

        // Act
        var result = _controller.ValidateToken(token);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }
}