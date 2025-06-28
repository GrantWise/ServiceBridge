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

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5173

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

## API Integration

The app expects a backend API at `http://localhost:5196` with the following endpoints:

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/products` - List products
- `GET /api/v1/products/{code}` - Get product details
- `POST /api/v1/products/{code}/scan` - Record scan
- `GET /api/v1/analytics/inventory` - Get analytics
- WebSocket `/inventoryhub` - Real-time updates

## Troubleshooting

### Common Issues

1. **Cannot connect to backend**
   - Ensure backend is running on port 5196
   - Check CORS settings in backend
   - Verify API_URL in .env file

2. **Login fails**
   - Check credentials are correct
   - Ensure backend authentication is configured
   - Check browser console for errors

3. **Real-time updates not working**
   - Verify SignalR hub is accessible
   - Check WebSocket connection in browser
   - Ensure authentication token is valid

4. **Build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Clear Vite cache: `rm -rf node_modules/.vite`
   - Check TypeScript errors: `npm run type-check`

## License

This project is part of the ServiceBridge PoC demonstration.