import { RATE_LIMIT_CONFIG } from '../../../config/security';
import { logger } from './logger';

interface IRateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Client-side rate limiter to prevent API abuse
 * This complements server-side rate limiting
 */
class RateLimiter {
  private static instance: RateLimiter;
  private limits: Map<string, IRateLimitEntry> = new Map();
  private cleanupInterval?: number;

  private constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if a request should be allowed
   */
  checkLimit(endpoint: string): boolean {
    const now = Date.now();
    const config = this.getConfigForEndpoint(endpoint);
    const key = this.getKeyForEndpoint(endpoint);
    
    const entry = this.limits.get(key);
    
    if (!entry || entry.resetTime <= now) {
      // Create new entry or reset expired one
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }
    
    if (entry.count >= config.maxRequests) {
      const remainingTime = Math.ceil((entry.resetTime - now) / 1000);
      logger.warn('Rate limit exceeded', {
        endpoint,
        limit: config.maxRequests,
        window: config.windowMs,
        remainingTime,
      });
      return false;
    }
    
    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for an endpoint
   */
  getRemainingRequests(endpoint: string): number {
    const now = Date.now();
    const config = this.getConfigForEndpoint(endpoint);
    const key = this.getKeyForEndpoint(endpoint);
    const entry = this.limits.get(key);
    
    if (!entry || entry.resetTime <= now) {
      return config.maxRequests;
    }
    
    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get reset time for an endpoint
   */
  getResetTime(endpoint: string): number {
    const key = this.getKeyForEndpoint(endpoint);
    const entry = this.limits.get(key);
    
    if (!entry || entry.resetTime <= Date.now()) {
      return 0;
    }
    
    return entry.resetTime;
  }

  /**
   * Reset limits for a specific endpoint
   */
  resetEndpoint(endpoint: string): void {
    const key = this.getKeyForEndpoint(endpoint);
    this.limits.delete(key);
    logger.info('Rate limit reset for endpoint', { endpoint });
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.limits.clear();
    logger.info('All rate limits reset');
  }

  /**
   * Get configuration for an endpoint
   */
  private getConfigForEndpoint(endpoint: string): { maxRequests: number; windowMs: number } {
    // Check if endpoint has strict limits
    for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIG.strictEndpoints)) {
      if (this.matchesPattern(endpoint, pattern)) {
        return config;
      }
    }
    
    // Use default limits
    return {
      maxRequests: RATE_LIMIT_CONFIG.maxRequests,
      windowMs: RATE_LIMIT_CONFIG.windowMs,
    };
  }

  /**
   * Get key for storing rate limit data
   */
  private getKeyForEndpoint(endpoint: string): string {
    // Normalize endpoint for consistent keys
    const normalized = endpoint
      .toLowerCase()
      .replace(/\/+/g, '/') // Remove duplicate slashes
      .replace(/\/$/, ''); // Remove trailing slash
    
    // Replace dynamic segments with placeholders
    return normalized.replace(/\/[a-f0-9-]+/gi, '/*');
  }

  /**
   * Check if endpoint matches a pattern
   */
  private matchesPattern(endpoint: string, pattern: string): boolean {
    const regex = pattern
      .replace(/\*/g, '[^/]+') // Replace * with non-slash characters
      .replace(/\//g, '\\/'); // Escape slashes
    
    return new RegExp(`^${regex}$`, 'i').test(endpoint);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetTime <= now) {
        this.limits.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup', { entriesRemoved: cleaned });
    }
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();

/**
 * Hook for using rate limiter in components
 */
export function useRateLimiter(endpoint: string) {
  return {
    checkLimit: () => rateLimiter.checkLimit(endpoint),
    remaining: rateLimiter.getRemainingRequests(endpoint),
    resetTime: rateLimiter.getResetTime(endpoint),
    reset: () => rateLimiter.resetEndpoint(endpoint),
  };
}