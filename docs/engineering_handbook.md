# The ServiceBridge Engineering Handbook

**Version:** 2.0  
**Status:** Active  
**Owner:** Engineering Leadership

---

## **Part 1: Core Philosophy & Guiding Principles**

### **1.1. Our North Star: Pragmatic Over Dogmatic**

This handbook is the single source of truth for all technical decisions. It applies to all contributors, human and AI alike. However, it is a living document. The primary goal is to write clean, maintainable, and understandable code. Guidelines serve this goal, not the other way around.

Before making a change, ask yourself:
1.  **Does this make the code easier to understand?**
2.  **Would I want to maintain this code in six months?**
3.  **Can a new team member grasp this quickly?**
4.  **Does this keep related concepts logically together?**

We prioritize **readability** over cleverness, **logical cohesion** over arbitrary size limits, and **clear intent** over perfect metrics. A 300-line class that tells a coherent story is infinitely better than three fragmented 100-line classes that scatter related logic.

### **1.2. The "Why": Our Vision as a Platform**

ServiceBridge is a **workflow engine platform** for building custom shop floor and operational applications. While its first implementation is an inventory management system, its core purpose is to provide a generic, configurable, and process-agnostic foundation for modernizing enterprise operations.

Our goals are:
1.  **Enable Flexibility:** To provide a platform where custom business processes can be modeled and deployed rapidly.
2.  **Demonstrate Excellence:** To serve as a blueprint for modern, multi-protocol, scalable, and secure enterprise architecture.

(For the long-term technical vision, see `docs/future/unified_factory_platform_architecture.md`).

### **1.3. Who We Build For: Our User Personas**

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

## **Part 2: System Architecture**

### **2.1. The Blueprint: .NET Clean Architecture**

Our architecture follows the .NET Clean Architecture pattern. The dependency rule is absolute: **dependencies must only flow inwards.**

*   **API / UI -> Infrastructure -> Application -> Domain**

### **2.2. Core Backend Patterns: The "How"**

These are the patterns we use and how to implement them.

*   **CQRS (Command Query Responsibility Segregation):**
    *   **Why:** We separate read-heavy operations from write operations to scale each path independently and optimize performance.
    *   **How:** Any action that mutates state **must** be a `Command`. Any action that reads state **must** be a `Query`. Create a class in the appropriate `Commands` or `Queries` folder and a corresponding `Handler` that contains the business logic.

*   **Repository Pattern:**
    *   **Why:** To decouple our business logic from the database technology (e.g., MS SQL).
    *   **How:** Application logic **must not** reference `DbContext` directly. All data access **must** go through a repository interface defined in the Domain layer.

*   **Result Pattern:**
    *   **Why:** To handle outcomes explicitly without relying on exceptions for business logic flow.
    *   **How:** All Application layer services and handlers **must** return a `Result` object.

### **2.3. Multi-Protocol Strategy**

*   **REST:** The default for standard client-server communication.
*   **gRPC:** For high-performance internal service-to-service communication.
*   **SignalR:** The only choice for pushing real-time updates from the server to clients.

### **2.4. Production On-Premises Architecture**

This architecture is **mandatory** for production deployments.

*   **Load Balancing:** API instances **must** be behind a load balancer (e.g., NGINX) configured for **"Least Connections"**.
*   **Database:** **MS SQL Server** is the only supported production database.
*   **Real-Time Scaling:** SignalR **must** be scaled using a **Redis Backplane**.
*   **Caching:** A **Redis** distributed cache **must** be used for performance-critical queries.
*   **Background Jobs:** Long-running tasks **must** be offloaded to **Hangfire**.

---

## **Part 3: Future-Proofing & SaaS Strategy**

### **3.1. The Cloud-Ready Path**

Our on-premises choices map directly to Azure equivalents (MS SQL -> Azure SQL, Redis -> Azure Cache for Redis, etc.).

### **3.2. The SaaS Foundation: Multi-Tenancy by Default**

*   **The Golden Rule:** Any data entity that stores customer-specific information, whether a core entity or a dynamically configured "workflow entity," **must** implement an interface (e.g., `ITenantEntity`) that enforces the presence of a `TenantId`.
*   **Implementation:** We use **EF Core’s Global Query Filters** to enforce tenant isolation automatically at the database level. This is not optional.

---

## **Part 4: Backend Development Standards (C#)**

### **4.1. Code Style & Structure**

