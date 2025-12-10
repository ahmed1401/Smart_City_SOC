import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = 'smartcity_theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
