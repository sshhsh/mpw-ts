import {
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { SubmitEvent } from "react";

import BuildInfo from "./BuildInfo";
import { useLanguage } from "../lib/useLanguage";

interface UnlockViewProps {
  error: string;
  fullName: string;
  isUnlocking: boolean;
  masterPassword: string;
  showMaster: boolean;
  onFullNameChange: (value: string) => void;
  onMasterPasswordChange: (value: string) => void;
  onSubmit: (event: SubmitEvent) => void;
  onToggleMaster: () => void;
}

function UnlockView(props: UnlockViewProps) {
  const { t } = useLanguage();
  return (
    <main className="unlock-page">
      <section className="unlock-panel" aria-labelledby="unlock-title">
        <span className="unlock-mark">
          <KeyRound size={29} />
        </span>
        <h1 id="unlock-title">{t("unlock.title")}</h1>
        <p className="unlock-copy">{t("unlock.copy")}</p>
        <form className="unlock-form" onSubmit={props.onSubmit}>
          <label className="field">
            <span>{t("unlock.fullName")}</span>
            <div className="input-shell">
              <UserRound size={18} />
              <input
                value={props.fullName}
                onChange={(event) => props.onFullNameChange(event.target.value)}
                autoComplete="name"
                autoFocus
                placeholder={t("unlock.fullNamePlaceholder")}
              />
            </div>
          </label>
          <label className="field">
            <span>{t("unlock.masterPassword")}</span>
            <div className="input-shell">
              <LockKeyhole size={18} />
              <input
                type={props.showMaster ? "text" : "password"}
                value={props.masterPassword}
                onChange={(event) =>
                  props.onMasterPasswordChange(event.target.value)
                }
                autoComplete="current-password"
                placeholder={t("unlock.masterPasswordPlaceholder")}
              />
              <button
                type="button"
                onClick={props.onToggleMaster}
                title={
                  props.showMaster
                    ? t("unlock.hideMaster")
                    : t("unlock.showMaster")
                }
                aria-label={
                  props.showMaster
                    ? t("unlock.hideMaster")
                    : t("unlock.showMaster")
                }
              >
                {props.showMaster ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {props.error && (
            <div className="error" role="alert">
              {props.error}
            </div>
          )}
          <button
            className="primary-button unlock-button"
            type="submit"
            disabled={props.isUnlocking}
          >
            {props.isUnlocking ? (
              <LoaderCircle className="spin" size={19} />
            ) : (
              <LockKeyhole size={19} />
            )}
            {props.isUnlocking ? t("unlock.derive") : t("unlock.submit")}
          </button>
        </form>
        <div className="unlock-security">
          <ShieldCheck size={17} />
          <span>{t("unlock.security")}</span>
        </div>
        <BuildInfo />
      </section>
    </main>
  );
}

export default UnlockView;
