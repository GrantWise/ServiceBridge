import axios from 'axios';
import { LoginRequest, LoginResponse, User, TokenValidationResponse } from '../types/auth.types';
import { TokenService } from './tokenService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7001';

class AuthService {
  private baseURL = `${API_BASE_URL}/api/v1/auth`;

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(`${this.baseURL}/login`, credentials);
      
      if (response.data.success && response.data.token && response.data.user) {
        TokenService.setToken(response.data.token);
        TokenService.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
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
      const token = TokenService.getToken();
      if (!token || TokenService.isTokenExpired(token)) {
        return null;
      }

      const response = await axios.get<User>(`${this.baseURL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const user = response.data;
      TokenService.setUser(user);
      return user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  async validateToken(token: string): Promise<TokenValidationResponse> {
    try {
      const response = await axios.post<TokenValidationResponse>(
        `${this.baseURL}/validate`, 
        token,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
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

  logout(): void {
    TokenService.clearAll();
  }

  isAuthenticated(): boolean {
    const token = TokenService.getToken();
    return !!(token && !TokenService.isTokenExpired(token));
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