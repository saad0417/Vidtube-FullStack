import { useEffect, useRef } from 'react';

/**
 * Calls `onLoadMore` when the returned sentinel scrolls into view.
 *
 * The callback is kept in a ref so the observer isn't torn down and rebuilt on
 * every render, and `enabled` gates it so we never fire while a request is
 * already in flight or once the last page has been loaded.
 *
 * `rootMargin` starts the fetch before the sentinel is actually visible, which
 * makes the next page feel like it was already there.
 */
export const useInfiniteScroll = (onLoadMore, { enabled = true, rootMargin = '600px' } = {}) => {
  const sentinelRef = useRef(null);
  const callbackRef = useRef(onLoadMore);

  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled) return undefined;

    // Very old browsers without IntersectionObserver keep the manual fallback
    // button that each page renders alongside the sentinel.
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callbackRef.current?.();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
};
