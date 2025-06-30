using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ServiceBridge.Infrastructure.Data;
using ServiceBridge.Domain.Interfaces;
using ServiceBridge.Infrastructure.Repositories;
using ServiceBridge.Application;
using ServiceBridge.Infrastructure;
using ServiceBridge.Api.Middleware;
using ServiceBridge.Api.Hubs;
using ServiceBridge.Api.Services;
using ServiceBridge.Application.Services;
using ServiceBridge.Infrastructure.Services;
using System.Text;
using AspNetCoreRateLimit;

var builder = WebApplication.CreateBuilder(args);

// Add Entity Framework
builder.Services.AddDbContext<ServiceBridgeDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Repository Pattern
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IScanTransactionRepository, ScanTransactionRepository>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(RepositoryBase<>));

// Register Application Layer Services
builder.Services.AddApplication();

// Register Infrastructure Layer Services
builder.Services.AddInfrastructure();

// Register API Services
builder.Services.AddScoped<IConnectionTrackingService, ConnectionTrackingService>();
builder.Services.AddHostedService<LiveMetricsService>();

// Add Rate Limiting services
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.Configure<IpRateLimitPolicies>(builder.Configuration.GetSection("IpRateLimitPolicies"));
builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

// Add services to the container.
builder.Services.AddControllers();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? "ServiceBridge-Super-Secret-Key-For-Development-Only-Please-Change-In-Production";
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Set to true in production
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    
    // Configure JWT authentication for all protocols (HTTP, SignalR, gRPC)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var path = context.HttpContext.Request.Path;
            
            // Priority 1: Authorization header (for API calls and gRPC)
            // This is handled automatically by the JWT bearer middleware
            
            // Priority 2: Query string token (for SignalR WebSocket connections)
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/inventoryhub"))
            {
                context.Token = accessToken;
                return Task.CompletedTask;
            }
            
            // Priority 3: httpOnly cookie (for web applications)
            // Only use cookie if no Authorization header is present
            var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) && 
                context.Request.Cookies.TryGetValue("access_token", out var cookieToken) && 
                !string.IsNullOrEmpty(cookieToken))
            {
                context.Token = cookieToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Scanner", policy => policy.RequireRole("Scanner", "Manager", "Admin"));
    options.AddPolicy("Manager", policy => policy.RequireRole("Manager", "Admin"));
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
});

// Configure CORS
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("DevelopmentCors", policy =>
        {
            policy.SetIsOriginAllowed(origin => 
                {
                    if (string.IsNullOrEmpty(origin)) return false;
                    
                    try
                    {
                        var uri = new Uri(origin);
                        // Allow localhost on development port range (5173-5180)
                        return uri.Host == "localhost" && 
                               uri.Port >= 5173 && uri.Port <= 5180;
                    }
                    catch
                    {
                        return false;
                    }
                })
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials(); // Required for SignalR and httpOnly cookies
        });
    }
    else
    {
        // Production CORS - restrictive and explicit
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
            ?? Array.Empty<string>();
            
        options.AddPolicy("ProductionCors", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
    }
});

// Add SignalR
builder.Services.AddSignalR();

// Add gRPC
builder.Services.AddGrpc();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ServiceBridge API",
        Version = "v1",
        Description = "Multi-protocol inventory management system API with JWT authentication"
    });
    
    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Apply migrations and seed database
await InitializeDatabaseAsync(app);

async Task InitializeDatabaseAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ServiceBridgeDbContext>();
    
    try
    {
        // Apply any pending migrations
        await context.Database.MigrateAsync();
        
        // Seed the database with sample data
        await DatabaseSeeder.SeedAsync(context);
        
        app.Logger.LogInformation("Database initialized successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "An error occurred while initializing the database");
        throw;
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS (environment-aware)
app.UseCors(app.Environment.IsDevelopment() ? "DevelopmentCors" : "ProductionCors");

// Add global exception handling
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

// Add rate limiting (must be before authentication)
app.UseIpRateLimiting();

// Add authentication and authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Add simple health check endpoint for load balancers
app.MapGet("/health", () => Results.Ok(new { 
    status = "Healthy", 
    timestamp = DateTime.UtcNow 
})).AllowAnonymous();

// Map SignalR hub
app.MapHub<InventoryHub>("/inventoryhub");

// Map gRPC services
app.MapGrpcService<ProductGrpcService>();
app.MapGrpcService<InventoryGrpcService>();

app.Run();
