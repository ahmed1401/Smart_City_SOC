import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../theme/ThemeProvider';
export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const icon = isDark ? '☀️' : '🌙';
    const label = isDark ? 'Mode clair' : 'Mode sombre';
    return (_jsxs("button", { className: "theme-toggle", type: "button", onClick: toggleTheme, "aria-label": label, title: label, children: [_jsx("span", { children: icon }), _jsxs("small", { children: [isDark ? 'Light' : 'Dark', " mode"] })] }));
}
