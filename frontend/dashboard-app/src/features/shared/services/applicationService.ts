import { signalrService } from './signalr/signalrService';
import { useAuthStore } from '@/features/auth/hooks/useAuth';

/**
 * Application Service - Orchestrates between different domain services
 * Follows SOLID principles by separating concerns and coordinating between services
 */
class ApplicationService {
  private initialized = false;
  private authUnsubscribe: (() => void) | null = null;
  private currentAuthState = false;

  constructor() {
    this.setupAuthSubscription();
  }

  private setupAuthSubscription() {
    if (this.initialized) return;

    // Subscribe to auth state changes directly from useAuth store
    this.authUnsubscribe = useAuthStore.subscribe((state) => {
      const isAuthenticated = state.isAuthenticated;
      if (isAuthenticated && !this.currentAuthState) {
        // User just logged in
        this.handleLoginSuccess();
      } else if (!isAuthenticated && this.currentAuthState) {
        // User just logged out
        this.handleLogout();
      }
      this.currentAuthState = isAuthenticated;
    });

    // Initialize with current auth state
    this.currentAuthState = useAuthStore.getState().isAuthenticated;
    if (this.currentAuthState) {
      this.handleLoginSuccess();
    }

    this.initialized = true;
  }

  private async handleLoginSuccess() {
    console.log('Application Service: Handling authentication success');
    await this.initializeSignalR();
  }

  private async handleLogout() {
    console.log('Application Service: Handling logout');
    await this.cleanupSignalR();
  }

  private async initializeSignalR() {
    try {
      console.log('Application Service: Initializing SignalR connection');
      await signalrService.connect();
      await signalrService.joinGroup('inventory');
      await signalrService.joinGroup('system');
    } catch (error) {
      console.error('Application Service: Failed to initialize SignalR:', error);
    }
  }

  private async cleanupSignalR() {
    try {
      console.log('Application Service: Cleaning up SignalR connection');
      await signalrService.disconnect();
    } catch (error) {
      console.error('Application Service: Error disconnecting SignalR:', error);
    }
  }

  // Public method to ensure initialization (can be called from App.tsx)
  initialize() {
    this.setupAuthSubscription();
  }

  // Cleanup method for when the app unmounts
  cleanup() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
    this.initialized = false;
  }
}

// Create singleton instance
export const applicationService = new ApplicationService();
export default applicationService;