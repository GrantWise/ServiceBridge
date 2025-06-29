import { create } from 'zustand';
import { AuthState, User } from '../types/auth.types';
import { authService } from '../services/authService';
import { TokenService } from '../services/tokenService';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.user && response.token) {
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
          isLoading: false,
          error: null
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

  logout: () => {
    authService.logout();
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
      // Check if we have a token and it's not expired
      const token = TokenService.getToken();
      const cachedUser = TokenService.getUser();
      
      if (!token || TokenService.isTokenExpired(token)) {
        // Token expired or missing, clear everything
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return;
      }

      // If we have a valid token and cached user, use them
      if (cachedUser) {
        set({
          user: cachedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        // Optionally verify with server in background
        authService.getCurrentUser().then(user => {
          if (user) {
            set({ user });
          }
        });
      } else {
        // No cached user, fetch from server
        const user = await authService.getCurrentUser();
        
        if (user) {
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          // Server says user is invalid, clear everything
          authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      }
    } catch (error) {
      // On error, clear auth state
      authService.logout();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication check failed'
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  }
}));

// Convenience hooks for specific auth checks
export const useAuth = () => {
  const auth = useAuthStore();
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