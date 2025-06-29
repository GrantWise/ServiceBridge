# ServiceBridge Scanner App

A modern React-based inventory scanning application built with TypeScript, Vite, and Tailwind CSS. This application provides real-time inventory management capabilities with barcode scanning and live updates via SignalR.

## Features

- 📦 **Product Scanning**: Scan product barcodes to update inventory
- 🔐 **JWT Authentication**: Secure login with token-based authentication
- 🔄 **Real-time Updates**: Live inventory updates via SignalR
- 📊 **Analytics**: View inventory metrics and trends
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 🛡️ **Secure**: CSRF protection, input sanitization, and rate limiting

## Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:5196

## Installation

1. **Install dependencies:**
```bash
cd frontend/scanner-app
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
VITE_APP_NAME=ServiceBridge Scanner
VITE_APP_VERSION=1.0.0
```

3. **Start the development server:**
```bash
npm run dev
```

The scanner application will be available at **http://localhost:5173**

## Demo Credentials

Use these credentials to log in:

```
Username: scanner1@servicebridge.com
Password: scanner123
```

Alternative test accounts:
- **Admin**: admin@servicebridge.com / admin123
- **Manager**: manager@servicebridge.com / manager123
- **Scanner 2**: scanner2@servicebridge.com / scanner123

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
src/
├── components/        # React components
│   ├── auth/         # Authentication components
│   ├── common/       # Shared components
│   ├── scanner/      # Scanner-specific components
│   └── ui/           # shadcn/ui components
├── contexts/         # React contexts
├── hooks/            # Custom React hooks
├── pages/            # Page components
├── services/         # API and service layer
│   ├── auth/         # Authentication services
│   ├── error/        # Error handling
│   └── security/     # Security utilities
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── config/           # Configuration files
```

## Key Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **TanStack Query** - Data fetching
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **SignalR** - Real-time communication
- **Axios** - HTTP client

## Security Features

- JWT token management with automatic refresh
- CSRF protection with double-submit cookies
- Input sanitization using DOMPurify
- Client-side rate limiting
- Content Security Policy (CSP)
- Secure error handling (no sensitive data exposure)
- Request signing for sensitive operations

## Development Guidelines

### Authentication Flow

1. User logs in with credentials
2. Backend validates and returns JWT tokens
3. Tokens stored in sessionStorage (httpOnly cookies in production)
4. Tokens automatically included in API requests
5. Automatic token refresh before expiration
6. Logout clears tokens and redirects to login

### Adding New Features

1. Create components in appropriate directories
2. Use TypeScript interfaces for all props
3. Implement proper error handling
4. Add accessibility attributes
5. Write unit tests
6. Update documentation

### Code Style

- Use functional components with hooks
- Follow React best practices
- Keep components small and focused
- Use proper TypeScript types
- Follow ESLint rules

## Backend Communication Setup

### 1. Backend API Integration

The scanner app communicates with the backend via REST API and SignalR:

#### REST API Endpoints
```
Base URL: http://localhost:5196/api/v1

Authentication:
- POST /auth/login          # User login
- POST /auth/refresh        # Token refresh
- POST /auth/logout         # User logout
- GET  /auth/me            # Get current user

Products & Scanning:
- GET    /products         # List products (with search/filter)
- GET    /products/{code}  # Get product by barcode
- POST   /products/{code}/scan # Record inventory scan
- PUT    /products/{code}  # Update product details

Analytics:
- GET    /analytics/inventory # Get inventory analytics
- GET    /analytics/scans    # Get scan history
- GET    /analytics/user     # Get user-specific metrics
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
connection.on('ProductScanned', (scanData) => {
  // Handle real-time scan notifications
});

connection.on('ProductUpdated', (product) => {
  // Handle product updates from other users
});

connection.on('UserConnected', (connectionInfo) => {
  // Handle user connection events
});

// Client -> Server Methods
connection.invoke('JoinGroup', 'scanner-updates');
connection.invoke('NotifyScan', scanData);
```

### 3. Error Handling & Offline Support

The scanner implements robust error handling:

```javascript
// Network Failure Handling
1. Online: REST API calls with retry logic
2. Offline: Local storage queue for scans
3. Reconnection: Auto-sync queued data when online

// Real-time Fallback
- SignalR: Auto-reconnect with exponential backoff
- HTTP: Circuit breaker pattern for API calls
- Cache: Local storage for critical data
```

## Troubleshooting

### Common Issues

1. **Cannot connect to backend**
   - Verify backend is running: `curl http://localhost:5196/api/v1/health`
   - Check CORS configuration in backend appsettings.json
   - Ensure API_URL in .env matches backend address: `http://localhost:5196`
   - Verify firewall/network settings allow port 5196

2. **Authentication failures**
   - Check credentials match backend user accounts
   - Verify JWT configuration in backend
   - Check token expiration settings
   - Clear browser storage: `localStorage.clear(); sessionStorage.clear()`

3. **SignalR connection issues**
   - Test WebSocket connectivity in browser dev tools (Network tab)
   - Verify SignalR hub is configured in backend Startup.cs
   - Check authentication token is valid and not expired
   - Test manually: `wscat -c ws://localhost:5196/inventoryhub`

4. **Barcode scanning not working**
   - Check camera permissions in browser
   - Ensure HTTPS is used in production (camera requires secure context)
   - Verify barcode format matches expected patterns
   - Check browser compatibility for camera API

5. **Build or runtime errors**
   - Clear dependencies: `rm -rf node_modules && npm install`
   - Clear Vite cache: `rm -rf node_modules/.vite`
   - Check TypeScript errors: `npm run type-check`
   - Verify environment variables in .env file

### API Integration Testing

#### Backend Health Check
```bash
# Test backend connectivity
curl http://localhost:5196/api/v1/health

# Test authentication
curl -X POST http://localhost:5196/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"scanner1@servicebridge.com","password":"scanner123"}'

# Test product lookup
curl -H "Authorization: Bearer <token>" \
  http://localhost:5196/api/v1/products/P001
```

#### SignalR Connection Test
```javascript
// Browser console test
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5196/inventoryhub')
  .build();

connection.start().then(() => {
  console.log('SignalR Connected');
  connection.invoke('JoinGroup', 'scanner-updates');
}).catch(err => console.error('Connection failed:', err));
```

## License

This project is part of the ServiceBridge PoC demonstration.