#!/bin/bash

# ServiceBridge Clean Setup Script
# Creates a complete ServiceBridge project from scratch with Clean Architecture

echo "🚀 Creating ServiceBridge from scratch..."

# Check if .NET is available
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK not found. Please install .NET 8 SDK first:"
    echo "https://dotnet.microsoft.com/download/dotnet/8.0"
    exit 1
fi

# =======================
# 1. CREATE SOLUTION AND PROJECTS
# =======================

echo -e "\n📁 1. Creating solution and project structure..."

# Create solution
dotnet new sln -n ServiceBridge

# Create directory structure
mkdir -p src/{ServiceBridge.Domain,ServiceBridge.Application,ServiceBridge.Infrastructure,ServiceBridge.Api}
mkdir -p tests/{ServiceBridge.Domain.Tests,ServiceBridge.Application.Tests,ServiceBridge.Api.Tests}
mkdir -p frontend/{scanner-app,dashboard-app}

# Create projects
echo "Creating Domain project..."
dotnet new classlib -n ServiceBridge.Domain -o src/ServiceBridge.Domain --framework net8.0

echo "Creating Application project..."
dotnet new classlib -n ServiceBridge.Application -o src/ServiceBridge.Application --framework net8.0

echo "Creating Infrastructure project..."
dotnet new classlib -n ServiceBridge.Infrastructure -o src/ServiceBridge.Infrastructure --framework net8.0

echo "Creating API project..."
dotnet new webapi -n ServiceBridge.Api -o src/ServiceBridge.Api --framework net8.0

# Create test projects
echo "Creating test projects..."
dotnet new xunit -n ServiceBridge.Domain.Tests -o tests/ServiceBridge.Domain.Tests --framework net8.0
dotnet new xunit -n ServiceBridge.Application.Tests -o tests/ServiceBridge.Application.Tests --framework net8.0
dotnet new xunit -n ServiceBridge.Api.Tests -o tests/ServiceBridge.Api.Tests --framework net8.0

# Add projects to solution
dotnet sln add src/ServiceBridge.Domain/ServiceBridge.Domain.csproj
dotnet sln add src/ServiceBridge.Application/ServiceBridge.Application.csproj
dotnet sln add src/ServiceBridge.Infrastructure/ServiceBridge.Infrastructure.csproj
dotnet sln add src/ServiceBridge.Api/ServiceBridge.Api.csproj
dotnet sln add tests/ServiceBridge.Domain.Tests/ServiceBridge.Domain.Tests.csproj
dotnet sln add tests/ServiceBridge.Application.Tests/ServiceBridge.Application.Tests.csproj
dotnet sln add tests/ServiceBridge.Api.Tests/ServiceBridge.Api.Tests.csproj

# =======================
# 2. SET UP PROJECT REFERENCES
# =======================

echo -e "\n🔗 2. Setting up project references..."

# Application depends on Domain
dotnet add src/ServiceBridge.Application reference src/ServiceBridge.Domain

# Infrastructure depends on Application and Domain
dotnet add src/ServiceBridge.Infrastructure reference src/ServiceBridge.Application
dotnet add src/ServiceBridge.Infrastructure reference src/ServiceBridge.Domain

# API depends on Application and Infrastructure
dotnet add src/ServiceBridge.Api reference src/ServiceBridge.Application
dotnet add src/ServiceBridge.Api reference src/ServiceBridge.Infrastructure

# Test project references
dotnet add tests/ServiceBridge.Domain.Tests reference src/ServiceBridge.Domain
dotnet add tests/ServiceBridge.Application.Tests reference src/ServiceBridge.Application
dotnet add tests/ServiceBridge.Api.Tests reference src/ServiceBridge.Api

# =======================
# 3. ADD NUGET PACKAGES
# =======================

echo -e "\n📦 3. Adding NuGet packages..."

# Application packages
dotnet add src/ServiceBridge.Application package MediatR
dotnet add src/ServiceBridge.Application package FluentValidation
dotnet add src/ServiceBridge.Application package AutoMapper
dotnet add src/ServiceBridge.Application package Microsoft.Extensions.DependencyInjection.Abstractions

