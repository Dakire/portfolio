import { useEffect, useState } from 'preact/hooks';

/** Valeur retardée : un traitement coûteux (analyse d'un gros document) suit la frappe sans la ralentir. */
export function useDebounced<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
