import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query.
 *
 * Deliberately NOT used for layout. Layout stays in CSS `lg:`/`sm:` breakpoints. This
 * exists only for what CSS cannot express: the admin nav's `inert` / `aria-hidden`
 * pair, which must be suppressed on desktop where the nav is always visible. See
 * DESIGN.md §4.4. It must never be used to mount one of two DOM trees.
 *
 * `useSyncExternalStore` keeps this a real subscription instead of a setState inside
 * an effect, which would cascade a render on every viewport change.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
