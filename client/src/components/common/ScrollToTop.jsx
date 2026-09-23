import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router keeps the scroll offset between route changes, which makes a
 * fresh page look half-scrolled. Reset it whenever the path changes.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // `html { scroll-behavior: smooth }` would otherwise animate the whole way
    // back up on every navigation; a new page should start at the top at once.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};
