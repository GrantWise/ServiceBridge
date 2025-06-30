import { apiClient } from '@/features/shared/services/api/apiClient';
import { LoginRequest, LoginResponse, User, TokenValidationResponse } from '../types/auth.types';
import { TokenService } from './tokenService';

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      
      if (response.success && response.user) {
        // Token is now in httpOnly cookie, just store user data
        TokenService.setUser(response.user);
        // Don't store token in sessionStorage since it's in httpOnly cookie
      }
      
      return response;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as LoginResponse;
      }
      
      return {
        success: false,
        message: 'Network error occurred during login'
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await apiClient.get<User>('/auth/me');
      TokenService.setUser(user);
      return user;
    } catch (error: any) {
      // Only log errors that aren't 401 (unauthorized) since those are expected when not logged in
      if (error.response?.status !== 401) {
        console.error('Error fetching current user:', error);
      }
      return null;
    }
  }

  async validateToken(token: string): Promise<TokenValidationResponse> {
    try {
      const response = await apiClient.post<TokenValidationResponse>('/auth/validate', token);
      return response;
    } catch (error) {
      return {
        valid: false,
        message: 'Token validation failed'
      };
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = TokenService.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      // Note: Backend doesn't currently have refresh endpoint
      // This is a placeholder for when it's implemented
      console.warn('Token refresh not implemented on backend yet');
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout to clear httpOnly cookies
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear local data
      TokenService.clearAll();
    }
  }

  isAuthenticated(): boolean {
    // With httpOnly cookies, we can't check authentication client-side
    // This method is mainly used by the auth store which handles server validation
    const user = TokenService.getUser();
    return !!user;
  }

  hasRole(requiredRole: string): boolean {
    const user = TokenService.getUser();
    if (!user) return false;

    const roleHierarchy = {
      'Viewer': 1,
      'Operator': 2,
      'Manager': 3,
      'Admin': 4
    };

    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userRoleLevel >= requiredRoleLevel;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }
}

export const authService = new AuthService();