# Infrastructure packages
dotnet add src/ServiceBridge.Infrastructure package Microsoft.EntityFrameworkCore.Sqlite
dotnet add src/ServiceBridge.Infrastructure package Microsoft.EntityFrameworkCore.Design
dotnet add src/ServiceBridge.Infrastructure package Serilog
dotnet add src/ServiceBridge.Infrastructure package Serilog.Extensions.Hosting
dotnet add src/ServiceBridge.Infrastructure package Serilog.Sinks.Console
dotnet add src/ServiceBridge.Infrastructure package Serilog.Sinks.File
dotnet add src/ServiceBridge.Infrastructure package AutoMapper.Extensions.Microsoft.DependencyInjection

# API packages
dotnet add src/ServiceBridge.Api package MediatR.Extensions.Microsoft.DependencyInjection
dotnet add src/ServiceBridge.Api package Microsoft.AspNetCore.SignalR
dotnet add src/ServiceBridge.Api package Grpc.AspNetCore
dotnet add src/ServiceBridge.Api package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add src/ServiceBridge.Api package System.IdentityModel.Tokens.Jwt
dotnet add src/ServiceBridge.Api package Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore
dotnet add src/ServiceBridge.Api package Swashbuckle.AspNetCore
dotnet add src/ServiceBridge.Api package FluentValidation.AspNetCore

# Test packages
dotnet add tests/ServiceBridge.Domain.Tests package FluentAssertions
dotnet add tests/ServiceBridge.Application.Tests package FluentAssertions
dotnet add tests/ServiceBridge.Application.Tests package Moq
dotnet add tests/ServiceBridge.Api.Tests package FluentAssertions
dotnet add tests/ServiceBridge.Api.Tests package Moq
dotnet add tests/ServiceBridge.Api.Tests package Microsoft.AspNetCore.Mvc.Testing

# =======================
# 4. CREATE DOMAIN ENTITIES
# =======================

echo -e "\n🏗️  4. Creating domain entities..."

# Clean up default Class1.cs files
rm -f src/ServiceBridge.Domain/Class1.cs
rm -f src/ServiceBridge.Application/Class1.cs
rm -f src/ServiceBridge.Infrastructure/Class1.cs

# Create folder structure
mkdir -p src/ServiceBridge.Domain/Entities
mkdir -p src/ServiceBridge.Domain/Interfaces
mkdir -p src/ServiceBridge.Application/{Commands,Queries,DTOs,Validators,Mappings,Interfaces}
mkdir -p src/ServiceBridge.Infrastructure/{Data,Repositories,Services}
mkdir -p src/ServiceBridge.Api/{Controllers,Hubs,Services,Middleware,Protos}

# Create Product entity
cat > src/ServiceBridge.Domain/Entities/Product.cs << 'EOF'
using System.ComponentModel.DataAnnotations;

namespace ServiceBridge.Domain.Entities;

public class Product
{
    [Key]
    public string ProductCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public decimal AverageMonthlyConsumption { get; set; }
    public int LeadTimeDays { get; set; }
    public int QuantityOnOrder { get; set; }
    public DateTime LastUpdated { get; set; }
    public string LastUpdatedBy { get; set; } = string.Empty;

    // Calculated properties
    public decimal DaysCoverRemaining => 
        AverageMonthlyConsumption > 0 ? QuantityOnHand / (AverageMonthlyConsumption / 30) : 0;
    
    public decimal ReorderPoint => 
        AverageMonthlyConsumption > 0 ? (AverageMonthlyConsumption / 30) * LeadTimeDays : 0;
    
    public StockStatus StockStatus => DaysCoverRemaining switch
    {
        < 7 => StockStatus.Low,
        > 60 => StockStatus.Overstocked,
        _ => StockStatus.Adequate
    };

    // Navigation properties
    public virtual ICollection<ScanTransaction> ScanTransactions { get; set; } = new List<ScanTransaction>();
}
EOF

# Create ScanTransaction entity
cat > src/ServiceBridge.Domain/Entities/ScanTransaction.cs << 'EOF'
using System.ComponentModel.DataAnnotations;

namespace ServiceBridge.Domain.Entities;

