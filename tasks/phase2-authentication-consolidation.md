# Phase 2: Authentication System Consolidation

## Priority: HIGH
**Goal**: Eliminate competing authentication systems and create single source of truth

## Tasks

### Task 2.1: Choose Primary Authentication System ✅
- [x] Analyze pros/cons of each auth system:
  - `useAuth` hook (features/auth/) - Zustand-based, simpler
  - `AuthenticationProvider` (shared/services/auth/) - Complex, over-engineered
  - `AuthenticationBusinessService` - Another layer of abstraction
- [x] Decision: Use `useAuth` as primary system (simpler, more React-focused)

### Task 2.2: Update apiClient to Use Unified Auth ✅
- [x] Remove dependency on `restAuthAdapter`
- [x] Configure apiClient to use `useAuth` for authentication checks
- [x] Ensure consistent `withCredentials: true` for all requests
- [x] Add proper error handling for 401/403 responses

### Task 2.3: Remove Redundant Authentication Services ✅
- [x] Remove `AuthenticationProvider` class
- [x] Remove `AuthenticationBusinessService` class
- [x] Remove `restAuthAdapter` and related adapters
- [x] Remove auth event bus and complex auth state management
- [x] Clean up unused imports and references

### Task 2.4: Update Components to Use useAuth ✅
- [x] Find all components using old auth systems
- [x] Replace with `useAuth` hook calls (updated useDashboardMetrics)
- [x] Update authentication checks and user access patterns
- [x] Ensure role-based access still works (delegated to authService)

### Task 2.5: Simplify Auth Flow ✅
- [x] Consolidate login/logout logic in useAuth
- [x] Remove duplicate authentication calls
- [x] Ensure single auth check on app start
- [x] Clean up auth-related utility functions

## Success Criteria
- [x] Single authentication system across entire app
- [x] No competing auth providers or state managers
- [x] Consistent authentication behavior
- [x] Simplified codebase with clear auth flow
- [x] All authentication features still work (login, logout, role checks)

## Files to Remove
- `frontend/dashboard-app/src/features/shared/services/auth/AuthenticationProvider.ts`
- `frontend/dashboard-app/src/features/shared/services/auth/AuthenticationBusinessService.ts`
- `frontend/dashboard-app/src/features/shared/services/auth/adapters/RestAuthenticationAdapter.ts`
- `frontend/dashboard-app/src/features/shared/services/auth/AuthEventBus.ts`
- `frontend/dashboard-app/src/features/shared/services/auth/AuthStateManager.ts`

## Files to Modify
- `frontend/dashboard-app/src/features/shared/services/api/apiClient.ts`
- `frontend/dashboard-app/src/App.tsx`
- All components using authentication