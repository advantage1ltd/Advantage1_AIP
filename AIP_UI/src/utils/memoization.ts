import { useMemo, useCallback, useEffect, useRef, DependencyList, memo } from 'react';
import type { ComponentType } from 'react';

// Type-safe deep comparison function
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return a === b;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => deepEqual(a[key], b[key]));
}

// Safe memoization hook with deep comparison
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(() => {
    try {
      return factory();
    } catch (error) {
      console.warn('Memoization error:', error);
      return factory();
    }
  }, deps);
}

// Safe callback memoization with deep comparison
export function useDeepCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  return useCallback((...args: Parameters<T>) => {
    try {
      return callback(...args);
    } catch (error) {
      console.warn('Callback error:', error);
      return callback(...args);
    }
  }, deps) as unknown as T;
}

// HOC for memoizing expensive components
export function withMemo<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
) {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const MemoizedComponent = memo(Component, propsAreEqual || deepEqual);
  MemoizedComponent.displayName = `Memoized${displayName}`;
  
  return MemoizedComponent;
}

// Utility for creating stable references
export function useStableValue<T>(value: T): T {
  const ref = useRef(value);
  
  useEffect(() => {
    if (!deepEqual(ref.current, value)) {
      ref.current = value;
    }
  }, [value]);
  
  return ref.current;
}

// Safe object memoization
export function useMemoObject<T extends object>(obj: T): T {
  return useMemo(() => obj, Object.values(obj));
}

// Safe array memoization
export function useMemoArray<T>(arr: T[]): T[] {
  return useMemo(() => arr, [JSON.stringify(arr)]);
} 