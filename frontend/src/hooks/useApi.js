/**
 * useApi — Custom hook for API calls with loading/error state
 * Placeholder utility for components that need simple request tracking.
 */
import { useState, useCallback } from 'react';

/**
 * @template T
 * @param {function(...args): Promise<T>} apiFn - API service function to wrap
 * @returns {{ execute: function, data: T|null, loading: boolean, error: string|null }}
 */
const useApi = (apiFn) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFn(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || 'An error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn]
  );

  return { execute, data, loading, error };
};

export default useApi;
