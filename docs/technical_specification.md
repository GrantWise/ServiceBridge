# Technical Specification

## 1. Backend Technologies

*   **.NET 8+**: For application development.
*   **Entity Framework Core**: For data access, using SQLite for development and SQL Server for production.
*   **MediatR**: For implementing the CQRS pattern.
*   **AutoMapper**: For object mapping between layers.
*   **FluentValidation**: For input validation and business rules.
*   **SignalR**: For real-time communication.
*   **gRPC**: For high-performance, service-to-service communication.

## 2. Frontend Technologies

*   **React 18+**: With modern hooks and functional components.
*   **TypeScript**: With strict mode for complete type safety.
*   **Vite**: For fast development and optimized production builds.
*   **Tailwind CSS + shadcn/ui**: For modern, accessible UI components.
*   **TanStack Query**: For server state management with caching.
*   **Framer Motion**: For smooth animations and transitions.
*   **SignalR JavaScript Client**: With typed event handlers.
*   **Vitest + React Testing Library**: For comprehensive testing.

## 3. Data Model

### 3.1. Product Entity

*   **ProductCode**: `string`, Primary Key
*   **Description**: `string`
*   **QuantityOnHand**: `int`
*   **AverageMonthlyConsumption**: `decimal`
*   **LeadTimeDays**: `int`
*   **QuantityOnOrder**: `int`
*   **Calculated Properties**: `DaysCoverRemaining`, `ReorderPoint`, `StockStatus`

### 3.2. Scan Transaction Entity

*   **Id**: `int`, Primary Key
*   **ProductCode**: `string`, Foreign Key
*   **QuantityScanned**: `int`
*   **ScanDateTime**: `DateTime`
*   **ScannedBy**: `string`

### 3.3. Audit Entry Entity

*   **Id**: `int`, Primary Key
*   **EntityType**: `string`
*   **EntityId**: `string`
*   **Action**: `string`
*   **OldValues**: `JSON`
*   **NewValues**: `JSON`
*   **UserId**: `string`
*   **Timestamp**: `DateTime`

## 4. Communication Protocols

*   **REST API**: For web frontends and external integrations.
*   **gRPC**: For high-performance, service-to-service communication.
*   **SignalR**: For real-time updates and notifications.
