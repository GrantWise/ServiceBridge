# The ServiceBridge Engineering Handbook

**Version:** 1.0  
**Status:** Active  
**Owner:** Engineering Leadership

---

## Part 1: Core Philosophy & Guiding Principles

### 1.1. Our North Star: Pragmatic Over Dogmatic

This handbook is the single source of truth for all technical decisions. It applies to all contributors, human and AI alike. However, it is a living document. The primary goal is to write clean, maintainable, and understandable code. Guidelines serve this goal, not the other way around.

Before making a change, ask yourself:
1.  **Does this make the code easier to understand?**
2.  **Would I want to maintain this code in six months?**
3.  **Can a new team member grasp this quickly?**
4.  **Does this keep related concepts logically together?**

We prioritize **readability** over cleverness, **logical cohesion** over arbitrary rules, and **clear intent** over perfect metrics. A 300-line class that tells a coherent story is infinitely better than 3 fragmented 100-line classes that scatter related logic.

### 1.2. The "Why": Our Vision as a Platform

ServiceBridge is a **workflow engine platform** for building custom shop floor and operational applications. While its first implementation is an inventory management system, its core purpose is to provide a generic, configurable, and process-agnostic foundation for modernizing enterprise operations.

Our goals are:
1.  **Enable Flexibility:** To provide a platform where custom business processes can be modeled and deployed rapidly.
2.  **Demonstrate Excellence:** To serve as a blueprint for modern, multi-protocol, scalable, and secure enterprise architecture.

(For the long-term technical vision, see `docs/future/unified_factory_platform_architecture.md`).

### 1.3. Who We Build For: Our User Personas

Every technical decision must ultimately serve our users.

*   **The Workflow Designer (Jennifer, the CI Specialist/Business Analyst):**
    *   **Wants:** A powerful and flexible way to model real-world business processes without writing code.
    *   **Uses:** The platform's configuration tools to design and build custom workflows, define data capture forms, and create the applications that other personas use.

*   **The Operations Manager (Sarah):**
    *   **Wants:** Real-time visibility and control over her business processes.
    *   **Uses:** The dashboards and reports built on the platform to monitor KPIs, identify bottlenecks, and ensure processes are being followed.

*   **The Floor Operator (Michael):**
    *   **Wants:** A simple, clear, and fast way to do their job.
    *   **Uses:** The specific, targeted applications (e.g., a scanner app) built on the platform to execute tasks and record data.

*   **The System Administrator (David):**
    *   **Wants:** A stable, secure, and observable platform.
    *   **Uses:** The monitoring and health check features to ensure uptime and performance.

---

## Part 2: System Architecture

### 2.1. The Blueprint: .NET Clean Architecture

Our architecture follows the .NET Clean Architecture pattern, ensuring a clean separation of concerns. The dependency rule is absolute: **dependencies must only flow inwards.**

*   **API / UI:** The entry point to the system. It knows about the Application layer.
*   **Infrastructure:** Implements external concerns like databases and file systems. It knows about the Application layer.
*   **Application:** Contains all business logic and use cases. It knows about the Domain layer.
*   **Domain:** Contains core business entities and rules. It has **zero** dependencies.

(For more detail, see `architecture_guide.md`).

### 2.2. Core Backend Patterns: The "How"

These are the patterns we use and how to implement them.

*   **CQRS (Command Query Responsibility Segregation):**
    *   **Why:** We separate read-heavy operations from write operations to optimize and scale each path independently. This prevents complex queries from impacting the performance of critical state-changing operations.
    *   **How:** Any action that mutates state **must** be a `Command`. Any action that reads state **must** be a `Query`. Create a class in the appropriate `Commands` or `Queries` folder and a corresponding `Handler` that contains the business logic.

*   **Repository Pattern:**
    *   **Why:** To create a stable abstraction layer between our application's business logic and the data access technology (e.g., MS SQL).
    *   **How:** Application logic **must not** reference `DbContext` directly. All data access **must** go through a repository interface defined in the Domain layer.

*   **Result Pattern:**
    *   **Why:** To explicitly handle the success or failure of an operation without relying on exceptions for control flow. This makes the code more predictable, robust, and easier to reason about.
    *   **How:** All Application layer services and handlers **must** return a `Result` object to explicitly handle success and failure states. **Exceptions are not used for business logic flow.**

### 2.3. Multi-Protocol Strategy: The Right Tool for the Job

We use a multi-protocol approach. The choice of protocol is not arbitrary.
*   **REST:** The default for standard client-to-server communication (e.g., fetching data for a UI, submitting a form).
*   **gRPC:** Used for high-performance, internal, service-to-service communication.
*   **SignalR:** The only choice for pushing real-time updates from the server to clients. Polling is not an acceptable alternative.

### 2.4. Production On-Premises Architecture (The Scalability Mandate)

To achieve high availability and scalability, the following architecture is **mandatory** for production deployments.

