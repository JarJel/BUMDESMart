import { useEffect, useState } from 'react';

/**
 * Custom hook untuk menunda pembaruan state sampai waktu tertentu berlalu.
 * Sangat berguna untuk membatasi pemanggilan API saat mengetik (debounce).
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
