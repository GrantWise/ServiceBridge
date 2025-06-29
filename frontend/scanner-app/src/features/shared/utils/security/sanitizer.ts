import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitization utilities for user input
 * Prevents XSS attacks by cleaning potentially malicious content
 */

// Configure DOMPurify with strict settings
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br'],
  ALLOWED_ATTR: ['class'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
};

/**
 * Sanitize HTML content for display
 */
export function sanitizeHtml(dirty: string): string {
  try {
    const clean = DOMPurify.sanitize(dirty, purifyConfig);
    
    if (clean !== dirty) {
      console.warn('HTML content was sanitized', {
        original: dirty.substring(0, 100),
        sanitized: clean.substring(0, 100),
      });
    }
    
    return clean;
  } catch (error) {
    console.error('Failed to sanitize HTML', error);
    return '';
  }
}

/**
 * Sanitize plain text by removing all HTML
 */
export function sanitizeText(dirty: string): string {
  try {
    // Remove all HTML tags and decode entities
    const clean = DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
    return clean;
  } catch (error) {
    console.error('Failed to sanitize text', error);
    return '';
  }
}

/**
 * Sanitize product code input
 * Format: 3 letters + 3 numbers (e.g., ABC123)
 */
export function sanitizeProductCode(input: string): string {
  // Remove any non-alphanumeric characters
  const cleaned = input.replace(/[^A-Za-z0-9]/g, '');
  
  // Convert to uppercase
  const uppercase = cleaned.toUpperCase();
  
  // Limit to 6 characters
  return uppercase.substring(0, 6);
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number {
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : input;
  }
  
  // Remove non-numeric characters except decimal point and minus
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: string): string {
  // Basic email sanitization - remove dangerous characters
  return input
    .toLowerCase()
    .trim()
    .replace(/[<>'"]/g, '');
}

/**
 * Sanitize URL parameters
 */
export function sanitizeUrlParam(param: string): string {
  // Encode special characters to prevent injection
  return encodeURIComponent(param);
}

/**
 * Sanitize JSON input
 */
export function sanitizeJson<T>(input: string): T | null {
  try {
    // Parse JSON to validate structure
    const parsed = JSON.parse(input);
    
    // Re-stringify to remove any potentially malicious content
    return JSON.parse(JSON.stringify(parsed));
  } catch (_error) {
    console.warn('Invalid JSON input', { input: input.substring(0, 100) });
    return null;
  }
}

/**
 * Create a sanitized error message (no sensitive data)
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove file paths, stack traces, and other sensitive info
    const message = error.message
      .replace(/\/[^\s]+/g, '[path]') // Remove file paths
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]') // Remove IPs
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]'); // Remove emails
    
    return message;
  }
  
  return 'An error occurred';
}

/**
 * Validate and sanitize file names
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts and dangerous characters
  return fileName
    .replace(/[/\\]/g, '') // Remove slashes
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/[<>:"|?*]/g, '') // Remove invalid characters
    .trim();
}

/**
 * Strip script tags and event handlers from content
 */
export function stripScripts(content: string): string {
  return DOMPurify.sanitize(content, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
  });
}