*   **Load Balancing:** All API instances **must** be deployed behind a load balancer (e.g., NGINX, HAProxy) configured for a **"Least Connections"** strategy to handle long-lived SignalR connections gracefully.
*   **Database:** **MS SQL Server** is the only supported production database. SQLite is for local development and automated testing only.
*   **Real-Time Scaling:** SignalR **must** be scaled horizontally using a **Redis Backplane**. This is non-negotiable for any multi-instance deployment.
*   **Caching:** A **Redis** distributed cache **must** be implemented to reduce database load for frequently accessed or computationally expensive data.
*   **Background Jobs:** Any operation that is not critical to the immediate user response (e.g., report generation, BI calculations) **must** be offloaded to a **Hangfire** background job processor using MS SQL for storage.

---

## Part 3: Future-Proofing & SaaS Strategy

### 3.1. The Cloud-Ready Path

Our on-premises technology choices are made to ensure a seamless transition to the cloud if required.

| On-Premises Solution | Azure Equivalent |
| :--- | :--- |
| MS SQL Server | Azure SQL Database |
| Redis (for Backplane/Cache) | Azure SignalR Service & Azure Cache for Redis |
| Hangfire on a VM | Azure Functions & Azure Service Bus |
| Windows Certificate Store | Azure Key Vault |
| OpenTelemetry Collector | Azure Monitor |

### 3.2. The SaaS Foundation: Multi-Tenancy by Default

Even for on-premises deployment, we build with a multi-tenant mindset. This is our most important future-proofing strategy.

*   **The Golden Rule:** Any data entity that stores customer-specific information, whether a core entity or a dynamically configured "workflow entity," **must** implement an interface (e.g., `ITenantEntity`) that enforces the presence of a `TenantId`.
*   **Implementation:** We use **EF Core’s Global Query Filters** to enforce tenant isolation automatically at the database level. This is not optional. Every `DbContext` query for a tenant-aware entity is automatically filtered by the current `TenantId`. This prevents accidental data leakage between tenants.

```csharp
// Example in AppDbContext.cs
// This ensures no developer can accidentally query another tenant's data.
builder.Entity<Product>().HasQueryFilter(p => p.TenantId == _tenantService.GetTenantId());
```

---

## Part 4: Backend Development Standards (C#)

### 4.1. Code Style & Structure

*   **Naming:** Adhere to Microsoft's C# Coding Conventions (`Async` suffix, `I` prefix for interfaces, `_` prefix for private fields).
*   **File Size:** Prioritize logical cohesion. A class of ~200 lines is a reasonable target, but a larger class that tells a coherent story is acceptable.
*   **Function Size:** Aim for 20-40 lines. A longer function is permissible only if it has a clear, single purpose and cannot be cleanly subdivided.
*   **Comments:** Comment on the **why**, not the **what**. Avoid obvious comments.

### 4.2. Error Handling & Validation

*   **Business Logic Failures** (e.g., "product not found", "invalid quantity") **must** be handled by returning a `Failure` result from the `Result` object.
*   **True Exceptions** (e.g., database connection lost, critical configuration missing) are for catastrophic, system-level failures only.
*   **Validation:** All data entering the Application layer (API requests, command objects) **must** be validated with a dedicated **FluentValidation** validator.

### 4.4. Logging (Observability Part 1)

*   **Structured Logging:** All logging **must** use **Serilog** and be configured to output structured JSON to the console or a log aggregator.
*   **Correlation ID:** Every log message generated during a request **must** include the same `CorrelationId`.
*   **Content:** Log with sufficient context to diagnose issues. **Never log PII, secrets, or sensitive data.**

### 4.5. Data Access

*   All database calls **must** be asynchronous (`async/await`).
*   The `DbContext` **must not** be used directly in Application logic. All data access **must** go through the Repository Pattern.
*   Write efficient queries. Be vigilant against N+1 problems. Use projections (`.Select()`) to query only the data you need.

---

## Part 5: Frontend Development Standards (TypeScript & React)

### 5.1. Component Architecture

*   We use a strict Presentational/Container component pattern to separate logic from the view.
*   Components should be small, composable, and have a single, clear responsibility.
*   **Component Size:** Aim for ~200 lines, but prioritize logical cohesion.

### 5.2. State Management

The choice of state management tool is not arbitrary.
*   **Server State:** **TanStack Query** is the mandatory choice for fetching, caching, and synchronizing all data from the backend.
*   **Global UI State:** **Zustand** is the standard for managing application-wide UI state (e.g., theme, sidebar open/closed).
*   **Form State:** **React Hook Form** with **Zod** for schema-based validation is the required solution for all forms.

### 5.3. Styling

*   **Tailwind CSS** is our utility-first CSS framework.
*   **`shadcn/ui`** is our component library.
*   All styling **must** adhere to the tokens and color palette defined in `brand_guide.md`.

### 5.4. Type Safety

*   TypeScript `strict` mode is **required**.
*   Define explicit types or interfaces for all component props and API payloads.

---

## Part 6: Security & Compliance

### 6.1. Secure by Design Principles

