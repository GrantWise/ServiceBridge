# ServiceBridge Dashboard App

A comprehensive React-based enterprise dashboard built with TypeScript, Vite, and modern UI components. This application provides advanced analytics, user management, inventory control, and real-time monitoring capabilities with multi-protocol backend integration.

## Features

- 📊 **Advanced Analytics**: Interactive charts, drilldown analysis, and business intelligence
- 📋 **Report Builder**: Drag-and-drop report creation with multi-format export
- 👥 **User Management**: Complete RBAC system with role-based permissions (Admin only)
- 📦 **Inventory Management**: Real-time inventory grid with bulk operations
- 🔄 **Real-time Updates**: Live data updates via SignalR WebSocket connections
- 🚀 **Bulk Operations**: Advanced batch processing with import/export capabilities
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- ♿ **Accessible**: WCAG 2.1 AA compliant design
- 🛡️ **Enterprise Security**: JWT authentication, CSRF protection, and input sanitization

## Prerequisites

- **Node.js 18+** and npm
- **Backend API** running on http://localhost:5196
- **SignalR Hub** accessible at ws://localhost:5196/inventoryhub
- **gRPC Services** (optional) for high-performance operations

## Installation

1. **Install dependencies:**
```bash
cd frontend/dashboard-app
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
VITE_API_URL=http://localhost:5196
VITE_SIGNALR_URL=http://localhost:5196/inventoryhub
VITE_GRPC_URL=http://localhost:5197
VITE_APP_NAME=ServiceBridge Dashboard
VITE_APP_VERSION=1.0.0
```

3. **Start the development server:**
```bash
npm run dev
```

The dashboard will be available at **http://localhost:5174**

## Demo Credentials

Use these credentials to access different functionality levels:

### Administrator Account (Full Access)
```
Email: admin@servicebridge.com
Password: admin123
```
**Access**: All features including user management, system administration, and security settings.

### Manager Account (Business Features)
```
Email: manager@servicebridge.com
Password: manager123
```
**Access**: Analytics, reports, inventory management, and advanced features.

### Operator Account (Operations)
```
Email: operator@servicebridge.com
Password: operator123
```
**Access**: Inventory operations, basic analytics, and activity monitoring.

### Viewer Account (Read-Only)
```
Email: viewer@servicebridge.com
Password: viewer123
```
**Access**: Dashboard view, basic reports, and activity monitoring (read-only).

## Available Scripts

- `npm run dev` - Start development server (port 5174)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run Vitest unit tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate test coverage report

## Backend Communication Setup

### 1. Backend API Integration

The dashboard communicates with the backend via multiple protocols:

#### REST API Endpoints
```
Base URL: http://localhost:5196/api/v1

Authentication:
- POST /auth/login          # User login
- POST /auth/refresh        # Token refresh
- GET  /auth/me            # Get current user
- POST /auth/logout        # User logout

Products & Inventory:
- GET    /products         # List products (with filtering)
- GET    /products/{code}  # Get product details
- PUT    /products/{code}  # Update product
- POST   /products/bulk    # Bulk update products
- POST   /products/{code}/scan # Record inventory scan

Analytics & Reports:
- GET    /analytics/kpis   # Key performance indicators
- GET    /analytics/trends # Historical trend data
- GET    /reports/templates # Report templates
- POST   /reports/execute  # Execute report
- GET    /reports/download/{id} # Download report

User Management (Admin only):
- GET    /users           # List users
- POST   /users           # Create user
- PUT    /users/{id}      # Update user
- DELETE /users/{id}      # Delete user
- POST   /users/{id}/suspend # Suspend user
- GET    /users/activity  # User activity log

System Administration:
- GET    /system/health   # System health metrics
- GET    /system/performance # Performance statistics
```

#### Request Headers
All API requests include:
```javascript
{
  'Authorization': 'Bearer <jwt-token>',
  'Content-Type': 'application/json',
  'X-CSRF-Token': '<csrf-token>',
  'X-Request-ID': '<unique-request-id>'
}
```

### 2. SignalR Real-time Communication

