# ServiceBridge Audit Template

*   **Audit Version:** 1.0
*   **Date:** YYYY-MM-DD
*   **Handbook Version:** 1.0
*   **Component Audited:** [e.g., New Reporting Service, Authentication Flow Refactor, Dashboard UI]

---

## **Instructions for Use**

This template is designed to be flexible. Not all sections of the Engineering Handbook apply to every change. Before starting an audit, **scope the review** to only the relevant sections.

1.  **Identify Component Type:** Determine the nature of the work (e.g., new backend service, frontend feature, CI/CD change).
2.  **Select Relevant Sections:** In the table below, focus only on the parts of the handbook that apply to your component.
3.  **Mark as N/A:** For all sections that do not apply, mark their status as `N/A`. This shows they were considered and deemed not applicable, rather than being overlooked.

### **Example Scenarios:**

*   **For a new Backend Service:** Focus on Parts 2, 3, 4, 6, 7, and 8. Mark Part 5 (Frontend) as `N/A`.
*   **For a new Frontend Application:** Focus on Parts 5, 6 (client-side security), 7, and 8. Mark Parts 2, 3, and 4 as `N/A`.
*   **For a change to the CI/CD pipeline:** Focus on Part 8. Mark all other sections as `N/A`.

### **Definitions**

*   **Recommendation Levels:**
    *   **[Required]**: Must be fixed. Blocks release.
    *   **[Recommended]**: Should be fixed. Can be fast-followed if necessary.
    *   **[Suggested]**: Good to have. Can be added to the backlog.
*   **Status Levels:**
    *   **`Compliant`**: Adheres to the handbook.
    *   **`Partially Compliant`**: Some aspects adhere, but there are gaps.
    *   **`Non-Compliant`**: Does not adhere to the handbook.
    *   **`N/A`**: Not applicable to the component being audited.

---

## **Audit Findings**

### **Part 2: System Architecture**

| Requirement | Status | Findings & Context | Recommendation |
| :--- | :--- | :--- | :--- |
| **2.1. Clean Architecture** | | | |
| **2.2. Core Backend Patterns** | | | |
| **2.4. Production Architecture** | | | |

### **Part 3: Future-Proofing & SaaS Strategy**

| Requirement | Status | Findings & Context | Recommendation |
| :--- | :--- | :--- | :--- |
| **3.2. Multi-Tenancy (`TenantId`)** | | | |

### **Part 4: Backend Development Standards**

| Requirement | Status | Findings & Context | Recommendation |
| :--- | :--- | :--- | :--- |
| **4.4. Structured Logging** | | | |
| **4.4. Correlation IDs** | | | |

### **Part 6: Security & Compliance**

| Requirement | Status | Findings & Context | Recommendation |
| :--- | :--- | :--- | :--- |
| **6.1. Authorization** | | | |
| **6.2. Secret Management** | | | |
| **6.2. Compliance & Data Privacy** | | | |

### **Part 8: DevOps & Operations**

| Requirement | Status | Findings & Context | Recommendation |
| :--- | :--- | :--- | :--- |
| **8.2. Continuous Integration** | | | |
| **8.4. Health Checks** | | | |
