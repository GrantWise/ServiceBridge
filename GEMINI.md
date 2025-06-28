# GEMINI.md

This document provides guidance to Gemini when working with code in this repository. It consolidates the project's technical standards and development principles to ensure consistency, quality, and adherence to architectural patterns.

## Project Overview

ServiceBridge is a .NET 8 Clean Architecture project demonstrating the modernization of legacy WCF services using multi-protocol communication (REST, gRPC, SignalR). The project follows a 4-layer structure: Domain, Application, Infrastructure, and API. It simulates an Inventory Management System with product scanning, stock updates, real-time monitoring, business intelligence calculations (days cover, reorder points), and a comprehensive audit trail.

## Architectural Principles

### Clean Architecture Foundation
**4-Layer Structure:**
- **Domain** - Core business entities, rules, and interfaces (no dependencies)
- **Application** - Use cases, business workflows, and application services
- **Infrastructure** - Data access, external services, and technical implementations
- **API** - Controllers, endpoints, and external-facing interfaces

**Dependency Rules:**
- API → Application → Domain
- API → Infrastructure → Application → Domain
- Infrastructure → Domain
- Domain depends on nothing (pure business logic)

### SOLID Principles
- **Single Responsibility:** Each class/function has one reason to change
- **Open/Closed:** Open for extension, closed for modification
- **Liskov Substitution:** Derived classes must be substitutable for base classes
- **Interface Segregation:** Clients shouldn't depend on interfaces they don't use
- **Dependency Inversion:** Depend on abstractions, not concretions

