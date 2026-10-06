import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="icon-btn overflow-hidden"
      aria-label={isDark ? 'Schakel naar licht thema' : 'Schakel naar donker thema'}
    >
      {/* Re-keyed on every theme change so the icon spins in again */}
      <span key={theme} className="enter-swap inline-flex">
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </span>
    </button>
  );
}
