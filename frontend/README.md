# ServiceBridge Frontend Applications

This directory contains two React-based frontend applications for the ServiceBridge enterprise inventory management platform:

1. **Dashboard App** (`dashboard-app/`) - Enterprise management dashboard
2. **Scanner App** (`scanner-app/`) - Mobile inventory scanning application

## Quick Start Guide

### Prerequisites

- **Node.js 18+** and npm installed
- **Backend API** running on `http://localhost:5196`
- **SignalR Hub** accessible at `ws://localhost:5196/inventoryhub`

### Starting All Applications

#### 1. Start the Backend (Required First)

Navigate to the backend directory and start the API server:
```bash
cd ../backend
dotnet run
```

Verify backend is running:
```bash
curl http://localhost:5196/api/v1/health
```

#### 2. Start Dashboard App (Port 5174)

```bash
cd dashboard-app
npm install
cp .env.example .env
npm run dev
```

Access at: **http://localhost:5174**

#### 3. Start Scanner App (Port 5173)

```bash
cd scanner-app
npm install
cp .env.example .env  
npm run dev
```

Access at: **http://localhost:5173**

### Demo User Accounts

Both applications use the same authentication system with these test accounts:

#### Administrator (Full Access)
```
Email: admin@servicebridge.com
Password: admin123
```
**Dashboard**: All features including user management
**Scanner**: Full scanning and inventory access

#### Manager (Business Operations)
```
Email: manager@servicebridge.com
Password: manager123
```
**Dashboard**: Analytics, reports, inventory management
**Scanner**: Full scanning capabilities with reporting

#### Operator (Daily Operations)
```
Email: operator@servicebridge.com
Password: operator123
```
**Dashboard**: Inventory operations and basic analytics
**Scanner**: Standard scanning operations

#### Scanner User (Mobile Operations)
```
Email: scanner1@servicebridge.com
Password: scanner123
```
**Dashboard**: Basic inventory view (if access granted)
**Scanner**: Optimized for mobile scanning workflows

## Application Details

### Dashboard App (Enterprise Management)

**Purpose**: Comprehensive enterprise dashboard for managers and administrators
**Port**: 5174
**Target Users**: Managers, Administrators, Analysts

**Key Features**:
- 📊 Advanced analytics with interactive charts
- 📋 Drag-and-drop report builder
- 👥 User management (Admin only)
- 📦 Real-time inventory management
- 🚀 Bulk operations and data import/export
- 🔄 Multi-protocol integration (REST, gRPC, SignalR)

**Technology Stack**:
- React 18 + TypeScript
- TanStack Query + Zustand
- Tailwind CSS + shadcn/ui
- Recharts for data visualization
- SignalR for real-time updates

### Scanner App (Mobile Operations)

**Purpose**: Mobile-optimized inventory scanning application
**Port**: 5173
**Target Users**: Warehouse staff, Field operators, Inventory clerks

**Key Features**:
- 📱 Mobile-first responsive design
- 📦 Barcode scanning with camera integration
- 🔄 Real-time inventory updates
- 📊 Basic analytics and scan history
- 🛡️ Offline support with sync
- ⚡ Fast, lightweight interface

**Technology Stack**:
- React 18 + TypeScript
- TanStack Query for state management
- Tailwind CSS + shadcn/ui
- Camera API for barcode scanning
- SignalR for real-time updates

## Backend Communication

Both applications communicate with the backend using multiple protocols:

### REST API (Primary)
- **Base URL**: `http://localhost:5196/api/v1`
- **Authentication**: JWT Bearer tokens
- **Endpoints**: Products, Users, Analytics, Reports
- **Features**: CRUD operations, filtering, pagination

### SignalR WebSocket (Real-time)
- **Hub URL**: `http://localhost:5196/inventoryhub`
- **Purpose**: Live inventory updates, user notifications
- **Events**: ProductUpdated, UserConnected, SystemAlert
- **Authentication**: JWT token-based

### gRPC Services (High Performance) - Dashboard Only
- **URL**: `http://localhost:5197` (if available)
- **Purpose**: Bulk operations, complex calculations
- **Fallback**: Automatic fallback to REST API
- **Services**: InventoryService, AnalyticsService, ReportingService

## Development Workflow

### Running in Development Mode

1. **Terminal 1 - Backend**:
```bash
cd backend
dotnet run
# Backend available at http://localhost:5196
```

