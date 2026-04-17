import { useState, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T extends string> {
  column: T;
  direction: SortDirection;
}

export function useSortConfig<T extends string>(defaultColumn: T, defaultDirection: SortDirection = 'desc') {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    column: defaultColumn,
    direction: defaultDirection,
  });

  const toggleSort = useCallback((column: T) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'desc' };
    });
  }, []);

  return { sortConfig, toggleSort };
}

/**
 * Generic comparator for sorting. Handles strings, numbers, and booleans.
 */
export function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  const multiplier = direction === 'asc' ? 1 : -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * multiplier;
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return ((a === b ? 0 : a ? 1 : -1)) * multiplier;
  }

  const strA = String(a ?? '');
  const strB = String(b ?? '');
  return strA.localeCompare(strB) * multiplier;
}
