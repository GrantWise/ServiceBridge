# GEMINI.md

This document provides guidance to Gemini when working with code in this repository. It consolidates the project's technical standards and development principles to ensure consistency, quality, and adherence to architectural patterns.

## Project Overview

ServiceBridge is a .NET 8 Clean Architecture project demonstrating the modernization of legacy WCF services using multi-protocol communication (REST, gRPC, SignalR). The project follows a 4-layer structure: Domain, Application, Infrastructure, and API. It simulates an Inventory Management System with product scanning, stock updates, real-time monitoring, business intelligence calculations (days cover, reorder points), and a comprehensive audit trail.

## Development Philosophy: Pragmatic Over Dogmatic

**Remember**: These standards exist to serve code quality and maintainability, not the other way around.

### When in Doubt, Ask:
1. **Understanding**: Will this approach make the code easier to understand?
2. **Maintainability**: Would I want to maintain this in 6 months?
3. **Onboarding**: Can a new team member quickly grasp what this does?
4. **Logical Flow**: Does this keep related concepts together?

### Prioritize:
- **Readability** over clever solutions
- **Logical cohesion** over arbitrary size limits
- **Clear intent** over perfect metrics
- **Developer experience** over rigid rules

**A 300-line class that tells a coherent story is infinitely better than 3 fragmented 100-line classes that scatter related logic.**

## Documentation

For detailed information on the project, please refer to the following documents in the `/docs` directory:

*   **`prd.md`**: The Product Requirements Document.
*   **`technical_specification.md`**: A comprehensive technical overview of the project.
*   **`architecture_guide.md`**: An explanation of the core architectural principles and patterns.
*   **`brand_guide.md`**: The official branding guidelines.
*   **`development_standards.md`**: A unified guide for both frontend and backend development.

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