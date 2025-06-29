# Authentication Service - httpOnly Cookie Implementation

## Current Implementation (Phase 2.1)
Currently, the auth tokens are stored in sessionStorage for the following reasons:
- More secure than localStorage (cleared when tab closes)
- Allows us to implement the auth flow without backend changes
- Provides a working authentication system for development

## Future Implementation (Phase 2.2.1)
To properly implement httpOnly cookies, the following backend changes are required:

### Backend Requirements:
1. **Login Endpoint** (`POST /auth/login`):
   - Set access token as httpOnly cookie: `Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict; Path=/`
   - Set refresh token as httpOnly cookie: `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh`
   - Return user data and expiry time (no tokens in response body)

2. **Refresh Endpoint** (`POST /auth/refresh`):
   - Read refresh token from cookie (not request body)
   - Set new tokens as httpOnly cookies
   - Return expiry time only

3. **Logout Endpoint** (`POST /auth/logout`):
   - Clear cookies: `Set-Cookie: access_token=; Max-Age=0; Path=/`
   - Clear refresh cookie: `Set-Cookie: refresh_token=; Max-Age=0; Path=/auth/refresh`

4. **All API Endpoints**:
   - Read auth token from cookies instead of Authorization header
   - Support CORS with credentials: `Access-Control-Allow-Credentials: true`

### Frontend Changes Required:
1. Update axios to include credentials: `withCredentials: true`
2. Remove token storage/retrieval from authService
3. Remove Authorization header from requests
4. Update CORS configuration

### Security Benefits:
- Tokens cannot be accessed by JavaScript (prevents XSS attacks)
- Automatic inclusion in requests (when withCredentials is set)
- Can be tied to CSRF tokens for additional security
- Secure flag ensures HTTPS-only transmission

## Implementation Timeline:
This will be implemented when backend support is available. The current sessionStorage approach provides a reasonable security level for development while maintaining the same API surface.