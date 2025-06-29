import type { 
  LoginRequest, 
  LoginResponse, 
  User 
} from '../../../types/api';
import { authApi } from '../../shared/services/api';
import { logger } from '../../shared/services/logger';
import { errorHandler } from '../../shared/services/errorHandler';
import { signalRService } from '../../shared/services/signalr';

interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface IAuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: IAuthTokens | null;
}

class AuthService {
  private static instance: AuthService;
  private state: IAuthState = {
    isAuthenticated: false,
    user: null,
    tokens: null,
  };
  private refreshTimer?: number;
  private readonly TOKEN_REFRESH_MARGIN = 5 * 60 * 1000; // 5 minutes before expiry
  private readonly STORAGE_KEY = 'auth_session';
  private listeners: Set<(state: IAuthState) => void> = new Set();

  private constructor() {
    this.loadStoredSession();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: IAuthState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.state);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private loadStoredSession(): void {
    try {
      // In Phase 2.2.1, we'll move this to httpOnly cookies
      // For now, using sessionStorage which is more secure than localStorage
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return;
      }

      const session = JSON.parse(stored) as IAuthState;
      
      // Validate session hasn't expired
      if (session.tokens && session.tokens.expiresAt > Date.now()) {
        this.state = session;
        this.scheduleTokenRefresh();
        logger.info('Restored auth session', { 
          userId: session.user?.id,
          expiresIn: Math.round((session.tokens.expiresAt - Date.now()) / 1000)
        });
      } else {
        this.clearSession();
        logger.info('Stored session expired, cleared');
      }
    } catch (error) {
      logger.error('Failed to load stored session', error);
      this.clearSession();
    }
  }

  private saveSession(): void {
    try {
      // In Phase 2.2.1, this will be handled by httpOnly cookies
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      logger.error('Failed to save session', error);
    }
  }

  private clearSession(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      logger.info('Attempting login', { email: credentials.email });
      
      const response = await authApi.login(credentials);
      
      if (response.success) {
        // Backend returns expiresAt instead of expiresIn
        // Convert expiresAt string to timestamp if needed
        const expiresAt = response.expiresAt ? new Date(response.expiresAt).getTime() : Date.now() + (60 * 60 * 1000); // Default 1 hour
        
        this.state = {
          isAuthenticated: true,
          user: response.user,
          tokens: {
            accessToken: response.token,
            refreshToken: '', // Backend doesn't provide refresh tokens
            expiresAt,
          },
        };
        
        this.saveSession();
        // Don't schedule refresh since we don't have refresh tokens
        // this.scheduleTokenRefresh();
        this.notifyListeners();
        
        // Notify SignalR service about login
        try {
          await signalRService.onUserLogin();
        } catch (error) {
          logger.warn('Failed to notify SignalR service about login', { error: error instanceof Error ? error.message : String(error) });
        }
        
        logger.info('Login successful', { 
          userId: response.user.id,
          role: response.user.role 
        });
      }
      
      return response;
    } catch (error) {
      logger.error('Login failed', error);
      errorHandler.handleError(error, { operation: 'login' });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      logger.info('Logging out', { userId: this.state.user?.id });
      
      // Backend doesn't have logout endpoint, just clear local state
      // await authApi.logout();
      
      // Clear local state
      this.state = {
        isAuthenticated: false,
        user: null,
        tokens: null,
      };
      
      this.clearSession();
      this.notifyListeners();
      
      // Notify SignalR service about logout
      try {
        await signalRService.onUserLogout();
      } catch (error) {
        logger.warn('Failed to notify SignalR service about logout', { error: error instanceof Error ? error.message : String(error) });
      }
      
      logger.info('Logout successful');
    } catch (error) {
      logger.error('Logout error', error);
      // Still clear local state even if API call fails
      this.state = {
        isAuthenticated: false,
        user: null,
        tokens: null,
      };
      this.clearSession();
      this.notifyListeners();
    }
  }

  private scheduleTokenRefresh(): void {
    if (!this.state.tokens) {
      return;
    }
    
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Calculate when to refresh (5 minutes before expiry)
    const refreshIn = this.state.tokens.expiresAt - Date.now() - this.TOKEN_REFRESH_MARGIN;
    
    if (refreshIn > 0) {
      this.refreshTimer = window.setTimeout(() => {
        this.refreshToken();
      }, refreshIn);
      
      logger.debug('Token refresh scheduled', { 
        refreshIn: Math.round(refreshIn / 1000) 
      });
    } else {
      // Token expires soon, refresh immediately
      this.refreshToken();
    }
  }

  private async refreshToken(): Promise<void> {
    // Backend doesn't support refresh tokens
    logger.warn('No refresh token available - user must login again');
    // Don't call logout here to avoid infinite loop
    this.state = {
      isAuthenticated: false,
      user: null,
      tokens: null,
    };
    this.clearSession();
    this.notifyListeners();
    return;
    
    try {
      logger.info('Refreshing auth token');
      
      if (!this.state.tokens) {
        throw new Error('No tokens available for refresh');
      }
      
      const tokens = this.state.tokens as IAuthTokens; // TypeScript needs help here
      const response = await authApi.refreshToken({
        refreshToken: tokens.refreshToken,
      });
      
      if (response.success) {
        const expiresAt = Date.now() + (response.expiresIn * 1000);
        
        this.state.tokens = {
          accessToken: response.token,
          refreshToken: response.refreshToken,
          expiresAt,
        };
        
        this.saveSession();
        this.scheduleTokenRefresh();
        this.notifyListeners();
        
        logger.info('Token refresh successful');
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      logger.error('Token refresh failed', error);
      await this.logout();
    }
  }

  // Get current auth state
  getState(): IAuthState {
    return { ...this.state };
  }

  // Get current access token
  getAccessToken(): string | null {
    if (!this.state.tokens || this.state.tokens.expiresAt <= Date.now()) {
      return null;
    }
    return this.state.tokens.accessToken;
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    return this.state.user?.permissions?.includes(permission) ?? false;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.state.user?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.state.user?.role ?? '');
  }

  // Force token refresh
  async forceRefresh(): Promise<void> {
    await this.refreshToken();
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();