import { Languages } from "lucide-react";

import { useLanguage } from "../lib/useLanguage";

function LanguageSwitcher() {
  const { language, toggleLanguage, t } = useLanguage();
  const nextLanguage = language === "zh-CN" ? "English" : "中文";

  return (
    <button
      className="icon-button language-switcher"
      type="button"
      onClick={toggleLanguage}
      title={t("language.switch", {
        current: t("language.name"),
        next: nextLanguage,
      })}
      aria-label={t("language.switch", {
        current: t("language.name"),
        next: nextLanguage,
      })}
    >
      <Languages size={17} />
    </button>
  );
}

export default LanguageSwitcher;
