type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface ILogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  userId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

interface ILoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  bufferSize: number;
  flushInterval: number;
}

export class Logger {
  private static instance: Logger;
  private config: ILoggerConfig;
  private buffer: ILogEntry[] = [];
  private flushTimer?: number;

  private readonly logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private constructor(config?: Partial<ILoggerConfig>) {
    this.config = {
      minLevel: import.meta.env.DEV ? 'debug' : 'info',
      enableConsole: true,
      enableRemote: !import.meta.env.DEV,
      bufferSize: 50,
      flushInterval: 5000,
      ...config,
    };

    this.startFlushTimer();
  }

  static getInstance(config?: Partial<ILoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  private startFlushTimer(): void {
    if (this.config.flushInterval > 0) {
      this.flushTimer = window.setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.minLevel];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): ILogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: metadata?.context as string,
      userId: metadata?.userId as string,
      correlationId: metadata?.correlationId as string || this.generateCorrelationId(),
      metadata: this.sanitizeMetadata(metadata),
    };
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
    if (!metadata) {
      return {};
    }

    // Remove sensitive data
    const sanitized = { ...metadata };
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    
    Object.keys(sanitized).forEach((key) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private writeToConsole(entry: ILogEntry): void {
    if (!this.config.enableConsole) {
      return;
    }

    const styles = {
      debug: 'color: #666',
      info: 'color: #0284c7',
      warn: 'color: #f59e0b',
      error: 'color: #dc2626',
    };

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const style = styles[entry.level];

    console.log(`%c${prefix}`, style, entry.message, entry.metadata || '');

    if (entry.error?.stack) {
      console.error(entry.error.stack);
    }
  }

  private addToBuffer(entry: ILogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.enableRemote) {
      return;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      // In production, this would send to a logging service
      // await fetch(this.config.remoteEndpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ entries }),
      // });
      
      if (import.meta.env.DEV) {
        console.log('Would send logs to remote:', entries);
      }
    } catch (error) {
      console.error('Failed to send logs to remote:', error);
      // Re-add entries to buffer if failed
      this.buffer.unshift(...entries);
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) {
      return;
    }

    const entry = this.createLogEntry('debug', message, metadata);
    this.writeToConsole(entry);
    this.addToBuffer(entry);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) {
      return;
    }

    const entry = this.createLogEntry('info', message, metadata);
    this.writeToConsole(entry);
    this.addToBuffer(entry);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) {
      return;
    }

    const entry = this.createLogEntry('warn', message, metadata);
    this.writeToConsole(entry);
    this.addToBuffer(entry);
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) {
      return;
    }

    const entry = this.createLogEntry('error', message, metadata);
    
    if (error instanceof Error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as Error & { code?: string }).code,
      };
    } else if (error) {
      entry.error = {
        message: String(error),
      };
    }

    this.writeToConsole(entry);
    this.addToBuffer(entry);
  }

  // Performance logging
  time(label: string): void {
    if (this.config.enableConsole) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.config.enableConsole) {
      console.timeEnd(label);
    }
  }

  // Structured logging for specific scenarios
  logApiCall(method: string, url: string, status?: number, duration?: number): void {
    this.info('API Call', {
      method,
      url,
      status,
      duration,
      context: 'api',
    });
  }

  logUserAction(action: string, details?: Record<string, unknown>): void {
    this.info('User Action', {
      action,
      ...details,
      context: 'user-action',
    });
  }

  logPerformance(metric: string, value: number, unit = 'ms'): void {
    this.info('Performance Metric', {
      metric,
      value,
      unit,
      context: 'performance',
    });
  }

  // Clean up
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Export singleton instance
export const logger = Logger.getInstance();