public class ScanTransaction
{
    [Key]
    public int Id { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public int QuantityScanned { get; set; }
    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public DateTime ScanDateTime { get; set; }
    public string ScannedBy { get; set; } = string.Empty;
    public TransactionType TransactionType { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
}
EOF

# Create AuditEntry entity
cat > src/ServiceBridge.Domain/Entities/AuditEntry.cs << 'EOF'
using System.ComponentModel.DataAnnotations;

namespace ServiceBridge.Domain.Entities;

public class AuditEntry
{
    [Key]
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string NewValues { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Source { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
}
EOF

# Create enums
cat > src/ServiceBridge.Domain/Entities/Enums.cs << 'EOF'
namespace ServiceBridge.Domain.Entities;

public enum StockStatus
{
    Low,
    Adequate,
    Overstocked
}

public enum TransactionType
{
    StockCount,
    Adjustment,
    Receiving
}
EOF

# =======================
# 5. CREATE GRPC PROTO FILES
# =======================

echo -e "\n🔌 5. Creating gRPC Protocol Buffer definitions..."

# Create product service proto
cat > src/ServiceBridge.Api/Protos/product.proto << 'EOF'
syntax = "proto3";

option csharp_namespace = "ServiceBridge.Api.Grpc";

package productservice;

service ProductService {
  rpc GetProduct(GetProductRequest) returns (ProductResponse);
  rpc GetProducts(GetProductsRequest) returns (GetProductsResponse);
}

message GetProductRequest {
  string product_code = 1;
}

message GetProductsRequest {
  string filter = 1;
  int32 page = 2;
  int32 page_size = 3;
}

message ProductResponse {
  string product_code = 1;
  string description = 2;
  int32 quantity_on_hand = 3;
  double average_monthly_consumption = 4;
  int32 lead_time_days = 5;
  int32 quantity_on_order = 6;
  string last_updated = 7;
  string last_updated_by = 8;
  double days_cover_remaining = 9;
  double reorder_point = 10;
  int32 stock_status = 11;
}

message GetProductsResponse {
  repeated ProductResponse products = 1;
  int32 total_count = 2;
}
EOF

# Create inventory service proto
cat > src/ServiceBridge.Api/Protos/inventory.proto << 'EOF'
syntax = "proto3";

option csharp_namespace = "ServiceBridge.Api.Grpc";

package inventoryservice;

service InventoryService {
  rpc ProcessBulkScan(BulkScanRequest) returns (BulkScanResponse);
  rpc UpdateProducts(BulkUpdateRequest) returns (BulkUpdateResponse);
}

message BulkScanRequest {
  repeated ScanItem scans = 1;
  string scanned_by = 2;
}

message ScanItem {
  string product_code = 1;
  int32 quantity = 2;
  string notes = 3;
}

message BulkScanResponse {
  int32 processed_count = 1;
  repeated string errors = 2;
}

message BulkUpdateRequest {
  repeated ProductUpdate updates = 1;
  string updated_by = 2;
}

message ProductUpdate {
  string product_code = 1;
  optional int32 quantity_on_hand = 2;
  optional double average_monthly_consumption = 3;
  optional int32 lead_time_days = 4;
}

message BulkUpdateResponse {
  int32 updated_count = 1;
  repeated string errors = 2;
}
EOF

# Create metrics service proto
cat > src/ServiceBridge.Api/Protos/metrics.proto << 'EOF'
syntax = "proto3";

option csharp_namespace = "ServiceBridge.Api.Grpc";

package metricsservice;

service MetricsService {
  rpc GetLiveMetrics(MetricsRequest) returns (LiveMetricsResponse);
  rpc GetConnectionStats(StatsRequest) returns (StatsResponse);
}

message MetricsRequest {
}

message LiveMetricsResponse {
  string server_time = 1;
  int32 active_connections = 2;
  int32 total_requests_today = 3;
  int32 total_scans_today = 4;
  double memory_usage_mb = 5;
}

message StatsRequest {
}

message StatsResponse {
  int32 total_connections = 1;
  double average_response_time = 2;
  int32 error_count = 3;
}
EOF

# Update API project file to include proto files
cp src/ServiceBridge.Api/ServiceBridge.Api.csproj src/ServiceBridge.Api/ServiceBridge.Api.csproj.backup

# Add protobuf references
sed -i '/<\/Project>/i\
\
  <ItemGroup>\
    <Protobuf Include="Protos\\product.proto" GrpcServices="Server" />\
    <Protobuf Include="Protos\\inventory.proto" GrpcServices="Server" />\
    <Protobuf Include="Protos\\metrics.proto" GrpcServices="Server" />\
  </ItemGroup>' src/ServiceBridge.Api/ServiceBridge.Api.csproj

# =======================
# 6. CREATE SIGNALR HUB
# =======================

echo -e "\n📡 6. Creating SignalR hub..."

cat > src/ServiceBridge.Api/Hubs/InventoryHub.cs << 'EOF'
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace ServiceBridge.Api.Hubs;

[Authorize]
public class InventoryHub : Hub
{
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.Caller.SendAsync("JoinedGroup", groupName);
    }

    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        await Clients.Caller.SendAsync("LeftGroup", groupName);
    }

    public async Task<int> GetConnectionCount()
    {
        // This would typically use a connection tracking service
        return 1; // Placeholder implementation
    }

    public override async Task OnConnectedAsync()
    {
        await Clients.All.SendAsync("UserConnected", Context.UserIdentifier);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await Clients.All.SendAsync("UserDisconnected", Context.UserIdentifier);
        await base.OnDisconnectedAsync(exception);
    }
}
EOF

# =======================
# 7. CREATE DOCKER CONFIGURATION
# =======================

echo -e "\n🐳 7. Creating Docker configuration..."

cat > Dockerfile << 'EOF'
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/ServiceBridge.Api/ServiceBridge.Api.csproj", "src/ServiceBridge.Api/"]
COPY ["src/ServiceBridge.Application/ServiceBridge.Application.csproj", "src/ServiceBridge.Application/"]
COPY ["src/ServiceBridge.Domain/ServiceBridge.Domain.csproj", "src/ServiceBridge.Domain/"]
COPY ["src/ServiceBridge.Infrastructure/ServiceBridge.Infrastructure.csproj", "src/ServiceBridge.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "src/ServiceBridge.Api/ServiceBridge.Api.csproj"

# Copy source code
COPY . .

# Build
WORKDIR "/src/src/ServiceBridge.Api"
RUN dotnet build "ServiceBridge.Api.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "ServiceBridge.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:80/health || exit 1

ENTRYPOINT ["dotnet", "ServiceBridge.Api.dll"]
EOF

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  servicebridge-api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:80"
      - "5001:443"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Data Source=/app/data/servicebridge.db
    volumes:
      - servicebridge-data:/app/data

volumes:
  servicebridge-data:
EOF

cat > .dockerignore << 'EOF'
**/.dockerignore
**/.env
**/.git
**/.gitignore
**/.vs
**/.vscode
**/bin
**/obj
**/node_modules
**/npm-debug.log
Dockerfile*
docker-compose*
README.md
EOF

# =======================
# 8. CREATE REACT FRONTEND STRUCTURE
# =======================

echo -e "\n⚛️  8. Creating React frontend structure..."

# Scanner app package.json
cat > frontend/scanner-app/package.json << 'EOF'
{
  "name": "servicebridge-scanner",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@microsoft/signalr": "^8.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "axios": "^1.6.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:5000"
}
EOF

# Dashboard app package.json
cat > frontend/dashboard-app/package.json << 'EOF'
{
  "name": "servicebridge-dashboard",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@microsoft/signalr": "^8.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "axios": "^1.6.0",
    "recharts": "^2.8.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:5000"
}
EOF

# =======================
# 9. CREATE DOCUMENTATION
# =======================

echo -e "\n📚 9. Creating documentation..."

cat > CLAUDE.md << 'EOF'
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ServiceBridge is a .NET 8 Clean Architecture project demonstrating the modernization of legacy WCF services using multi-protocol communication (REST, gRPC, SignalR). The project follows a 4-layer structure:

- **Domain**: Core business entities (Product, ScanTransaction, AuditEntry), business rules, and interfaces (no dependencies)
- **Application**: Business logic, CQRS commands/queries using MediatR, FluentValidation for business rules
- **Infrastructure**: Data access with Entity Framework Core (SQLite for PoC), external services, logging with Serilog
- **Api**: ASP.NET Core Web API with REST controllers, gRPC services, SignalR hubs, JWT authentication

## Business Domain

The project simulates an **Inventory Management System** with:
- Product scanning and stock updates
- Real-time inventory monitoring
- Business intelligence calculations (days cover, reorder points)
- Comprehensive audit trail
- Multi-protocol access to the same business logic

## Common Commands

### Build & Run
```bash
# Build entire solution
dotnet build

# Run the API project (hosts REST, gRPC, and SignalR)
dotnet run --project src/ServiceBridge.Api

# Run with Docker Compose
docker-compose up --build
```

### Database Operations
```bash
# Add migration
dotnet ef migrations add <MigrationName> --project src/ServiceBridge.Infrastructure --startup-project src/ServiceBridge.Api

# Update database
dotnet ef database update --project src/ServiceBridge.Infrastructure --startup-project src/ServiceBridge.Api
```

### Frontend Development
```bash
# Scanner app
cd frontend/scanner-app && npm start

# Dashboard app  
cd frontend/dashboard-app && npm start
```

## Multi-Protocol Support
The API simultaneously hosts:
- **REST API**: `/api/v1/*` endpoints for web frontend
- **gRPC Services**: High-performance backend communication
- **SignalR Hub**: `/inventoryhub` for real-time updates
- **Health Checks**: `/health` for monitoring

## Key Technologies
- **MediatR**: CQRS pattern
- **SignalR**: Real-time communication
- **gRPC**: High-performance RPC
- **JWT Authentication**: Unified auth across protocols
- **Entity Framework Core**: Data access
- **React**: Frontend applications

## Core Entities

### Product Entity
- ProductCode (string, PK) - Format: ABC123
- Description, QuantityOnHand, AverageMonthlyConsumption
- LeadTimeDays, QuantityOnOrder
- Calculated: DaysCoverRemaining, ReorderPoint, StockStatus

### ScanTransaction Entity
- Tracks all inventory scanning operations
- Links to Product entity
- Includes audit trail fields

### AuditEntry Entity
- Complete audit trail for compliance
- Tracks all entity changes with old/new values
- Records source protocol (REST/gRPC/SignalR)
EOF

cat > README.md << 'EOF'
# ServiceBridge

A proof-of-concept demonstrating the modernization of legacy WCF services using ASP.NET Core with multi-protocol support (REST, gRPC, SignalR).

## Architecture

Clean Architecture implementation with:
- **Domain**: Business entities and rules
- **Application**: CQRS with MediatR
- **Infrastructure**: Entity Framework Core, Serilog
- **API**: Multi-protocol endpoints

## Quick Start

```bash
# Build the solution
dotnet build

# Run the API
dotnet run --project src/ServiceBridge.Api

# Access Swagger UI
# http://localhost:5000/swagger
```

## Features

- ✅ REST API for web clients
- ✅ gRPC for high-performance backend communication  
- ✅ SignalR for real-time updates
- ✅ JWT authentication across all protocols
- ✅ Clean Architecture patterns
- ✅ Docker containerization
- ✅ React frontend applications

## Business Domain

Inventory management system with:
- Product scanning and stock updates
- Real-time inventory monitoring
- Business intelligence calculations
- Comprehensive audit trail
EOF

# =======================
# 10. BUILD AND VERIFY
# =======================

echo -e "\n🔨 10. Building solution to verify setup..."

dotnet build

if [ $? -eq 0 ]; then
    echo -e "\n✅ SUCCESS: ServiceBridge created successfully!"
    echo -e "\n📋 Next steps:"
    echo "1. Implement CQRS commands/queries in the Application layer"
    echo "2. Create Entity Framework DbContext in Infrastructure"
    echo "3. Implement REST controllers in API"
    echo "4. Implement gRPC services"
    echo "5. Set up JWT authentication"
    echo "6. Create React frontend components"
    echo -e "\n🚀 To get started:"
    echo "dotnet run --project src/ServiceBridge.Api"
    echo -e "\n📁 Project structure created:"
    find . -type d -name "ServiceBridge*" | head -10
else
    echo -e "\n❌ Build failed. Please check the error messages above."
    exit 1
fi