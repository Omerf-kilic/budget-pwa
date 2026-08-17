import { useState, useEffect } from 'react';

/**
 * A custom hook that syncs a state value to localStorage.
 * Reads the initial value from localStorage on mount.
 *
 * @template T
 * @param {string} key - The localStorage key to use
 * @param {T} initialValue - The default value if nothing is stored
 * @returns {[T, function]} - [storedValue, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`[useLocalStorage] Failed to read key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`[useLocalStorage] Failed to write key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
