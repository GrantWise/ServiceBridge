# ServiceBridge

> **Technology Demonstrator** - This is a proof-of-concept application showcasing the modernization of legacy WCF services using ASP.NET Core with multi-protocol support (REST, gRPC, SignalR). It includes test credentials and sample data for evaluation purposes.

## Architecture

Clean Architecture implementation with strict 4-layer separation:
- **Domain**: Business entities and rules (Product, ScanTransaction, AuditEntry)
- **Application**: CQRS with MediatR, FluentValidation, DTOs
- **Infrastructure**: Entity Framework Core (SQLite), Serilog, JWT services
- **API**: Multi-protocol endpoints (REST, gRPC, SignalR)

## Complete System Startup

### 1. Start Backend API (Required First)
```bash
cd backend
dotnet run --project src/ServiceBridge.Api
# API Server: http://localhost:5196
# Swagger UI: http://localhost:5196/swagger
```

### 2. Start Frontend Applications (Optional)
```bash
# Dashboard App (Enterprise Management)
cd frontend/dashboard-app
npm install && npm run dev
# Dashboard: http://localhost:5174

# Scanner App (Mobile Operations) 
cd frontend/scanner-app
npm install && npm run dev
# Scanner: http://localhost:5173
```

### 3. Access Points
- **Backend API**: http://localhost:5196
- **Swagger Documentation**: http://localhost:5196/swagger
- **Dashboard App**: http://localhost:5174 (Enterprise management)
- **Scanner App**: http://localhost:5173 (Mobile scanning)
- **SignalR Hub**: ws://localhost:5196/inventoryhub

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

### Monitoring & Health Endpoints
- **Simple Health Check**: http://localhost:5196/health (for load balancers)
- **Detailed Health Check**: http://localhost:5196/api/v1/monitoring/health (comprehensive health status)
- **System Metrics**: http://localhost:5196/api/v1/monitoring/metrics (CPU, memory, performance)
- **Protocol Status**: http://localhost:5196/api/v1/monitoring/protocols (REST, gRPC, SignalR status)

### Other Endpoints
- **SignalR Hub**: ws://localhost:5196/inventoryhub
- **gRPC Services**: localhost:5196 (requires gRPC client)

## Multi-Protocol Support

The API simultaneously hosts:
- **REST API**: `/api/v1/*` endpoints for web frontend
- **gRPC Services**: High-performance backend communication
- **SignalR Hub**: `/inventoryhub` for real-time updates
- **Monitoring APIs**: `/api/v1/monitoring/*` for system health and metrics
- **Health Checks**: `/health` for load balancer monitoring

## Features

- ✅ **REST API** for web clients with OpenAPI/Swagger documentation
- ✅ **gRPC Services** for high-performance backend communication  
- ✅ **SignalR Hub** for real-time inventory updates
- ✅ **JWT Authentication** unified across all protocols
- ✅ **Role-based Authorization** (Admin/Manager/Scanner)
- ✅ **System Monitoring** with health checks and performance metrics
- ✅ **Security Hardening** with rate limiting and brute force protection
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

## Detailed Documentation

### Component-Specific Setup Guides

For detailed setup, configuration, and development instructions:

#### 📚 **Backend API**
- **Location**: `backend/README.md`
- **Contents**: Complete .NET setup, database configuration, API endpoints, gRPC services, SignalR setup, authentication, troubleshooting
- **Quick Link**: [Backend README](./backend/README.md)

#### 🖥️ **Dashboard Application**
- **Location**: `frontend/dashboard-app/README.md`
- **Contents**: React setup, multi-protocol integration, advanced features, environment configuration, backend communication
- **Quick Link**: [Dashboard README](./frontend/dashboard-app/README.md)

#### 📱 **Scanner Application**  
- **Location**: `frontend/scanner-app/README.md`
- **Contents**: Mobile app setup, barcode scanning, real-time updates, offline support, backend communication
- **Quick Link**: [Scanner README](./frontend/scanner-app/README.md)

#### 🚀 **Frontend Overview**
- **Location**: `frontend/README.md`
- **Contents**: Multi-app startup guide, port assignments, shared authentication, development workflow
- **Quick Link**: [Frontend README](./frontend/README.md)

### Architecture Documentation

Additional technical documentation:
- **Clean Architecture**: See `backend/README.md` for 4-layer implementation details
- **Multi-Protocol Communication**: Detailed in each application's README
- **Database Schema**: Complete entity definitions in `backend/README.md`
- **Authentication Flow**: JWT implementation across all components
- **Real-time Features**: SignalR integration patterns and examples
