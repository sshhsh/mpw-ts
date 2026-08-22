import { Moon, Sun, SunMoon } from "lucide-react";

import type { ThemePreference } from "../lib/useTheme";
import { useLanguage } from "../lib/useLanguage";

interface ThemeSwitcherProps {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}

function ThemeSwitcher({ preference, onChange }: ThemeSwitcherProps) {
  const { t } = useLanguage();
  const options = [
    { value: "light", label: t("theme.light"), icon: Sun },
    { value: "dark", label: t("theme.dark"), icon: Moon },
    { value: "system", label: t("theme.system"), icon: SunMoon },
  ] as const;
  const current = options.find((option) => option.value === preference)!;
  const next = options[(options.indexOf(current) + 1) % options.length];
  const Icon = current.icon;

  return (
    <button
      className="icon-button theme-switcher"
      type="button"
      onClick={() => onChange(next.value)}
      aria-label={t("theme.switch", {
        current: current.label,
        next: next.label,
      })}
      title={t("theme.switch", {
        current: current.label,
        next: next.label,
      })}
    >
      <Icon size={18} />
    </button>
  );
}

export default ThemeSwitcher;
