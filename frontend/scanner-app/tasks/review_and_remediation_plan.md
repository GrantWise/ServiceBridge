# Scanner App: Code Review and Remediation Plan

## 1. Executive Summary

This document outlines the findings from a review of the `scanner-app` codebase. While the application has a strong foundation with a modern tech stack and good architectural patterns, several critical areas require attention to meet the project's standards for security, functionality, and quality.

This plan details the identified issues and the necessary steps for remediation.

## 2. Critical Issues

### 2.1. Authentication and Security

*   **Issue:** JWTs are stored in `sessionStorage`, which is vulnerable to XSS attacks.
*   **Remediation:** Modify the `authService` and backend to use `httpOnly` cookies for secure token storage, as documented in `frontend/scanner-app/src/features/auth/services/README.md`.

*   **Issue:** The user is hardcoded as `"Current User"` in `useScanner.ts`.
*   **Remediation:** Integrate the `useAuth` hook to retrieve the authenticated user's identity and pass it with the scan data.

### 2.2. Core Feature Implementation

*   **Issue:** The app lacks actual barcode scanning functionality.
*   **Remediation:** Integrate a library like `react-qr-reader` or a similar solution to enable barcode scanning via the device camera.

*   **Issue:** The offline queue does not automatically sync upon reconnection.
*   **Remediation:** Implement a robust synchronization mechanism in the `useOfflineQueue` hook that triggers automatically when the application comes back online.

*   **Issue:** The application is not a Progressive Web App (PWA).
*   **Remediation:** Create a `manifest.json` file and a service worker to enable PWA features, including offline access and the ability to "install" the app on a mobile device.

## 3. High-Priority Issues

### 3.1. Testing Coverage

*   **Issue:** The application has minimal test coverage, and existing tests are failing.
*   **Remediation:**
    1.  Fix the existing failing tests in `LoginForm.test.tsx` and `useScanner.test.tsx`.
    2.  Write unit tests for all critical components and hooks.
    3.  Add integration tests for key user flows, such as the entire scan submission process.

### 3.2. Business Logic and UI

*   **Issue:** The UI does not display calculated fields like "Days Cover Remaining" or "Reorder Point".
*   **Remediation:** Update the `ProductInfo` component to calculate and display these values when a product is looked up.

*   **Issue:** There is no way to view the audit trail for a product.
*   **Remediation:** Create a new component that fetches and displays the audit history for a selected product, likely in a modal or a separate view.

## 4. Recommendations

The following steps are recommended to bring the `scanner-app` up to the project's standards:

1.  **Address Security First:** Prioritize the move to `httpOnly` cookies and fix the hardcoded user issue.
2.  **Implement Core Features:** Add barcode scanning and robust offline synchronization.
3.  **Increase Test Coverage:** Fix existing tests and write new ones to ensure code quality and prevent regressions.
4.  **Complete UI Requirements:** Add the missing business logic displays to the UI.
