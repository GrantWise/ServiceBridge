import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { sanitizeErrorMessage as sanitizeError } from '@/utils/security/sanitizer';

export interface IApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
  correlationId?: string;
}

export interface IErrorContext {
  operation?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: Array<{ error: Error; context?: IErrorContext }> = [];
  private isOnline = navigator.onLine;

  private constructor() {
    this.setupGlobalHandlers();
    this.setupNetworkListeners();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(new Error(event.reason?.message || 'Unhandled promise rejection'), {
        operation: 'unhandledRejection',
      });
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleError(event.error || new Error(event.message), {
        operation: 'globalError',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private flushErrorQueue(): void {
    while (this.errorQueue.length > 0) {
      const item = this.errorQueue.shift();
      if (item) {
        this.logError(item.error, item.context);
      }
    }
  }

  handleError(error: Error | AxiosError | unknown, context?: IErrorContext): void {
    const normalizedError = this.normalizeError(error);
    const apiError = this.extractApiError(error);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error Handler:', {
        error: normalizedError,
        apiError,
        context,
        stack: normalizedError.stack,
      });
    }

    // Show user-friendly toast notification
    this.showErrorNotification(apiError || normalizedError, context);

    // Log error (queue if offline)
    if (this.isOnline) {
      this.logError(normalizedError, context);
    } else {
      this.errorQueue.push({ error: normalizedError, context });
    }
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    
    // Check for Axios network errors
    if (this.isAxiosError(error) && error.code === 'ERR_NETWORK') {
      const networkError = new Error('Network Error: Cannot connect to server');
      (networkError as any).code = 'NETWORK_ERROR';
      return networkError;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (typeof error === 'object' && error !== null) {
      return new Error(JSON.stringify(error));
    }
    
    return new Error('An unknown error occurred');
  }

  private extractApiError(error: unknown): IApiError | null {
    if (this.isAxiosError(error)) {
      // Handle network errors (no response)
      if (error.code === 'ERR_NETWORK' && !error.response) {
        return {
          message: 'Cannot connect to server. Please ensure the backend is running.',
          code: 'NETWORK_ERROR',
          statusCode: 0,
          details: { originalError: error.message },
        };
      }
      
      // Handle API response errors
      if (error.response?.data) {
        const data = error.response.data;
        
        return {
          message: data.message || data.error || 'An error occurred',
          code: data.code || data.errorCode,
          statusCode: error.response.status,
          details: data.details || data.errors,
          timestamp: data.timestamp,
          path: data.path,
          correlationId: data.correlationId,
        };
      }
    }
    
    return null;
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return (
      error !== null &&
      typeof error === 'object' &&
      'isAxiosError' in error &&
      error.isAxiosError === true
    );
  }

  private showErrorNotification(error: IApiError | Error, context?: IErrorContext): void {
    const message = this.getUserFriendlyMessage(error, context);
    
    // Sanitize the message to ensure no sensitive data is exposed
    const sanitizedMessage = sanitizeError(error instanceof Error ? error : new Error(message));
    
    toast.error(sanitizedMessage, {
      duration: 5000,
      position: 'top-right',
      action: {
        label: 'Dismiss',
        onClick: () => toast.dismiss(),
      },
    });
  }

  private getUserFriendlyMessage(error: IApiError | Error, context?: IErrorContext): string {
    // Handle specific error codes
    if ('code' in error && error.code) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return 'Cannot connect to server. Please ensure the backend is running on http://localhost:5196';
        case 'AUTH_EXPIRED':
          return 'Your session has expired. Please log in again.';
        case 'VALIDATION_ERROR':
          return error.message || 'Please check your input and try again.';
        case 'PERMISSION_DENIED':
          return 'You do not have permission to perform this action.';
        case 'NOT_FOUND':
          return 'The requested resource was not found.';
        case 'RATE_LIMIT':
          return 'Too many requests. Please try again later.';
        default:
          break;
      }
    }

    // Handle HTTP status codes
    if ('statusCode' in error && error.statusCode) {
      switch (error.statusCode) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication required. Please log in.';
        case 403:
          return 'Access denied. You do not have permission.';
        case 404:
          return 'The requested resource was not found.';
        case 429:
          return 'Too many requests. Please slow down.';
        case 500:
          return 'Server error. Our team has been notified.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          if (error.statusCode >= 500) {
            return 'A server error occurred. Please try again later.';
          }
      }
    }

    // Handle context-specific messages
    if (context?.operation) {
      switch (context.operation) {
        case 'productLookup':
          return 'Unable to find product. Please check the code.';
        case 'scanSubmit':
          return 'Failed to submit scan. Please try again.';
        case 'signalrConnection':
          return 'Real-time connection lost. Some features may be unavailable.';
        default:
          break;
      }
    }

    // Return the error message or a generic message
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  private async logError(error: Error, context?: IErrorContext): Promise<void> {
    try {
      // In production, this would send to an error tracking service
      // Example: await errorTrackingService.log({ error, context, timestamp: new Date() });
      
      // For now, just log to console
      console.error('Error logged:', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Public method to manually log errors
  logCustomError(message: string, details?: Record<string, unknown>): void {
    const error = new Error(message);
    this.handleError(error, { metadata: details });
  }

  // Method to clear error queue
  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();