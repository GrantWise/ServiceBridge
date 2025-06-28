# ServiceBridge

> **Technology Demonstrator** - This is a proof-of-concept application showcasing the modernization of legacy WCF services using ASP.NET Core with multi-protocol support (REST, gRPC, SignalR). It includes test credentials and sample data for evaluation purposes.

## Architecture

Clean Architecture implementation with strict 4-layer separation:
- **Domain**: Business entities and rules (Product, ScanTransaction, AuditEntry)
- **Application**: CQRS with MediatR, FluentValidation, DTOs
- **Infrastructure**: Entity Framework Core (SQLite), Serilog, JWT services
- **API**: Multi-protocol endpoints (REST, gRPC, SignalR)

## Quick Start

```bash
# Build the solution
dotnet build

# Run the API server
dotnet run --project src/ServiceBridge.Api

# Server will start at: http://localhost:5196
```

## Browser Access & Authentication

### Swagger UI (Recommended)
**URL**: http://localhost:5196/swagger
- Interactive API documentation with authentication
- Test all REST endpoints directly from browser

### Test Credentials (Development Only)
| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@servicebridge.com` | `admin123` | Full access to all operations |
| **Manager** | `manager@servicebridge.com` | `manager123` | Product updates, bulk operations |
| **Scanner** | `scanner1@servicebridge.com` | `scanner123` | Inventory scanning only |
| **Scanner** | `scanner2@servicebridge.com` | `scanner123` | Inventory scanning only |

### How to Authenticate via Swagger
1. Open http://localhost:5196/swagger
2. Click on `POST /api/v1/auth/login`
3. Click "Try it out" and enter credentials:
   ```json
   {
     "email": "admin@servicebridge.com",
     "password": "admin123"
   }
   ```
4. Execute and copy the JWT token from response
5. Click "Authorize" button at top of page
6. Enter: `Bearer <your-jwt-token>`
7. Now you can test all authenticated endpoints

### Other Endpoints
- **Health Check**: http://localhost:5196/health
- **SignalR Hub**: ws://localhost:5196/inventoryhub
- **gRPC Services**: localhost:5196 (requires gRPC client)

## Multi-Protocol Support

The API simultaneously hosts:
- **REST API**: `/api/v1/*` endpoints for web frontend
- **gRPC Services**: High-performance backend communication
- **SignalR Hub**: `/inventoryhub` for real-time updates
- **Health Checks**: `/health` for monitoring

## Features

- ✅ **REST API** for web clients with OpenAPI/Swagger documentation
- ✅ **gRPC Services** for high-performance backend communication  
- ✅ **SignalR Hub** for real-time inventory updates
- ✅ **JWT Authentication** unified across all protocols
- ✅ **Role-based Authorization** (Admin/Manager/Scanner)
- ✅ **Clean Architecture** with CQRS and MediatR
- ✅ **Entity Framework Core** with SQLite database
- ✅ **Comprehensive Audit Trail** for compliance
- ✅ **React Frontend Applications** (Scanner & Dashboard)
- ✅ **Docker Containerization** support

## Business Domain

**Inventory Management System** with:
- **Product Management**: Stock levels, consumption tracking, reorder points
- **Inventory Scanning**: Real-time stock count updates with transaction history
- **Business Intelligence**: Days cover remaining, stock status calculations
- **Real-time Monitoring**: Live inventory updates via SignalR
- **Multi-user Support**: Role-based access control
- **Comprehensive Audit Trail**: Complete change tracking for compliance

## Sample Data

The application automatically seeds the database with:
- **Sample Products**: Various inventory items with realistic stock levels
- **Transaction History**: Example scanning transactions
- **Calculated Metrics**: Days cover remaining, reorder points, stock status
