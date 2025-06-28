import { logger } from '@/services/error/logger';

/**
 * CSRF Protection Service
 * Manages CSRF tokens for state-changing operations
 */
class CsrfService {
  private static instance: CsrfService;
  private token: string | null = null;
  private readonly TOKEN_HEADER = 'X-CSRF-Token';
  private readonly TOKEN_META_NAME = 'csrf-token';

  private constructor() {
    this.loadToken();
  }

  static getInstance(): CsrfService {
    if (!CsrfService.instance) {
      CsrfService.instance = new CsrfService();
    }
    return CsrfService.instance;
  }

  /**
   * Load CSRF token from meta tag or generate one
   */
  private loadToken(): void {
    // First, try to get token from meta tag (set by server)
    const metaTag = document.querySelector(`meta[name="${this.TOKEN_META_NAME}"]`);
    if (metaTag) {
      this.token = metaTag.getAttribute('content');
      logger.info('CSRF token loaded from meta tag');
      return;
    }

    // If no server token, generate a client token
    // In production, this should come from the server
    this.token = this.generateToken();
    logger.info('CSRF token generated on client');
  }

  /**
   * Generate a cryptographically secure token
   */
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get current CSRF token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get CSRF header for requests
   */
  getHeader(): Record<string, string> {
    if (!this.token) {
      logger.warn('No CSRF token available');
      return {};
    }

    return {
      [this.TOKEN_HEADER]: this.token,
    };
  }

  /**
   * Refresh CSRF token (after login or on 403)
   */
  async refreshToken(): Promise<void> {
    try {
      // In production, this would fetch a new token from the server
      // For now, we'll generate a new one
      this.token = this.generateToken();
      logger.info('CSRF token refreshed');
      
      // Update meta tag if it exists
      const metaTag = document.querySelector(`meta[name="${this.TOKEN_META_NAME}"]`);
      if (metaTag) {
        metaTag.setAttribute('content', this.token);
      }
    } catch (error) {
      logger.error('Failed to refresh CSRF token', error);
    }
  }

  /**
   * Validate CSRF token in response (for double-submit cookie pattern)
   */
  validateResponse(responseToken: string | null): boolean {
    if (!this.token || !responseToken) {
      return false;
    }

    const isValid = this.token === responseToken;
    
    if (!isValid) {
      logger.warn('CSRF token validation failed');
    }

    return isValid;
  }

  /**
   * Clear CSRF token (on logout)
   */
  clearToken(): void {
    this.token = null;
    logger.info('CSRF token cleared');
  }
}

// Export singleton instance
export const csrfService = CsrfService.getInstance();

/**
 * Hook for using CSRF protection in components
 */
export function useCsrf() {
  return {
    token: csrfService.getToken(),
    getHeader: () => csrfService.getHeader(),
    refreshToken: () => csrfService.refreshToken(),
  };
}