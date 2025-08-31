import { useState, useCallback } from 'react';

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      onRetry?.(attempt, lastError);
      
      const waitTime = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt;
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

// React hook for retry logic
export function useRetry() {
  const [retrying, setRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  
  const retry = useCallback(async <T,>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> => {
    setRetrying(true);
    setAttempt(0);
    
    try {
      const result = await withRetry(fn, {
        ...options,
        onRetry: (attemptNum, error) => {
          setAttempt(attemptNum);
          options?.onRetry?.(attemptNum, error);
        },
      });
      
      return result;
    } finally {
      setRetrying(false);
      setAttempt(0);
    }
  }, []);
  
  return { retry, retrying, attempt };
}