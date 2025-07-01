# ServiceBridge Remediation Action Plan

*   **Version:** 1.0
*   **Date:** 2025-07-01
*   **Related Document:** `audit_and_remediation_plan.md`

---

## **Objective**

This document provides a developer-focused, step-by-step guide for implementing the **[Required]** and **[Recommended]** changes identified in the codebase audit. The goal is to align the ServiceBridge PoC with the standards in the `engineering_handbook.md` in a low-risk, structured manner.

## **Phase 1: Required Changes (Critical Priority)

These changes address critical security gaps and must be completed first.

### **Action Item 1.1: Implement Secure Secret Management**

*   **Objective:** Remove the hardcoded JWT secret key from the `appsettings.json` file and store it securely for local development.
*   **Why:** Storing secrets in configuration files is a critical security vulnerability and is explicitly forbidden by the handbook (Section 6.2). The .NET Secret Manager is the standard tool for handling secrets during local development.

#### **Step-by-Step Guide:**

1.  **Initialize User Secrets:** Open a terminal in the `backend/src/ServiceBridge.Api` directory and run the command: `dotnet user-secrets init`. This will create a `secrets.json` file in your local user profile, safely outside the project repository.
2.  **Set the Secret:** Run the following command to move the JWT secret into the secret store. (The value should be a long, random, high-entropy string, not the placeholder one).
    ```bash
    dotnet user-secrets set "Jwt:SecretKey" "Your_New_Super_Long_And_Secure_Secret_Key_Here"
    ```
3.  **Remove from Configuration:** Delete the `SecretKey` line from `backend/src/ServiceBridge.Api/appsettings.json` and `appsettings.Development.json`.
4.  **Verify Code:** The existing code in `Program.cs` uses `builder.Configuration.GetSection("Jwt")`. This code automatically reads from user secrets in a development environment, so no changes to the C# code are necessary. The configuration system seamlessly merges `appsettings.json` with user secrets.

#### **Verification:**

*   Run the application. Attempt to log in. The authentication process should work exactly as before, proving the application is now loading the secret from the secure store.

---

## **Phase 2: Recommended Changes (High Priority)**

These changes are foundational for future scalability, maintainability, and observability. They should be addressed after the critical security fixes are complete.

### **Action Item 2.1: Establish Multi-Tenancy Foundation**

*   **Objective:** Introduce a `TenantId` to the data model and enforce tenant isolation at the database level.
*   **Why:** This is the single most important step for future-proofing the application for a SaaS environment, as mandated by the handbook (Section 3.2). It prevents accidental data leakage between tenants.

#### **Step-by-Step Guide:**

1.  **Update Domain Entities:** Add a `public Guid TenantId { get; set; }` property to the core entities that require isolation, such as `Product`, `ScanTransaction`, and `AuditEntry`.
2.  **Create Tenant Service (Placeholder):**
    *   In the `ServiceBridge.Application` project, create an interface `ITenantService` with a single method: `Guid GetTenantId();`.
    *   In the `ServiceBridge.Infrastructure` project, create a class `TenantService` that implements `ITenantService`. For now, this class can return a hardcoded `Guid` (e.g., `return new Guid("...");`).
    *   Register this service in `DependencyInjection.cs` as a scoped service.
3.  **Implement Global Query Filter:**
    *   Inject `ITenantService` into the `ServiceBridgeDbContext`.
    *   In the `OnModelCreating` method of the `DbContext`, add a global query filter for each tenant-aware entity. Example: `modelBuilder.Entity<Product>().HasQueryFilter(p => p.TenantId == _tenantService.GetTenantId());`
4.  **Create Database Migration:** Run `dotnet ef migrations add AddTenantId` to generate a new migration that will add the `TenantId` column to the relevant tables.
5.  **Update Database:** Run `dotnet ef database update` to apply the migration.

#### **Verification:**

*   After applying the migration, inspect the database schema to confirm the `TenantId` columns exist.
*   Run the application. All existing functionality should work as before. The query filter will be transparently applying the default `TenantId` to all queries.

### **Action Item 2.2: Implement Structured Logging**

*   **Objective:** Replace the default logger with Serilog to output structured, machine-readable JSON logs.
*   **Why:** Structured logs are essential for effective querying and analysis in any modern logging platform, as required by the handbook (Section 4.4).

#### **Step-by-Step Guide:**

1.  **Add Packages:** Add the `Serilog.AspNetCore`, `Serilog.Sinks.Console`, and `Serilog.Formatting.Json` NuGet packages to the `ServiceBridge.Api` project.
2.  **Configure `Program.cs`:**
    *   Remove the default `builder.Logging` configuration.
    *   Add `builder.Host.UseSerilog(...)` before `builder.Build()`.
    *   Inside the `UseSerilog` call, configure a new `LoggerConfiguration`. Set it to `WriteTo.Console()` using a `new JsonFormatter()`.
    *   Ensure you also call `ReadFrom.Configuration(context.Configuration)` to allow `appsettings.json` to override log levels.

#### **Verification:**

*   Run the application. The console output should now be in JSON format, with distinct fields for `Timestamp`, `Level`, `MessageTemplate`, and properties.

### **Action Item 2.3: Add Correlation IDs to Requests**

*   **Objective:** Create and attach a unique correlation ID to every incoming request and include it in all log messages.
*   **Why:** Correlation IDs are fundamental for tracing a single operation's lifecycle through the entire system, a core tenet of observability (Handbook Section 4.4).

#### **Step-by-Step Guide:**

1.  **Create Middleware:** In the `ServiceBridge.Api` project, create a new middleware class (e.g., `CorrelationIdMiddleware`).
2.  **Implement Middleware Logic:**
    *   In the `InvokeAsync` method, check the `HttpContext.Request.Headers` for a `X-Correlation-ID` header.
    *   If the header exists, use its value. If not, generate a new `Guid`.
    *   Use Serilog's `LogContext.PushProperty("CorrelationId", ...)` to add the ID to the logging context for the duration of the request.
    *   Add the correlation ID to the `HttpContext.Response.Headers` so the client can see it.
3.  **Register Middleware:** In `Program.cs`, register the middleware using `app.UseMiddleware<CorrelationIdMiddleware>()`. This registration must be placed **early** in the pipeline, before the controllers are mapped.

#### **Verification:**

*   Run the application and make an API call using a tool like Postman or curl.
*   Check the console logs; each JSON log entry for that request should now contain a `CorrelationId` property.
*   Check the API response headers; a `X-Correlation-ID` header should be present.

### **Action Item 2.4: Create a CI Pipeline**

*   **Objective:** Create a basic Continuous Integration (CI) pipeline using GitHub Actions.
*   **Why:** Automating the build and test process on every pull request is a foundational DevOps practice that ensures code quality and prevents regressions (Handbook Section 8.2).

#### **Step-by-Step Guide:**

1.  **Create Workflow File:** In the root of the repository, create a directory path `.github/workflows`. Inside, create a new file named `build-and-test.yml`.
2.  **Define Workflow:**
    *   **Trigger:** Configure the workflow to run `on: [pull_request]`.
    *   **Job:** Define a single job (e.g., `build-and-test`).
    *   **Steps:**
        1.  Use the `actions/checkout@v3` action to check out the code.
        2.  Use the `actions/setup-dotnet@v3` action to set up the correct .NET SDK version.
        3.  Add a step to run `dotnet build backend/ServiceBridge.sln`.
        4.  Add a final step to run `dotnet test backend/ServiceBridge.sln`.

#### **Verification:**

*   Create a new pull request. The GitHub UI should show the "build-and-test" action running automatically. The action should complete successfully.
