# ServiceBridge Backend API

A modern ASP.NET Core 8 backend implementing Clean Architecture with multi-protocol support (REST, gRPC, SignalR) for enterprise inventory management. This backend serves both the Dashboard and Scanner frontend applications with unified authentication and real-time capabilities.

## Architecture Overview

### Clean Architecture (4-Layer Separation)

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                               │
│  Controllers • SignalR Hubs • gRPC Services • Middleware   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                Application Layer                            │
│     CQRS • MediatR • Commands/Queries • DTOs • Validation  │
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                Infrastructure Layer                         │
│  Entity Framework • Repositories • JWT • SignalR Services  │
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                   Domain Layer                              │
│        Entities • Interfaces • Business Rules              │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Protocol Communication

- **REST API** (`/api/v1/*`) - Standard web API for frontend applications
- **gRPC Services** - High-performance RPC for bulk operations and calculations  
- **SignalR Hub** (`/inventoryhub`) - Real-time WebSocket communication
- **Health Checks** (`/health`) - Application monitoring

## Prerequisites

- **.NET 8 SDK** - Download from [dotnet.microsoft.com](https://dotnet.microsoft.com/download)
- **SQLite** - Included with .NET (no separate installation needed)
- **Visual Studio 2022** or **VS Code** (recommended IDEs)
- **Git** - For version control

### Verify Prerequisites

```bash
# Check .NET version
dotnet --version
# Should show 8.0.x or higher

# Check SDK installation
dotnet --list-sdks
# Should include 8.0.x SDK
```

## Quick Start

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd ServiceBridge/backend
```

### 2. Restore Dependencies
```bash
dotnet restore
```

### 3. Build the Solution
```bash
dotnet build
```

### 4. Run Database Migrations (Automatic)
The application automatically creates and seeds the SQLite database on first run.

### 5. Start the API Server
```bash
dotnet run --project src/ServiceBridge.Api
```

### 6. Verify Installation
- **API Server**: http://localhost:5196
- **Swagger UI**: http://localhost:5196/swagger
- **Health Check**: http://localhost:5196/health

## Configuration

### Environment Settings

The backend uses `appsettings.json` and `appsettings.Development.json` for configuration:

#### Default Configuration (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=servicebridge.db"
  },
  "Jwt": {
    "SecretKey": "ServiceBridge-Super-Secret-Key-For-Development-Only-Please-Change-In-Production",
    "Issuer": "ServiceBridge",
    "Audience": "ServiceBridge-API",
    "ExpirationMinutes": "60"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

#### Development Overrides (`appsettings.Development.json`)
- Enhanced logging for development
- CORS enabled for frontend applications
- Detailed Entity Framework logging

### Port Configuration

The API server runs on multiple ports:
- **HTTP**: `http://localhost:5196` (Primary)
- **HTTPS**: `https://localhost:7185` (SSL)
- **gRPC**: Same ports (HTTP/2 multiplexing)
- **SignalR**: Same ports (WebSocket upgrade)

### CORS Configuration

Automatically configured for frontend applications:
- **Dashboard App**: `http://localhost:5174`
- **Scanner App**: `http://localhost:5173`
- **Development**: `http://localhost:3000-9999` (range)

## Database

### SQLite Database

The application uses SQLite for simplicity and portability:
- **Database File**: `servicebridge.db` (auto-created)
- **Migrations**: Automatic on startup
- **Seeding**: Sample data loaded automatically

### Database Schema

#### Core Entities

**Products**
```sql
Products (
  Id GUID PRIMARY KEY,
  Code NVARCHAR(50) UNIQUE,
  Name NVARCHAR(200),
  Description NVARCHAR(500),
  Category NVARCHAR(100),
  CurrentStock INTEGER,
  MinimumStock INTEGER,
  UnitPrice DECIMAL(18,2),
  IsActive BOOLEAN,
  CreatedAt DATETIME,
  UpdatedAt DATETIME
)
```

**ScanTransactions**
```sql
ScanTransactions (
  Id GUID PRIMARY KEY,
  ProductId GUID FOREIGN KEY,
  UserId NVARCHAR(450),
  TransactionType INTEGER, -- Add/Remove/Count
  Quantity INTEGER,
  PreviousStock INTEGER,
  NewStock INTEGER,
  Timestamp DATETIME,
  Notes NVARCHAR(500)
)
```

**AuditEntry**
```sql
AuditEntry (
  Id GUID PRIMARY KEY,
  UserId NVARCHAR(450),
  EntityName NVARCHAR(100),
  Action NVARCHAR(50),
  Timestamp DATETIME,
  Changes NVARCHAR(MAX) -- JSON
)
```

### Manual Database Operations

```bash
# Reset database (development only)
rm servicebridge.db
dotnet run --project src/ServiceBridge.Api

# View database schema
sqlite3 servicebridge.db ".schema"

# Query products
sqlite3 servicebridge.db "SELECT * FROM Products LIMIT 5;"
```

## Authentication & Authorization

### JWT Token Authentication

#### User Roles & Permissions

| Role | Capabilities | API Access |
|------|-------------|------------|
| **Admin** | Full system access, user management | All endpoints |
| **Manager** | Product management, reports, analytics | Most endpoints except user management |
| **Operator** | Inventory operations, scanning | Product read/update, scanning |
| **Viewer** | Read-only access to inventory and reports | Read-only endpoints |

#### Test Accounts (Development Only)

```bash
# Admin Account (Full Access)
Email: admin@servicebridge.com
Password: admin123

# Manager Account (Business Operations)
Email: manager@servicebridge.com  
Password: manager123

# Operator Account (Inventory Operations)
Email: operator@servicebridge.com
Password: operator123

# Scanner Account (Mobile Scanning)
Email: scanner1@servicebridge.com
Password: scanner123

# Additional Scanner Account
Email: scanner2@servicebridge.com
Password: scanner123
```

### Authentication Flow

1. **Login Request**: `POST /api/v1/auth/login`
2. **JWT Token Issued**: Response contains access token and refresh token
3. **Token Usage**: Include in Authorization header: `Bearer <token>`
4. **Token Refresh**: Use refresh token to get new access token
5. **Role Validation**: Endpoints check user roles automatically

### API Authentication Example

```bash
# Login and get token
curl -X POST http://localhost:5196/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@servicebridge.com","password":"admin123"}'

# Use token in API calls
curl -X GET http://localhost:5196/api/v1/products \
  -H "Authorization: Bearer <your-jwt-token>"
```

## API Endpoints

### REST API Documentation

**Base URL**: `http://localhost:5196/api/v1`

#### Authentication Endpoints
```
POST   /auth/login          # User login
POST   /auth/refresh        # Refresh JWT token
POST   /auth/logout         # User logout
GET    /auth/me             # Get current user info
```

#### Product Management
```
GET    /products            # List products (with filtering/pagination)
GET    /products/{code}     # Get product by code
PUT    /products/{code}     # Update product
POST   /products/bulk       # Bulk update products
POST   /products/{code}/scan # Record inventory scan
```

#### Transaction History
```
GET    /transactions        # Get scan transaction history
GET    /transactions/{id}   # Get specific transaction
```

#### System Endpoints
```
GET    /health              # Health check
GET    /version             # API version info
```

### Interactive API Testing

#### Swagger UI (Recommended)
1. Open **http://localhost:5196/swagger**
2. Click **"Authorize"** button
3. Login to get JWT token:
   ```json
   {
     "email": "admin@servicebridge.com",
     "password": "admin123"
   }
   ```
4. Copy token and authorize with: `Bearer <token>`
5. Test any endpoint interactively

#### Using curl
```bash
# Health check (no auth required)
curl http://localhost:5196/health

# Login
TOKEN=$(curl -s -X POST http://localhost:5196/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@servicebridge.com","password":"admin123"}' \
  | jq -r '.token')

# List products
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5196/api/v1/products

# Get specific product
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5196/api/v1/products/P001
```

## SignalR Real-time Communication

### Hub Configuration

**Hub URL**: `ws://localhost:5196/inventoryhub`

### Hub Methods (Server → Client)

```csharp
// Real-time inventory updates
ProductUpdated(ProductDto product)

// User connection events  
UserConnected(string connectionId, string userId)
UserDisconnected(string connectionId, string userId)

// Connection count updates
ConnectionCountUpdated(int count)

// Scan notifications
ScanProcessed(ScanProcessedNotification notification)
```

### Hub Methods (Client → Server)

```csharp
// Join notification groups
JoinGroup(string groupName)
LeaveGroup(string groupName)

// Get current connection count
GetConnectionCount() -> int

// Notify scan completion
NotifyScan(ScanTransactionDto scan)
```

### SignalR Testing

#### JavaScript Client Test
```javascript
// Browser console test
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5196/inventoryhub', {
    accessTokenFactory: () => 'your-jwt-token'
  })
  .withAutomaticReconnect()
  .build();

// Connect and test
connection.start().then(() => {
  console.log('SignalR Connected');
  
  // Listen for events
  connection.on('ProductUpdated', (product) => {
    console.log('Product updated:', product);
  });
  
  // Join group
  connection.invoke('JoinGroup', 'inventory-updates');
}).catch(err => console.error(err));
```

#### WebSocket Testing Tool
```bash
# Install wscat globally
npm install -g wscat

# Test connection (requires authentication)
wscat -c ws://localhost:5196/inventoryhub
```

## gRPC Services

### Available Services

#### InventoryService
```protobuf
service InventoryService {
  rpc ProcessScan(ProcessScanRequest) returns (ProcessScanResponse);
  rpc UpdateProduct(UpdateProductRequest) returns (UpdateProductResponse);
  rpc UpdateProducts(BulkUpdateRequest) returns (BulkUpdateResponse);
  rpc ProcessBulkScan(BulkScanRequest) returns (BulkScanResponse);
}
```

#### ProductService  
```protobuf
service ProductService {
  rpc GetProduct(GetProductRequest) returns (ProductResponse);
  rpc GetProducts(GetProductsRequest) returns (ProductsResponse);
  rpc SearchProducts(SearchRequest) returns (ProductsResponse);
}
```

### gRPC Client Testing

#### Using grpcurl
```bash
# Install grpcurl
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# List services
grpcurl -plaintext localhost:5196 list

# Call method
grpcurl -plaintext \
  -d '{"code": "P001"}' \
  localhost:5196 ProductService/GetProduct
```

#### Using BloomRPC or Postman
1. Import proto files from `src/ServiceBridge.Api/Protos/`
2. Connect to `localhost:5196`
3. Include JWT token in metadata: `authorization: Bearer <token>`

## Development

### Project Structure

```
backend/
├── src/
│   ├── ServiceBridge.Api/           # API Layer
│   │   ├── Controllers/             # REST API controllers
│   │   ├── Hubs/                    # SignalR hubs
│   │   ├── Services/                # gRPC service implementations
│   │   ├── Middleware/              # Custom middleware
│   │   ├── Protos/                  # gRPC protocol definitions
│   │   └── Program.cs               # Application startup
│   │
│   ├── ServiceBridge.Application/   # Application Layer
│   │   ├── Commands/                # CQRS commands
│   │   ├── Queries/                 # CQRS queries  
│   │   ├── DTOs/                    # Data transfer objects
│   │   ├── Validators/              # FluentValidation rules
│   │   └── Behaviors/               # MediatR pipeline behaviors
│   │
│   ├── ServiceBridge.Infrastructure/ # Infrastructure Layer
│   │   ├── Data/                    # Entity Framework context
│   │   ├── Repositories/            # Data access repositories
│   │   ├── Services/                # External service implementations
│   │   └── Migrations/              # Database migrations
│   │
│   └── ServiceBridge.Domain/        # Domain Layer
│       ├── Entities/                # Domain entities
│       └── Interfaces/              # Domain interfaces
│
└── tests/                           # Test projects
    ├── ServiceBridge.Api.Tests/
    ├── ServiceBridge.Application.Tests/
    └── ServiceBridge.Domain.Tests/
```

### Development Scripts

```bash
# Clean and rebuild
dotnet clean && dotnet build

# Build without warnings (clean build)
dotnet build --verbosity minimal

# Run with hot reload
dotnet watch --project src/ServiceBridge.Api

# Run tests
dotnet test

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Entity Framework migrations
dotnet ef migrations add <MigrationName> --project src/ServiceBridge.Infrastructure --startup-project src/ServiceBridge.Api
dotnet ef database update --project src/ServiceBridge.Infrastructure --startup-project src/ServiceBridge.Api
```

### Code Quality

The project is configured with **nullable reference types** enabled (C# 8.0+ feature) for better null safety:

- **Null Checks**: All potential null references are properly handled
- **Warning-Free Build**: The solution builds without warnings
- **Safe SignalR**: Real-time messaging includes null validation
- **Test Coverage**: Unit tests use null-forgiving operators where appropriate

If you encounter nullable warnings in new code:
- Add null checks: `if (value != null)`
- Use null-forgiving operator: `value!` (only when certain value is not null)
- Make properties nullable: `string?` instead of `string`

### Adding New Features

#### 1. Add Domain Entity
```csharp
// src/ServiceBridge.Domain/Entities/NewEntity.cs
public class NewEntity : BaseEntity
{
    public string Name { get; set; }
    // ... other properties
}
```

#### 2. Add Repository Interface and Implementation
```csharp
// Domain interface
public interface INewEntityRepository : IRepository<NewEntity>
{
    Task<NewEntity> GetByNameAsync(string name);
}

// Infrastructure implementation  
public class NewEntityRepository : RepositoryBase<NewEntity>, INewEntityRepository
{
    // ... implementation
}
```

#### 3. Add Application Commands/Queries
```csharp
// Command
public record CreateNewEntityCommand(string Name) : IRequest<Guid>;

public class CreateNewEntityCommandHandler : IRequestHandler<CreateNewEntityCommand, Guid>
{
    // ... implementation
}
```

#### 4. Add API Controller
```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class NewEntityController : ControllerBase
{
    // ... endpoints
}
```

#### 5. Register Services
Update `DependencyInjection.cs` in appropriate layer.

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 5196
netstat -ano | findstr :5196  # Windows
lsof -i :5196                 # macOS/Linux

# Kill process using port
taskkill /PID <process-id> /F  # Windows
kill -9 <process-id>          # macOS/Linux
```

#### 2. Database Issues
```bash
# Reset database (development)
rm servicebridge.db
dotnet run --project src/ServiceBridge.Api

# Check database file
ls -la servicebridge.db

# Manually run migrations
dotnet ef database update --project src/ServiceBridge.Infrastructure --startup-project src/ServiceBridge.Api
```

#### 3. JWT Token Issues
```bash
# Check token format
echo "<your-token>" | cut -d'.' -f2 | base64 -d

# Test with curl
curl -H "Authorization: Bearer <token>" http://localhost:5196/api/v1/auth/me
```

#### 4. CORS Issues
- Verify frontend URL is in CORS configuration
- Check browser console for CORS errors
- Ensure preflight requests are handled

#### 5. SignalR Connection Issues
```bash
# Test WebSocket connectivity
wscat -c ws://localhost:5196/inventoryhub

# Check authentication
# Include Authorization header in SignalR connection
```

### Logging and Diagnostics

#### Application Logs
```bash
# Run with verbose logging
dotnet run --project src/ServiceBridge.Api --verbosity detailed

# Check specific log levels
# Edit appsettings.Development.json LogLevel settings
```

#### Entity Framework Logging
```json
{
  "Logging": {
    "LogLevel": {
      "Microsoft.EntityFrameworkCore": "Debug"
    }
  }
}
```

#### Health Checks
```bash
# Basic health
curl http://localhost:5196/health

# Detailed health (if implemented)
curl http://localhost:5196/health/ready
curl http://localhost:5196/health/live
```

## Production Deployment

### Configuration Changes

#### 1. Update JWT Secret
```json
{
  "Jwt": {
    "SecretKey": "your-strong-production-secret-key-256-bits-minimum"
  }
}
```

#### 2. Database Connection
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=production-server;Database=ServiceBridge;Trusted_Connection=true;"
  }
}
```

#### 3. CORS Settings
```json
{
  "AllowedOrigins": [
    "https://dashboard.servicebridge.com",
    "https://scanner.servicebridge.com"
  ]
}
```

### Build for Production

```bash
# Publish release build
dotnet publish src/ServiceBridge.Api -c Release -o ./publish

# Run published version
cd publish
dotnet ServiceBridge.Api.dll
```

### Docker Deployment

```dockerfile
# Use included Dockerfile
docker build -t servicebridge-api .
docker run -p 5196:80 servicebridge-api
```

### Environment Variables

```bash
# Set production environment
export ASPNETCORE_ENVIRONMENT=Production

# Override configuration
export ConnectionStrings__DefaultConnection="production-connection-string"
export Jwt__SecretKey="production-secret-key"
```

## Frontend Integration

### Dashboard App Connection

The backend serves the Dashboard App frontend with:
- **REST API**: Complete CRUD operations and analytics
- **SignalR**: Real-time dashboard updates
- **gRPC**: High-performance bulk operations
- **Authentication**: JWT with role-based access

### Scanner App Connection  

The backend serves the Scanner App with:
- **REST API**: Product lookup and scan recording
- **SignalR**: Real-time scan notifications
- **Authentication**: JWT with scanner role permissions

### Cross-Origin Setup

Automatically configured CORS for:
- Dashboard: `http://localhost:5174`
- Scanner: `http://localhost:5173`
- Development range: `http://localhost:3000-9999`

## API Integration Examples

### Frontend Authentication
```javascript
// Login and store token
const response = await fetch('http://localhost:5196/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@servicebridge.com',
    password: 'admin123'
  })
});

const { token } = await response.json();
localStorage.setItem('authToken', token);

// Use token in subsequent requests
const apiCall = await fetch('http://localhost:5196/api/v1/products', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### SignalR Integration
```javascript
// Connect to SignalR hub
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5196/inventoryhub', {
    accessTokenFactory: () => localStorage.getItem('authToken')
  })
  .withAutomaticReconnect()
  .build();

// Handle real-time events
connection.on('ProductUpdated', (product) => {
  // Update UI with new product data
  updateProductInUI(product);
});

await connection.start();
```

## License

This project is part of the ServiceBridge enterprise technology demonstration platform.

---

**Need Help?**
- Check [troubleshooting section](#troubleshooting) above
- Review logs in console output
- Test API endpoints with Swagger UI at http://localhost:5196/swagger
- Verify frontend applications can connect to backend services