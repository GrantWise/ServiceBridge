import { logger } from './logger';

/**
 * Request signing service for sensitive operations
 * Provides integrity verification for critical requests
 */
class RequestSigner {
  private static instance: RequestSigner;
  private readonly SIGNATURE_HEADER = 'X-Request-Signature';
  private readonly TIMESTAMP_HEADER = 'X-Request-Timestamp';
  private readonly NONCE_HEADER = 'X-Request-Nonce';
  private readonly SIGNATURE_ALGORITHM = 'SHA-256';

  private constructor() {}

  static getInstance(): RequestSigner {
    if (!RequestSigner.instance) {
      RequestSigner.instance = new RequestSigner();
    }
    return RequestSigner.instance;
  }

  /**
   * Sign a request for sensitive operations
   */
  async signRequest(
    method: string,
    url: string,
    body?: unknown,
    userId?: string
  ): Promise<Record<string, string>> {
    const timestamp = Date.now().toString();
    const nonce = this.generateNonce();
    
    // Create signature payload
    const payload = this.createPayload(method, url, body, timestamp, nonce, userId);
    
    // Generate signature
    const signature = await this.generateSignature(payload);
    
    logger.debug('Request signed', {
      method,
      url,
      timestamp,
      nonce,
    });
    
    return {
      [this.SIGNATURE_HEADER]: signature,
      [this.TIMESTAMP_HEADER]: timestamp,
      [this.NONCE_HEADER]: nonce,
    };
  }

  /**
   * Verify if an operation should be signed
   */
  shouldSignRequest(method: string, url: string): boolean {
    // Sign all state-changing operations
    const sensitiveM

 = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (sensitiveM.includes(method.toUpperCase())) {
      return true;
    }
    
    // Sign specific sensitive endpoints
    const sensitiveEndpoints = [
      '/auth/login',
      '/auth/logout',
      '/auth/refresh',
      '/products/*/scan',
      '/users/*',
      '/audit/*',
    ];
    
    return sensitiveEndpoints.some(pattern => 
      this.matchesPattern(url, pattern)
    );
  }

  /**
   * Create payload for signing
   */
  private createPayload(
    method: string,
    url: string,
    body: unknown,
    timestamp: string,
    nonce: string,
    userId?: string
  ): string {
    const parts = [
      method.toUpperCase(),
      url,
      timestamp,
      nonce,
    ];
    
    if (userId) {
      parts.push(userId);
    }
    
    if (body) {
      // Add body hash to signature
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      parts.push(bodyString);
    }
    
    return parts.join('\n');
  }

  /**
   * Generate cryptographic signature
   */
  private async generateSignature(payload: string): Promise<string> {
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    
    // Generate signature using Web Crypto API
    const hashBuffer = await crypto.subtle.digest(this.SIGNATURE_ALGORITHM, data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a cryptographic nonce
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if URL matches a pattern
   */
  private matchesPattern(url: string, pattern: string): boolean {
    const regex = pattern
      .replace(/\*/g, '[^/]+')
      .replace(/\//g, '\\/');
    
    return new RegExp(`^${regex}$`, 'i').test(url);
  }

  /**
   * Validate request age (prevent replay attacks)
   */
  isRequestExpired(timestamp: string, maxAgeMs = 5 * 60 * 1000): boolean {
    const requestTime = parseInt(timestamp, 10);
    const now = Date.now();
    
    if (isNaN(requestTime)) {
      return true;
    }
    
    return Math.abs(now - requestTime) > maxAgeMs;
  }
}

// Export singleton instance
export const requestSigner = RequestSigner.getInstance();