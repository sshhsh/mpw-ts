import { Check, Clipboard, Eye, EyeOff } from "lucide-react";

import { useLanguage } from "../lib/useLanguage";

interface GeneratedResultProps {
  copied: boolean;
  result: string;
  showResult: boolean;
  onCopy: () => void;
  onToggleVisibility: () => void;
}

function GeneratedResult({
  copied,
  result,
  showResult,
  onCopy,
  onToggleVisibility,
}: GeneratedResultProps) {
  const { t } = useLanguage();
  return (
    <div className={`result ${result ? "ready" : ""}`} aria-live="polite">
      <div>
        <span>{t("result.title")}</span>
        <strong className={result && !showResult ? "masked" : ""}>
          {result || t("result.waiting")}
        </strong>
      </div>
      <div className="result-actions">
        <button
          className="icon-button"
          type="button"
          disabled={!result}
          onClick={onToggleVisibility}
          aria-label={t("result.toggle")}
        >
          {showResult ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button
          className="copy-button"
          type="button"
          disabled={!result}
          onClick={onCopy}
        >
          {copied ? <Check size={18} /> : <Clipboard size={18} />}
          {copied ? t("result.copied") : t("result.copy")}
        </button>
      </div>
    </div>
  );
}

export default GeneratedResult;
