/**
 * Security configuration for the application
 */

/**
 * Content Security Policy directives
 * These should be set by the server in production
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"], // unsafe-eval and unsafe-inline needed for Vite in dev
  'style-src': ["'self'", "'unsafe-inline'"], // unsafe-inline needed for Tailwind
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'"],
  'connect-src': [
    "'self'",
    'http://localhost:5196', // API URL
    'ws://localhost:5196', // SignalR WebSocket
    'wss://localhost:5196', // SignalR Secure WebSocket
    'http://localhost:5173', // Vite dev server
    'ws://localhost:5173', // Vite HMR websocket
  ],
  'object-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

/**
 * Security headers that should be set by the server
 * Listed here for documentation and testing
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Trusted domains for external resources
 */
export const TRUSTED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  // Add production domains here
];

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  // Maximum requests per window
  maxRequests: 100,
  // Time window in milliseconds
  windowMs: 60 * 1000, // 1 minute
  // Endpoints with stricter limits
  strictEndpoints: {
    '/auth/login': { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
    '/auth/refresh': { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
    '/products/*/scan': { maxRequests: 30, windowMs: 60 * 1000 }, // 30 per minute
  },
};

/**
 * Generate nonce for CSP
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Check if a URL is trusted
 */
export function isTrustedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return TRUSTED_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize URL for redirects
 */
export function sanitizeRedirectUrl(url: string, defaultUrl = '/'): string {
  // Only allow relative URLs or trusted domains
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }
  
  if (isTrustedUrl(url)) {
    return url;
  }
  
  return defaultUrl;
}