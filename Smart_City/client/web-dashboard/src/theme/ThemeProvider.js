import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
const STORAGE_KEY = 'smartcity_theme';
const ThemeContext = createContext(undefined);
function getInitialTheme() {
    if (typeof window === 'undefined') {
        return 'dark';
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
        return stored;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'dark';
}
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => getInitialTheme());
    useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = theme;
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);
    const value = useMemo(() => ({
        theme,
        setTheme,
        toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }), [theme]);
    return _jsx(ThemeContext.Provider, { value: value, children: children });
}
export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return ctx;
}
