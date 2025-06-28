import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/services/error/logger';

interface IRetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attemptNumber: number) => void;
}

interface IErrorRecoveryState {
  isRecovering: boolean;
  attemptNumber: number;
  lastError: Error | null;
}

export function useErrorRecovery(config?: IRetryConfig) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<IErrorRecoveryState>({
    isRecovering: false,
    attemptNumber: 0,
    lastError: null,
  });

  const retryTimeoutRef = useRef<number>();

  const defaultConfig: Required<IRetryConfig> = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    onRetry: () => {},
    ...config,
  };

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
  }, []);

  const calculateDelay = useCallback(
    (attemptNumber: number): number => {
      return defaultConfig.retryDelay * Math.pow(defaultConfig.backoffMultiplier, attemptNumber - 1);
    },
    [defaultConfig.retryDelay, defaultConfig.backoffMultiplier]
  );

  const recoverWithRetry = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      operationName: string
    ): Promise<T | null> => {
      clearRetryTimeout();
      
      setState({
        isRecovering: true,
        attemptNumber: 0,
        lastError: null,
      });

      for (let attempt = 1; attempt <= defaultConfig.maxRetries; attempt++) {
        try {
          setState((prev) => ({ ...prev, attemptNumber: attempt }));
          
          logger.info(`Attempting ${operationName}`, {
            attempt,
            maxRetries: defaultConfig.maxRetries,
          });

          const result = await operation();
          
          // Success - clear state and return result
          setState({
            isRecovering: false,
            attemptNumber: 0,
            lastError: null,
          });
          
          if (attempt > 1) {
            toast.success(`${operationName} succeeded after ${attempt} attempts`);
          }
          
          return result;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          
          logger.error(`${operationName} failed`, err, {
            attempt,
            maxRetries: defaultConfig.maxRetries,
          });

          setState((prev) => ({ ...prev, lastError: err }));

          if (attempt < defaultConfig.maxRetries) {
            const delay = calculateDelay(attempt);
            
            toast.warning(
              `${operationName} failed. Retrying in ${Math.round(delay / 1000)}s... (${attempt}/${defaultConfig.maxRetries})`,
              {
                duration: delay,
              }
            );

            defaultConfig.onRetry(attempt);

            await new Promise<void>((resolve) => {
              retryTimeoutRef.current = window.setTimeout(resolve, delay);
            });
          } else {
            // Final failure
            setState((prev) => ({
              ...prev,
              isRecovering: false,
            }));
            
            toast.error(`${operationName} failed after ${attempt} attempts. Please try again later.`);
            throw err;
          }
        }
      }

      return null;
    },
    [clearRetryTimeout, calculateDelay, defaultConfig]
  );

  const recoverWithFallback = useCallback(
    async <T,>(
      primaryOperation: () => Promise<T>,
      fallbackOperation: () => Promise<T>,
      operationName: string
    ): Promise<T> => {
      try {
        logger.info(`Attempting primary ${operationName}`);
        return await primaryOperation();
      } catch (primaryError) {
        logger.warn(`Primary ${operationName} failed, attempting fallback`, {
          error: primaryError,
        });
        
        toast.info(`Using fallback for ${operationName}`);
        
        try {
          return await fallbackOperation();
        } catch (fallbackError) {
          logger.error(`Fallback ${operationName} also failed`, fallbackError);
          toast.error(`${operationName} failed. Please try again later.`);
          throw fallbackError;
        }
      }
    },
    []
  );

  const recoverWithCache = useCallback(
    <T,>(
      queryKey: unknown[],
      fallbackData: T,
      operationName: string
    ): T => {
      try {
        const cachedData = queryClient.getQueryData<T>(queryKey);
        
        if (cachedData) {
          logger.info(`Using cached data for ${operationName}`);
          toast.info(`Using cached data for ${operationName}`);
          return cachedData;
        }
        
        logger.info(`No cached data for ${operationName}, using fallback`);
        return fallbackData;
      } catch (error) {
        logger.error(`Failed to recover from cache for ${operationName}`, error);
        return fallbackData;
      }
    },
    [queryClient]
  );

  const reset = useCallback(() => {
    clearRetryTimeout();
    setState({
      isRecovering: false,
      attemptNumber: 0,
      lastError: null,
    });
  }, [clearRetryTimeout]);

  // Clean up on unmount
  useCallback(() => {
    return () => {
      clearRetryTimeout();
    };
  }, [clearRetryTimeout]);

  return {
    ...state,
    recoverWithRetry,
    recoverWithFallback,
    recoverWithCache,
    reset,
  };
}