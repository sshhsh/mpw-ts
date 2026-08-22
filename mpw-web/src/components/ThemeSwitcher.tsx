import { Moon, Sun, SunMoon } from 'lucide-react';

import type { ThemePreference } from '../lib/useTheme';

interface ThemeSwitcherProps {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}

const options = [
  { value: 'light', label: '浅色模式', icon: Sun },
  { value: 'dark', label: '深色模式', icon: Moon },
  { value: 'system', label: '跟随系统', icon: SunMoon },
] as const;

function ThemeSwitcher({ preference, onChange }: ThemeSwitcherProps) {
  const current = options.find((option) => option.value === preference)!;
  const next = options[(options.indexOf(current) + 1) % options.length];
  const Icon = current.icon;

  return (
    <button
      className="icon-button theme-switcher"
      type="button"
      onClick={() => onChange(next.value)}
      aria-label={`当前为${current.label}，切换为${next.label}`}
      title={`当前为${current.label}，切换为${next.label}`}
    >
      <Icon size={18} />
    </button>
  );
}

export default ThemeSwitcher;