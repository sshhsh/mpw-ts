import { Monitor, Moon, Sun } from 'lucide-react';

import type { ThemePreference } from '../lib/useTheme';

interface ThemeSwitcherProps {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}

const options = [
  { value: 'light', label: '浅色模式', icon: Sun },
  { value: 'dark', label: '深色模式', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
] as const;

function ThemeSwitcher({ preference, onChange }: ThemeSwitcherProps) {
  return (
    <div className="theme-switcher" role="group" aria-label="主题模式">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          className="theme-option"
          type="button"
          key={value}
          onClick={() => onChange(value)}
          aria-label={label}
          aria-pressed={preference === value}
          title={label}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}

export default ThemeSwitcher;