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

### Testing
```bash
# Run all tests
dotnet test

# Run tests for specific project
dotnet test tests/ServiceBridge.Api.Tests
dotnet test tests/ServiceBridge.Application.Tests
dotnet test tests/ServiceBridge.Domain.Tests

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"
```

### Database Operations
```bash
# Add migration
dotnet ef migrations add <MigrationName> --project src/ServiceBridge.Infrastructure --startup-project src/ServiceBridge.Api

# Update database
dotnet ef database update --project src/ServiceBridge.Infrastructure --startup-project src/ServiceBridge.Api

# Drop database (for development)
dotnet ef database drop --project src/ServiceBridge.Infrastructure --startup-project src/ServiceBridge.Api
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

## Multi-Protocol Support
The API simultaneously hosts:
- **REST API**: `/api/v1/*` endpoints for web frontend
- **gRPC Services**: High-performance backend communication
- **SignalR Hub**: `/inventoryhub` for real-time updates
- **Health Checks**: `/health` for monitoring

## Architecture Patterns

### Clean Architecture Layers
- **Domain Layer** (`src/ServiceBridge.Domain`): Contains entities, enums, and domain interfaces. No external dependencies.
- **Application Layer** (`src/ServiceBridge.Application`): Contains CQRS commands/queries, DTOs, validators, and application interfaces using MediatR.
- **Infrastructure Layer** (`src/ServiceBridge.Infrastructure`): Implements data access, external services, and logging using Entity Framework Core and Serilog.
- **API Layer** (`src/ServiceBridge.Api`): Exposes REST, gRPC, and SignalR endpoints with unified authentication.

### CQRS Implementation
- Commands and queries are implemented using MediatR
- Validation is handled by FluentValidation
- DTOs are used for data transfer between layers
- AutoMapper handles object mapping

## Key Technologies

### Backend Technologies
- **MediatR**: CQRS pattern implementation
- **SignalR**: Real-time communication
- **gRPC**: High-performance RPC with protobuf definitions
- **JWT Authentication**: Unified auth across protocols
- **Entity Framework Core**: Data access with SQLite
- **Serilog**: Structured logging
- **xUnit**: Unit testing framework
- **FluentAssertions & Moq**: Testing utilities

### Frontend Technologies
- **React 18+**: Modern React with hooks and functional components
- **TypeScript**: Type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **shadcn/ui**: High-quality, accessible React components built on Radix UI
- **Jest**: JavaScript testing framework with React Testing Library
- **SignalR JavaScript Client**: Real-time communication integration

### Additional Enterprise Frontend Libraries
- **TanStack Query**: Data fetching, caching, and synchronization
- **React Hook Form**: Performant forms with easy validation
- **Zod**: TypeScript-first schema validation
- **React Router**: Declarative routing for React applications
- **Recharts**: Composable charting library for data visualization
- **TanStack Table**: Headless table library for complex data tables
- **date-fns**: Modern JavaScript date utility library
- **React Hot Toast**: Lightweight toast notifications
- **Framer Motion**: Production-ready motion library for animations
- **Lucide React**: Beautiful, customizable SVG icons

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

## Development Principles

### SOLID Principles

**Single Responsibility:** Each class/function has one reason to change
**Open/Closed:** Open for extension, closed for modification
**Liskov Substitution:** Derived classes must be substitutable for base classes
**Interface Segregation:** Clients shouldn't depend on interfaces they don't use
**Dependency Inversion:** Depend on abstractions, not concretions

### Additional Design Principles

**DRY (Don't Repeat Yourself):** Eliminate code duplication through abstraction
**YAGNI (You Aren't Gonna Need It):** Implement only current requirements
**Composition over Inheritance:** Favor object composition over class inheritance
**Fail Fast:** Detect and report errors as early as possible

### Enterprise Patterns (Required)

**Clean Architecture:** Strict 4-layer structure with proper dependency rules
**CQRS:** Separate commands (write) from queries (read) using MediatR
**Domain-Driven Design:** Model software around business domain concepts
**Repository Pattern:** Abstract data access behind interfaces
**Result Pattern:** Return structured results instead of throwing exceptions

### Code Quality Standards

**Naming Conventions:** Use clear, descriptive names that express intent
**Function Design:** Keep functions small and focused (20-40 lines)
**Class Design:** Single responsibility, minimal public APIs
**Error Handling:** Use specific exception types with meaningful messages

## Project Structure
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

## Important Implementation Requirements

### Business Rules Enforcement
- All entity changes must create audit trail entries
- Calculated properties (DaysCoverRemaining, ReorderPoint) implemented as domain entity properties
- Business validation using FluentValidation with clear error messages
- Cross-protocol validation consistency (REST, gRPC, SignalR)

### Real-Time Communication Standards
- SignalR hubs must use strongly-typed interfaces
- Connection lifecycle tracking for operational insights
- Group-based messaging for targeted updates
- Graceful reconnection handling

### Authentication & Security
- JWT authentication unified across all protocols (REST, gRPC, SignalR)
- Input sanitization and validation at all entry points
- HTTPS enforcement and secure token handling

## Frontend Development Standards

### Component Architecture
- Use functional components with React hooks
- Implement custom hooks for business logic reuse
- Follow compound component patterns for complex UI elements
- Keep components small and focused (under 200 lines)

### State Management
- Use TanStack Query for server state management
- Implement local state with useState and useReducer hooks
- Context API for global UI state (theme, user preferences)
- Avoid prop drilling through component composition

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

### Performance Optimization
- Implement code splitting with React.lazy()
- Use React.memo() for expensive component renders
- Optimize images with next/image or similar solutions
- Implement virtual scrolling for large data sets

### Testing Strategy
- Unit tests for utility functions and custom hooks
- Component tests using React Testing Library
- Integration tests for user workflows
- Mock external dependencies and API calls

### Accessibility (a11y)
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation support
- Maintain adequate color contrast ratios
- Test with screen reader compatibility
