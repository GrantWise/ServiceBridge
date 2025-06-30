import { create } from 'zustand';
import { AuthState, User } from '../types/auth.types';
import { authService } from '../services/authService';
import { useEffect } from 'react';

interface AuthStore extends AuthState {
  authInitialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  handleUnauthorized: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  authInitialized: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.user) {
        // Update local state
        set({
          user: response.user,
          token: response.token || 'cookie-based', // Placeholder since token is in httpOnly cookie
          isAuthenticated: true,
          isLoading: false,
          error: null,
          authInitialized: true
        });

        
        return { success: true, message: response.message };
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: response.message
        });
        
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during login';
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage
      });
      
      return { success: false, message: errorMessage };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    await authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      // With httpOnly cookies, we can't check token expiry client-side
      // Just try to get current user from server
      const user = await authService.getCurrentUser();
      
      if (user) {
        set({
          user,
          token: 'cookie-based', // Placeholder since token is in httpOnly cookie
          isAuthenticated: true,
          isLoading: false,
          error: null,
          authInitialized: true
        });

      } else {
        // Server says user is invalid, clear everything
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          authInitialized: true
        });
      }
    } catch (error) {
      // Only clear auth state if there's no existing user
      // This prevents clearing auth on network errors after successful login
      const currentState = get();
      if (!currentState.user) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          authInitialized: true
        });
      } else {
        // User exists but auth check failed - probably a network issue
        // Keep the user logged in but stop loading
        set({
          isLoading: false,
          error: null,
          authInitialized: true
        });
      }
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  handleUnauthorized: () => {
    // Clear auth state and redirect to login
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    
    // Redirect to login page
    window.location.href = '/login';
  }
}));

// Hook to set up auth event listeners
export const useAuthEvents = () => {
  const handleUnauthorized = useAuthStore(state => state.handleUnauthorized);
  
  useEffect(() => {
    const handleUnauthorizedEvent = () => {
      handleUnauthorized();
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
    };
  }, [handleUnauthorized]);
};

// Convenience hooks for specific auth checks
export const useAuth = () => {
  const auth = useAuthStore();
  
  // Set up auth event listeners
  useAuthEvents();
  
  return auth;
};

export const useUser = () => {
  const user = useAuthStore(state => state.user);
  return user;
};

export const useHasRole = (role: string) => {
  const user = useAuthStore(state => state.user);
  return user ? authService.hasRole(role) : false;
};

export const useHasAnyRole = (roles: string[]) => {
  const user = useAuthStore(state => state.user);
  return user ? authService.hasAnyRole(roles) : false;
};