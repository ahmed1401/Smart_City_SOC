import { useTheme } from '../theme/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const icon = isDark ? '☀️' : '🌙';
  const label = isDark ? 'Mode clair' : 'Mode sombre';

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={label} title={label}>
      <span>{icon}</span>
      <small>{isDark ? 'Light' : 'Dark'} mode</small>
    </button>
  );
}