*   **Authentication:** Stateless **JWT** is the standard.
*   **Authorization:** All API endpoints **must** be protected with an `[Authorize]` attribute by default. Public access is an explicit exception that requires a documented justification. Role-Based Access Control (RBAC) must be used to enforce permissions.
*   **Secret Management:** Secrets **must never** be committed to source control. Use environment variables locally and a secure vault (e.g., Azure Key Vault, HashiCorp Vault) in production.
*   **Input Validation:** All input is untrusted. It **must** be validated on the backend (FluentValidation) and frontend (Zod).
*   **Dependency Scanning:** Automated dependency scanning (e.g., Dependabot, Snyk) is a **required** step in the CI pipeline.

### 6.2. Compliance & Data Privacy Foundation

While our primary deployment is on-premises, we build with global data privacy standards in mind. This ensures we are prepared for future cloud/SaaS deployments and can meet enterprise compliance requirements.

*   **GDPR (General Data Protection Regulation - EU):**
    *   **Principles:** We adhere to the core principles of Data Minimization, Purpose Limitation, and Security by Design.
    *   **Our Implementation:**
        *   **Data Minimization:** We only collect the minimum user data required for functionality (e.g., `UserId` for auditing). We do not store names, emails, or other PII unless explicitly required and documented.
        *   **Right to Access/Erasure:** Our architecture, with its comprehensive `AuditLog` and use of `UserId` as a foreign key, is designed to facilitate the export or deletion of a specific user's data upon a verified request.
        *   **Security:** The technical measures outlined in this handbook (encryption, access control, logging) form the basis of our GDPR compliance.

*   **POPIA (Protection of Personal Information Act - South Africa):**
    *   This standard is closely aligned with GDPR. Our GDPR-ready approach is sufficient to meet the core requirements of POPIA.

*   **ISO 27001 (Information Security Management):**
    *   This is a framework for managing information security. Our handbook and practices map directly to its key controls:
        *   **A.5 (Policies):** This handbook serves as our information security policy.
        *   **A.9 (Access Control):** Our RBAC, JWT, and least-privilege model.
        *   **A.10 (Cryptography):** Our requirement for TLS and data-at-rest encryption.
        *   **A.12 (Operations Security):** Our standards for logging, monitoring, and vulnerability management.
        *   **A.14 (Development Lifecycle):** Our entire SDLC process, including mandatory code reviews, CI/CD pipelines, and automated testing.

---

## Part 7: Testing & Quality Assurance

### 7.1. The Testing Pyramid

We follow the standard testing pyramid:
*   **Unit Tests (Many):** The foundation. Test individual classes and methods in isolation.
*   **Integration Tests (Some)::** Test the interaction between components, from the API to the database.
*   **End-to-End Tests (Few):** Automated UI tests for critical user paths.

### 7.2. Code Coverage

*   We target a minimum of **80% code coverage** for the Application and Domain layers. This is a required quality gate in the CI pipeline.

### 7.3. Debugging & Root Cause Analysis

When fixing bugs or failing tests, you **must** follow this process:
1.  **Identify the Centralized Pattern:** Look for a common cause behind multiple failures. Do not patch symptoms individually.
2.  **Find the Root Architectural Violation:** Identify the underlying issue (e.g., a violation of SRP, DRY).
3.  **Create or Fix a Centralized Solution:** Develop a single utility, service, or pattern to resolve the root cause.
4.  **Apply the Fix:** Refactor all affected code to use the new centralized solution.

#### Anti-Patterns to Avoid:
*   Fixing test failures one by one.
*   Duplicating fixes across multiple files.
*   Mixing unrelated concerns in a single component or class.
*   Hardcoding values that should come from configuration.
*   Implementing inconsistent error handling.

---

## Part 8: DevOps & Operations

### 8.1. Source Control

*   **Gitflow** is our branching strategy (`main`, `develop`, `feature/`, `hotfix/`).
*   All work **must** be done in a feature branch and merged via a **Pull Request (PR)**.
*   Every PR **must** be reviewed and approved by at least one other developer before merging.

### 8.2. Continuous Integration (CI)

*   The CI pipeline (GitHub Actions) **must** run on every PR. A passing build is **required** to merge.
*   **Required CI Steps:**
    1.  Build the solution.
    2.  Run linters.
    3.  Run all unit and integration tests.
    4.  Check code coverage.
    5.  Run automated security scans (dependency check, SAST).

### 8.3. Continuous Deployment (CD)

*   A successful merge to the `develop` branch triggers an automated deployment to a staging environment.
*   A successful merge to the `main` branch triggers an automated deployment to the production environment.

### 8.4. Monitoring (Observability Part 2)

*   **Health Checks:** The API **must** expose a `/health` endpoint that performs deep checks on its critical dependencies (Database, Redis Cache).
*   **Metrics & Tracing:** The system **must** be instrumented with **OpenTelemetry** to export metrics, logs, and traces to a monitoring backend.

---

## Part 9: Common Development Commands

### Build & Run
```bash
# Build entire solution
dotnet build backend/ServiceBridge.sln

# Run the API project (hosts REST, gRPC, and SignalR)
dotnet run --project backend/src/ServiceBridge.Api
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
