import { useState, useCallback, useRef } from 'react';

const useRetry = (
  asyncFunction,
  {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    retryCondition = (error) => true,
    onRetry = null,
    onMaxRetriesReached = null
  } = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [data, setData] = useState(null);
  
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  const calculateDelay = useCallback((attempt) => {
    return retryDelay * Math.pow(backoffMultiplier, attempt);
  }, [retryDelay, backoffMultiplier]);

  const execute = useCallback(async (...args) => {
    // Cancel any pending retry
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    const attemptExecution = async (attempt = 0) => {
      try {
        const result = await asyncFunction(...args, {
          signal: abortControllerRef.current?.signal
        });
        
        setData(result);
        setError(null);
        setIsLoading(false);
        return result;
      } catch (err) {
        // Check if request was aborted
        if (err.name === 'AbortError') {
          setIsLoading(false);
          return;
        }

        const shouldRetry = attempt < maxRetries && retryCondition(err);
        
        if (shouldRetry) {
          setRetryCount(attempt + 1);
          
          // Call onRetry callback if provided
          if (onRetry) {
            onRetry(err, attempt + 1, maxRetries);
          }

          const delay = calculateDelay(attempt);
          
          return new Promise((resolve, reject) => {
            timeoutRef.current = setTimeout(async () => {
              try {
                const result = await attemptExecution(attempt + 1);
                resolve(result);
              } catch (retryError) {
                reject(retryError);
              }
            }, delay);
          });
        } else {
          setError(err);
          setIsLoading(false);
          setRetryCount(attempt);
          
          // Call onMaxRetriesReached callback if provided
          if (onMaxRetriesReached) {
            onMaxRetriesReached(err, attempt);
          }
          
          throw err;
        }
      }
    };

    return attemptExecution();
  }, [asyncFunction, maxRetries, retryCondition, onRetry, onMaxRetriesReached, calculateDelay]);

  const retry = useCallback(() => {
    if (error && retryCount < maxRetries) {
      return execute();
    }
  }, [error, retryCount, maxRetries, execute]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setError(null);
    setData(null);
    setRetryCount(0);
  }, [cancel]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    cancel();
  }, [cancel]);

  return {
    execute,
    retry,
    cancel,
    reset,
    cleanup,
    isLoading,
    error,
    data,
    retryCount,
    maxRetries,
    canRetry: error && retryCount < maxRetries,
    hasMaxRetriesReached: retryCount >= maxRetries
  };
};

export default useRetry;