### Additional Design Principles
- **DRY (Don't Repeat Yourself):** Eliminate code duplication through abstraction
- **YAGNI (You Aren't Gonna Need It):** Implement only current requirements
- **Composition over Inheritance:** Favor object composition over class inheritance
- **Fail Fast:** Detect and report errors as early as possible

## Project Structure Standards

```
src/
├── ServiceBridge.Domain/         # Core business entities and rules
│   └── Entities/                # Product, ScanTransaction, AuditEntry, Enums
├── ServiceBridge.Application/    # Business logic and CQRS
│   ├── Commands/               # Write operations
│   ├── Queries/                # Read operations
│   ├── DTOs/                   # Data transfer objects
│   └── Validators/             # FluentValidation rules
├── ServiceBridge.Infrastructure/ # Data access and external services
│   ├── Data/                   # EF DbContext
│   ├── Repositories/           # Data access implementations
│   └── Services/               # External service implementations
└── ServiceBridge.Api/           # Web API layer
    ├── Controllers/            # REST API endpoints
    ├── Services/               # gRPC service implementations
    ├── Hubs/                   # SignalR hubs
    └── Protos/                 # Protocol buffer definitions

tests/                          # Unit and integration tests
frontend/                       # React applications
├── scanner-app/               # Inventory scanning interface
└── dashboard-app/             # Analytics dashboard
```

## Enterprise Patterns

### CQRS (Command Query Responsibility Segregation)
- **Commands:** Operations that modify state
- **Queries:** Operations that read data
- **Handlers:** Single-purpose classes that process commands/queries
- **Mediator Pattern:** Decouple request/response handling

### Domain-Driven Design
- Model software around business domain concepts
- Use ubiquitous language throughout the codebase
- Implement rich domain models with business logic
- Define clear bounded contexts

### Repository Pattern
- Abstract data access behind interfaces
- Encapsulate query logic
- Enable easier testing and database independence

### Result Pattern
- Return structured results instead of throwing exceptions
- Provide type-safe error handling
- Include success/failure status and error details

## Communication Protocols

### Multi-Protocol Support
Modern applications should support multiple communication patterns:
- **REST APIs:** For web frontends and external integrations (Standard HTTP methods and status codes, JSON request/response format)
- **gRPC Services:** For high-performance service-to-service communication (Strongly-typed contracts using Protocol Buffers, Built-in load balancing and health checking)
- **Real-Time Communication:** SignalR for live updates and notifications (WebSocket connections with automatic fallbacks, Server-to-client push capabilities)

## Authentication & Security Standards

- JWT-based authentication unified across all communication protocols (REST, gRPC, SignalR)
- Stateless token validation
- Configurable token expiration and refresh
- Policy-based authorization, Role and claims-based access control
- Input sanitization and validation at all entry points
- HTTPS enforcement and secure token handling

## Code Quality Standards

### Naming Conventions
- Use clear, descriptive names that express intent
- Avoid abbreviations unless widely understood
- Follow consistent casing conventions (PascalCase, camelCase)
- Use domain-specific terminology

### Function Design
- Keep functions small and focused (aim for 20-40 lines)
- Single responsibility per function
- Prefer pure functions where possible
- Use meaningful parameter names

### Class Design
- Single responsibility principle
- Favor composition over inheritance
- Implement interfaces for testability
- Keep public APIs minimal and clear

## Error Handling Standards

### Exception Management
- Use specific exception types, not generic ones
- Handle exceptions at appropriate architectural layers
- Provide meaningful error messages to users
- Implement graceful degradation where possible

### Logging Standards
- Use structured logging (Serilog recommended)
- Log at appropriate levels (Debug, Info, Warning, Error, Fatal)
- Include sufficient context for troubleshooting
- Implement correlation IDs for request tracing

## Testing Standards

### Test Categories
- **Unit Tests:** Test individual components in isolation
- **Integration Tests:** Test component interactions
- **End-to-End Tests:** Test complete user workflows

### Test Principles
- Arrange, Act, Assert pattern
- Test one thing at a time
- Use descriptive test names
- Maintain test independence

## Documentation Requirements

### Code Documentation
- Write self-documenting code with clear naming
- Add comments only for complex business logic
- Document public APIs and interfaces
- Avoid obvious or redundant comments

### Architectural Documentation
- Document major architectural decisions
- Maintain API documentation
- Update documentation with code changes
- Include deployment and configuration guides

## PoC-Specific Implementation Standards

### Data Modeling Requirements
- **Audit Trail Implementation:** All entity changes must be tracked with old/new values, timestamps, and user context
- **Calculated Properties:** Business logic calculations should be implemented as read-only properties in domain entities
- **Domain Events:** Use domain events to trigger audit entries and real-time notifications

### Real-Time Communication Standards
- **SignalR Implementation:** Use strongly-typed hubs with interface definitions
- **Connection Management:** Track and monitor active connections for operational insights
- **Message Broadcasting:** Implement group-based messaging for targeted updates
- **Client-Side Events:** Typed event handlers with proper error handling
- **Reconnection Logic:** Exponential backoff with max retry limits

### Validation Standards
- **FluentValidation:** Use for all input validation with business rule expressions
- **Domain Validation:** Implement business rule validation within domain entities
- **Cross-Protocol Validation:** Ensure consistent validation across REST, gRPC, and SignalR

### Container Standards
- **Multi-Stage Builds:** Use multi-stage Docker builds for optimal image size
- **Health Check Integration:** Include health check endpoints in container definitions
- **Environment Configuration:** Support configuration through environment variables
- **Volume Management:** Use named volumes for persistent data storage

## Frontend Development Standards

### Component Design Principles
- **Single Responsibility:** Each component has one clear purpose
- **Composition over Inheritance:** Build complex UIs from simple components
- **Props Interface:** Define TypeScript interfaces for all component props
- **Default Props:** Provide sensible defaults for optional props
- **Error Boundaries:** Implement error boundaries for graceful failure handling

### State Management Patterns
- **Server State:** Use TanStack Query for all API data with proper caching
- **UI State:** Use React Context sparingly for truly global state
- **Form State:** React Hook Form with Zod schema validation
- **URL State:** Use React Router for navigation state
- **Local Storage:** Custom hooks with TypeScript generics

### Styling Standards
- Use Tailwind CSS utility classes for styling
- Leverage shadcn/ui components as foundation
- Create custom components by extending shadcn/ui base components
- Maintain consistent design tokens (colors, spacing, typography)

### Type Safety
- Define TypeScript interfaces for all API responses
- Use Zod schemas for runtime validation
- Implement strict TypeScript configuration
- Type all component props and event handlers

### API Client Architecture
```typescript
// Base service class with interceptors
class BaseApiService {
  protected client: AxiosInstance;
  
  constructor(config: ApiConfig) {
    this.client = axios.create(config);
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Request interceptor for auth
    // Response interceptor for error handling
  }
}

// Domain-specific services
class ProductsApiService extends BaseApiService {
  async getProduct(code: string): Promise<Product> {
    return this.get<Product>(`/products/${code}`);
  }
}
```

### Custom Hook Patterns
```typescript
// Encapsulate business logic in custom hooks
const useProductLookup = (productCode: string) => {
  return useQuery({
    queryKey: ['product', productCode],
    queryFn: () => productsApi.getProduct(productCode),
    enabled: !!productCode && isValidProductCode(productCode),
  });
};

// Compose hooks for complex features
const useSignalRConnection = (handlers: SignalREventHandlers) => {
  const [state, setState] = useState<ConnectionState>();
  
  useEffect(() => {
    // Connection setup and cleanup
  }, []);
  
  return { state, isConnected, reconnect };
};
```

### Performance Optimization Standards
- **Code Splitting:** Lazy load routes and heavy components
- **Memoization:** Use React.memo() and useMemo() appropriately
- **Virtual Scrolling:** For lists with > 100 items
- **Image Optimization:** Lazy loading with proper placeholders
- **Bundle Size:** Keep main bundle < 200KB gzipped

### Testing Standards
```typescript
// Component testing with custom render
const renderWithProviders = (ui: ReactElement, options = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>,
    options
  );
};

// Test user interactions
test('submits scan successfully', async () => {
  const user = userEvent.setup();
  renderWithProviders(<ScanForm />);
  
  await user.type(screen.getByLabelText(/product code/i), 'ABC123');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(await screen.findByText(/success/i)).toBeInTheDocument();
});
```

### Accessibility (a11y)
- **Semantic HTML:** Use proper HTML elements for their intended purpose
- **ARIA Labels:** Add labels for interactive elements
- **Keyboard Navigation:** Ensure all features work with keyboard only
- **Focus Management:** Proper focus handling for modals and dynamic content
- **Color Contrast:** WCAG 2.1 AA compliance (4.5:1 for normal text)
- **Screen Reader Support:** Test with NVDA/JAWS

### Performance Monitoring
- **Health Checks:** Implement comprehensive health checks for all external dependencies
- **Metrics Collection:** Track request counts, response times, and error rates across all protocols
- **Connection Monitoring:** Monitor SignalR connection lifecycle and performance

## Technology Stack Standards

### Core Technologies
- **.NET 8+** for application development
- **Entity Framework Core** for data access with SQLite for development/PoC, SQL Server for production
- **MediatR** for CQRS implementation
- **AutoMapper** for object mapping between layers
- **FluentValidation** for input validation and business rules
- **SignalR** for real-time communication
- **gRPC** for high-performance service-to-service communication

### Quality Assurance
- **Health Checks** for application monitoring
- **Structured Logging** for observability
- **Dependency Injection** for loose coupling
- **Configuration Management** for environment-specific settings

## Common Commands

### Build & Run
```bash
# Build entire solution
dotnet build backend/ServiceBridge.sln

# Run the API project (hosts REST, gRPC, and SignalR)
dotnet run --project backend/src/ServiceBridge.Api

# Run with Docker Compose
docker-compose up --build
```

### Testing
```bash
# Run all tests
dotnet test backend/tests/ServiceBridge.Api.Tests
dotnet test backend/tests/ServiceBridge.Application.Tests
dotnet test backend/tests/ServiceBridge.Domain.Tests

# Run tests with coverage
dotnet test backend/ServiceBridge.sln --collect:"XPlat Code Coverage"
```

### Database Operations
```bash
# Add migration
dotnet ef migrations add <MigrationName> --project backend/src/ServiceBridge.Infrastructure --startup-project backend/src/ServiceBridge.Api

# Update database
dotnet ef database update --project backend/src/ServiceBridge.Infrastructure --startup-project backend/src/ServiceBridge.Api

# Drop database (for development)
dotnet ef database drop --project backend/src/ServiceBridge.Infrastructure --startup-project backend/src/ServiceBridge.Api
```

### Frontend Development
```bash
# Install frontend dependencies
cd frontend/scanner-app && npm install
cd frontend/dashboard-app && npm install

# Start development servers
cd frontend/scanner-app && npm start
cd frontend/dashboard-app && npm start

# Run tests
cd frontend/scanner-app && npm test
cd frontend/dashboard-app && npm test

# Build for production
cd frontend/scanner-app && npm run build
cd frontend/dashboard-app && npm run build

# Type checking
cd frontend/scanner-app && npm run type-check
cd frontend/dashboard-app && npm run type-check

# Linting
cd frontend/scanner-app && npm run lint
cd frontend/dashboard-app && npm run lint
```