2. **Terminal 2 - Dashboard**:
```bash
cd frontend/dashboard-app
npm run dev
# Dashboard available at http://localhost:5174
```

3. **Terminal 3 - Scanner**:
```bash
cd frontend/scanner-app
npm run dev
# Scanner available at http://localhost:5173
```

### Environment Configuration

Both apps use `.env` files for configuration. Copy the example files and modify as needed:

**Dashboard App** (`.env`):
```env
VITE_API_URL=http://localhost:5196
VITE_SIGNALR_URL=http://localhost:5196/inventoryhub
VITE_GRPC_URL=http://localhost:5197
```

**Scanner App** (`.env`):
```env
VITE_API_URL=http://localhost:5196
VITE_SIGNALR_URL=http://localhost:5196/inventoryhub
```

### Testing Backend Connectivity

Verify all services are accessible:

```bash
# Test REST API
curl http://localhost:5196/api/v1/health

# Test authentication
curl -X POST http://localhost:5196/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@servicebridge.com","password":"admin123"}'

# Test WebSocket (requires wscat: npm install -g wscat)
wscat -c ws://localhost:5196/inventoryhub
```

## Troubleshooting

### Common Issues

1. **"Cannot connect to backend"**
   - Ensure backend is running on port 5196
   - Check firewall settings
   - Verify CORS configuration in backend

2. **"SignalR connection failed"**
   - Check WebSocket support in browser
   - Verify authentication token
   - Test WebSocket connectivity manually

3. **"Port already in use"**
   - Dashboard default: 5174
   - Scanner default: 5173
   - Use `--port` flag to change: `npm run dev -- --port 3000`

4. **"Authentication failed"**
   - Clear browser storage: `localStorage.clear()`
   - Verify credentials match backend accounts
   - Check token expiration settings

### Performance Optimization

- **Bundle Analysis**: `npm run build && npm run preview`
- **Memory Monitoring**: Use React DevTools Profiler
- **Network Inspection**: Browser DevTools Network tab
- **Real-time Performance**: Monitor SignalR message frequency

## Production Deployment

### Build for Production

**Dashboard App**:
```bash
cd dashboard-app
npm run build
# Output: dist/
```

**Scanner App**:
```bash
cd scanner-app
npm run build
# Output: dist/
```

### Production Environment Variables

Update `.env` files for production:

```env
# Production API URLs
VITE_API_URL=https://api.servicebridge.com
VITE_SIGNALR_URL=https://api.servicebridge.com/inventoryhub
VITE_GRPC_URL=https://grpc.servicebridge.com

# Production settings
NODE_ENV=production
VITE_DEV_TOOLS=false
```

### Security Considerations

- Use HTTPS in production
- Configure Content Security Policy
- Enable secure cookie settings
- Set proper CORS origins in backend
- Implement rate limiting

## Architecture Overview

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Scanner App   │    │   Dashboard App  │    │   Backend API   │
│   (Port 5173)   │    │   (Port 5174)    │    │   (Port 5196)   │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          │         REST API     │         REST API      │
          └─────────────────────┬┴───────────────────────┘
                                │
                    ┌───────────┴────────────┐
                    │    SignalR Hub         │
                    │  Real-time Updates     │
                    │  (WebSocket)           │
                    └────────────────────────┘
```

### State Management

- **Server State**: TanStack Query with caching and synchronization
- **Real-time State**: SignalR integration with automatic query invalidation
- **Client State**: Zustand for UI state (modals, filters, preferences)
- **Form State**: React Hook Form with Zod validation

### Error Handling

- **Network Errors**: Automatic retry with exponential backoff
- **Authentication**: Automatic token refresh and redirect to login
- **Real-time**: Auto-reconnection with offline detection
- **User Experience**: Toast notifications and error boundaries

## Contributing

### Development Guidelines

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Implement proper error boundaries
4. Add accessibility attributes (ARIA)
5. Write unit tests for new features
6. Follow ESLint and Prettier rules

### Code Quality

- **Linting**: `npm run lint`
- **Type Checking**: `npm run type-check`
- **Testing**: `npm test`
- **Formatting**: `npm run format`

## License

This project is part of the ServiceBridge enterprise technology demonstration platform.

---

For detailed documentation on each application, see their respective README files:
- [Dashboard App README](./dashboard-app/README.md)
- [Scanner App README](./scanner-app/README.md)