import { RefreshCw, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useLanguage } from "../lib/useLanguage";

function UpdatePrompt() {
  const { t } = useLanguage();
  const { needRefresh: refreshState, updateServiceWorker } = useRegisterSW();
  const [needRefresh, setNeedRefresh] = refreshState;

  if (!needRefresh) return null;

  return (
    <aside className="update-prompt" role="status" aria-live="polite">
      <div className="update-prompt-copy">
        <strong>{t("update.title")}</strong>
        <span>{t("update.copy")}</span>
      </div>
      <div className="update-prompt-actions">
        <button
          className="update-prompt-dismiss"
          type="button"
          onClick={() => setNeedRefresh(false)}
        >
          {t("update.later")}
        </button>
        <button
          className="update-prompt-confirm"
          type="button"
          onClick={() => void updateServiceWorker(true)}
        >
          <RefreshCw size={15} />
          {t("update.now")}
        </button>
        <button
          className="update-prompt-close"
          type="button"
          onClick={() => setNeedRefresh(false)}
          title={t("update.close")}
          aria-label={t("update.close")}
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}

export default UpdatePrompt;