#### Connection Setup
```javascript
// Automatic connection on login
const signalrUrl = 'http://localhost:5196/inventoryhub';
const connection = new HubConnectionBuilder()
  .withUrl(signalrUrl, {
    accessTokenFactory: () => getAuthToken()
  })
  .withAutomaticReconnect()
  .build();
```

#### Hub Methods & Events
```javascript
// Server -> Client Events
connection.on('ProductUpdated', (product) => {
  // Handle real-time product updates
});

connection.on('UserConnected', (connectionInfo) => {
  // Handle user connection events
});

connection.on('SystemAlert', (alert) => {
  // Handle system notifications
});

// Client -> Server Methods
connection.invoke('JoinGroup', 'inventory-updates');
connection.invoke('GetConnectionCount');
```

### 3. gRPC Service Integration (Optional)

For high-performance operations, the dashboard can use gRPC:

```javascript
// gRPC Service Endpoints
const grpcUrl = 'http://localhost:5197';

Services:
- InventoryService.ProcessBulkScan    # Bulk inventory processing
- AnalyticsService.CalculateMetrics   # Complex calculations
- ReportingService.GenerateReport     # Large dataset processing
```

### 4. Error Handling & Fallbacks

The dashboard implements robust error handling:

```javascript
// Protocol Fallback Chain
1. gRPC (high performance) -> 2. REST API (reliable) -> 3. Local cache (offline)

// Automatic Reconnection
- SignalR: Exponential backoff reconnection
- HTTP: Retry with circuit breaker pattern
- gRPC: Automatic reconnection with health checks
```

## Project Structure

```
src/
├── app/                    # App configuration
├── components/             # Shared UI components
│   └── ui/                # shadcn/ui components
├── features/              # Feature-based modules
│   ├── auth/             # Authentication system
│   ├── analytics/        # Business intelligence
│   ├── inventory/        # Inventory management
│   ├── monitoring/       # System monitoring
│   ├── reports/          # Report generation
│   ├── users/            # User management
│   └── shared/           # Shared utilities
│       ├── components/   # Layout components
│       ├── hooks/        # Custom React hooks
│       ├── services/     # API integration
│       └── types/        # TypeScript definitions
├── pages/                # Page components
├── lib/                  # Utility libraries
└── assets/               # Static assets
```

## Key Technologies

### Frontend Stack
- **React 18** - Modern UI framework with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library

### State Management
- **TanStack Query** - Server state management and caching
- **Zustand** - Client state management
- **React Hook Form** - Form state and validation

### Data Visualization
- **Recharts** - React charting library
- **Custom Components** - Interactive drilldown and heatmap charts

### Communication
- **Axios** - HTTP client with interceptors
- **SignalR** - Real-time WebSocket communication
- **gRPC-Web** - High-performance RPC calls

### Development Tools
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **ESLint + Prettier** - Code quality and formatting
- **Husky** - Git hooks for quality gates

## Multi-Protocol Integration Patterns

### 1. Data Loading Strategy
```javascript
// Hybrid loading pattern for optimal performance
const useInventoryData = () => {
  // 1. REST: Initial data load with caching
  const { data: products } = useQuery(['products'], fetchProducts);
  
  // 2. gRPC: Complex calculations (fallback to REST)
  const { data: metrics } = useGrpcQuery(['metrics'], 
    () => grpcService.calculateMetrics().catch(() => 
      restService.calculateMetrics()
    )
  );
  
  // 3. SignalR: Real-time updates
  useSignalREffect('ProductUpdated', (product) => {
    queryClient.setQueryData(['products'], (old) => 
      updateProductInList(old, product)
    );
  });
};
```

### 2. Error Handling Pattern
```javascript
// Cross-protocol error handling
const handleApiError = (error, protocol) => {
  switch (protocol) {
    case 'grpc':
      // Try REST fallback
      return restApiCall();
    case 'signalr':
      // Reconnect and resync
      return reconnectAndSync();
    case 'rest':
      // Show user-friendly error
      return handleRestError(error);
  }
};
```

## Security Implementation

