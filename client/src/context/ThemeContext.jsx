import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'vidtube:theme';
const THEMES = ['light', 'dark', 'system'];

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

const systemPrefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export const ThemeProvider = ({ children }) => {
  // `theme` is the user's preference; `resolvedTheme` is what's actually painted.
  const [theme, setThemeState] = useState(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    readStoredTheme() === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : readStoredTheme()
  );

  const apply = useCallback((preference) => {
    const resolved =
      preference === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : preference;

    const root = document.documentElement;
    if (root.getAttribute('data-theme') === resolved) {
      setResolvedTheme(resolved);
      return;
    }

    // Freeze transitions so every surface repaints in the same frame instead
    // of easing to the new colour at each component's own duration.
    root.setAttribute('data-theme-switching', '');
    root.setAttribute('data-theme', resolved);
    // Kept in sync for Tailwind's `dark:` variant.
    root.classList.toggle('dark', resolved === 'dark');

    // Force a style flush so the new colours are committed while transitions
    // are still disabled, then release on the next frame.
    void root.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.removeAttribute('data-theme-switching'));
    });

    setResolvedTheme(resolved);
  }, []);

  useEffect(() => {
    apply(theme);
  }, [theme, apply]);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (theme !== 'system') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => apply('system');

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [theme, apply]);

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing can refuse writes; the theme still applies for this session.
    }
    setThemeState(next);
  }, []);

  // Used by the navbar button: always lands on an explicit light/dark choice.
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, toggleTheme, themes: THEMES }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