*   **Naming:** Adhere to Microsoft's C# Coding Conventions (`Async` suffix, `I` prefix for interfaces).
*   **File Size:** Prioritize logical cohesion. A class of ~200 lines is a reasonable target, but a larger class that tells a coherent story is acceptable.
*   **Function Size:** Aim for 20-40 lines. A longer function is permissible only if it has a clear, single purpose and cannot be cleanly subdivided.
*   **Comments:** Comment on the **why**, not the **what**. Avoid obvious comments.

### **4.2. Error Handling & Validation**

*   **Business Logic:** Use the `Result` object for success/failure.
*   **Exceptions:** For truly exceptional, system-level failures only.
*   **Validation:** All data entering the Application layer **must** be validated with **FluentValidation**.

---

## **Part 5: Frontend Development Standards (TypeScript & React)**

### **5.1. Code Style & Structure**

*   **Component Architecture:** Use a strict Presentational/Container pattern.
*   **Component Size:** Aim for ~200 lines, but prioritize logical cohesion.
*   **Styling:** **Tailwind CSS** and **`shadcn/ui`** are standard.
*   **Type Safety:** TypeScript `strict` mode is **required**.

### **5.2. State Management**

*   **Server State:** **TanStack Query** is mandatory.
*   **Global UI State:** **Zustand** is the standard.
*   **Form State:** **React Hook Form** with **Zod** is required.

---

## **Part 6: Security & Compliance**

### **6.1. Secure by Design Principles**

*   **Authorization:** All API endpoints **must** have an `[Authorize]` attribute by default.
*   **Secret Management:** Secrets **must never** be committed to source control.
*   **Dependency Scanning:** Automated dependency scanning (e.g., Dependabot) is a **required** CI step.

### **6.2. Compliance & Data Privacy Foundation**

We build with global data privacy standards (GDPR, POPIA, ISO 27001) in mind. This is achieved through:
*   **Data Minimization:** Collecting only essential data.
*   **Security by Design:** Implementing the technical controls in this handbook.
*   **Auditability:** Maintaining a comprehensive audit trail of all actions.

---

## **Part 7: Testing & Quality Assurance**

### **7.1. The Testing Pyramid**

*   **Unit Tests (Many):** The foundation.
*   **Integration Tests (Some):** Test interactions between components.
*   **End-to-End Tests (Few):** For critical user paths.

### **7.2. Code Coverage**

*   Target **>80% code coverage** for the Application and Domain layers.

### **7.3. Debugging & Root Cause Analysis**

When fixing bugs or failing tests, you **must** follow this process:
1.  **Identify the Centralized Pattern:** Look for a common cause behind multiple failures. Do not patch symptoms individually.
2.  **Find the Root Architectural Violation:** Identify the underlying issue (e.g., a violation of SRP, DRY).
3.  **Create or Fix a Centralized Solution:** Develop a single utility, service, or pattern to resolve the root cause.
4.  **Apply the Fix:** Refactor all affected code to use the new centralized solution.

---

## **Part 8: DevOps & Operations**

### **8.1. Source Control & CI/CD**

*   **Gitflow** is our branching strategy.
*   All work is done in **Pull Requests**, requiring one peer review.
*   The **CI pipeline** (GitHub Actions) must pass before merging.

### **8.2. Observability & Monitoring**

*   **Structured Logging:** All services **must** use **Serilog** configured for structured JSON output with a **Correlation ID**.
*   **Health Checks:** The API **must** expose a deep `/health` endpoint that verifies connectivity to the database and Redis cache.
*   **Metrics:** The system **must** be instrumented with **OpenTelemetry** to track:
    *   **API Metrics:** Request rates, error rates, latency (P95, P99).
    *   **System Metrics:** CPU and memory usage.
    *   **Dependency Metrics:** Database query times, cache hit/miss ratios, background job queue depth.

---

## **Part 9: Common Development Commands**

### **Build & Run**
`dotnet build backend/ServiceBridge.sln`
`dotnet run --project backend/src/ServiceBridge.Api`

### **Testing**
`dotnet test backend/ServiceBridge.sln`

### **Database**
`dotnet ef migrations add <MigrationName> --project backend/src/ServiceBridge.Infrastructure --startup-project backend/src/ServiceBridge.Api`
`dotnet ef database update --project backend/src/ServiceBridge.Infrastructure --startup-project backend/src/ServiceBridge.Api`

### **Frontend**
`cd frontend/dashboard-app && npm install && npm start`
`cd frontend/scanner-app && npm install && npm start`