### Authentication Flow
1. User logs in with credentials
2. Backend validates and returns JWT access/refresh tokens
3. Tokens stored securely (sessionStorage in dev, httpOnly cookies in prod)
4. All requests include Authorization header
5. Automatic token refresh before expiration
6. SignalR uses same token for WebSocket authentication

### Security Headers
```javascript
// Request Security Headers
'X-CSRF-Token': getCsrfToken(),
'X-Request-ID': generateRequestId(),
'Content-Security-Policy': "default-src 'self'",
'X-Content-Type-Options': 'nosniff'
```

## Development Guidelines

### Adding New Features

1. **Create Feature Module**: Follow feature-based architecture
```bash
src/features/new-feature/
├── components/
├── hooks/
├── services/
├── types/
└── index.ts
```

2. **Implement Types**: Define TypeScript interfaces
3. **Add API Service**: Create service layer for backend communication
4. **Create Components**: Build UI components with accessibility
5. **Add Tests**: Write unit and integration tests
6. **Update Routes**: Add routing configuration

### Component Development
- Use functional components with hooks
- Implement proper error boundaries
- Add loading and error states
- Include accessibility attributes (ARIA)
- Follow Tailwind CSS conventions

### Performance Optimization
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize bundle size with code splitting
- Cache API responses with TanStack Query
- Debounce user inputs and search

## API Integration Testing

### Backend Health Check
```bash
# Test backend connectivity
curl http://localhost:5196/api/v1/health

# Test authentication
curl -X POST http://localhost:5196/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@servicebridge.com","password":"admin123"}'
```

### SignalR Connection Test
```javascript
// Browser console test
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5196/inventoryhub')
  .build();

connection.start().then(() => {
  console.log('SignalR Connected');
}).catch(err => console.error(err));
```

## Troubleshooting

### Common Issues

1. **Cannot connect to backend**
   - Verify backend is running: `curl http://localhost:5196/api/v1/health`
   - Check CORS configuration in backend appsettings.json
   - Ensure API_URL in .env matches backend address
   - Verify firewall/network settings

2. **Authentication failures**
   - Check credentials match backend user accounts
   - Verify JWT configuration in backend
   - Check token expiration settings
   - Clear browser storage: `localStorage.clear()`

3. **SignalR connection issues**
   - Test WebSocket connectivity in browser dev tools
   - Verify SignalR hub is configured in backend
   - Check authentication token is valid
   - Test with: `wscat -c ws://localhost:5196/inventoryhub`

4. **gRPC service unavailable**
   - Verify gRPC services are running on port 5197
   - Check gRPC-Web proxy configuration
   - Test fallback to REST API
   - Check browser console for CORS errors

5. **Build or runtime errors**
   - Clear dependencies: `rm -rf node_modules && npm install`
   - Clear Vite cache: `rm -rf node_modules/.vite`
   - Check TypeScript errors: `npm run type-check`
   - Verify environment variables in .env

### Performance Issues

1. **Slow chart rendering**
   - Reduce data points for large datasets
   - Enable virtualization for data grids
   - Check React DevTools for re-renders

2. **Memory leaks**
   - Check for unsubscribed SignalR connections
   - Verify useEffect cleanup functions
   - Monitor memory usage in browser dev tools

3. **Network latency**
   - Enable response compression in backend
   - Implement request deduplication
   - Use optimistic updates for better UX

## Production Deployment

### Build Configuration
```bash
# Production build
npm run build

# Build output
dist/
├── assets/          # Optimized JS/CSS bundles
├── index.html       # Entry point
└── manifest.json    # PWA manifest
```

### Environment Variables
```env
# Production environment
VITE_API_URL=https://api.servicebridge.com
VITE_SIGNALR_URL=https://api.servicebridge.com/inventoryhub
VITE_GRPC_URL=https://grpc.servicebridge.com
NODE_ENV=production
```

### Security Considerations
- Use HTTPS in production
- Configure Content Security Policy
- Enable secure cookie settings
- Implement rate limiting
- Set up proper CORS origins

## License

This project is part of the ServiceBridge enterprise technology demonstration platform.

---

For additional support or questions about the dashboard application, please refer to the main ServiceBridge documentation or contact the development team.