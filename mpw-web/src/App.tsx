import { KeyRound, LockKeyhole, QrCode } from "lucide-react";
import { useState } from "react";

import "./App.css";
import BuildInfo from "./components/BuildInfo";
import GeneratedResult from "./components/GeneratedResult";
import GeneratorForm from "./components/GeneratorForm";
import {
  DesktopHistory,
  MobileHistory,
  type HistoryProps,
} from "./components/HistoryPanels";
import HistoryTransfer from "./components/HistoryTransfer";
import LanguageSwitcher from "./components/LanguageSwitcher";
import ThemeSwitcher from "./components/ThemeSwitcher";
import UnlockView from "./components/UnlockView";
import UpdatePrompt from "./components/UpdatePrompt";
import { historyEntryId } from "./lib/history";
import { useHistory } from "./lib/useHistory";
import { useLanguage } from "./lib/useLanguage";
import { usePasswordGeneration } from "./lib/usePasswordGeneration";
import { useTheme } from "./lib/useTheme";
import { useUnlock } from "./lib/useUnlock";

function App() {
  const { t } = useLanguage();
  const { preference, changePreference } = useTheme();
  const {
    entries: history,
    upsert: upsertHistoryEntry,
    remove: removeHistoryEntry,
    merge: mergeHistoryEntries,
    clear: clearHistoryEntries,
  } = useHistory();
  const [search, setSearch] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const unlockState = useUnlock();
  const {
    mpw,
    fullName,
    masterPassword,
    showMaster,
    isUnlocking,
    unlockError,
    setFullName,
    setMasterPassword,
    toggleShowMaster,
    unlock,
    reset: resetUnlock,
  } = unlockState;

  function lockSession() {
    resetUnlock();
    generation.reset();
    setTransferOpen(false);
  }

  function clearEntries() {
    if (!window.confirm(t("app.clearHistory.confirm"))) return;
    clearHistoryEntries();
  }

  const generation = usePasswordGeneration({
    mpw,
    onMissingSession: lockSession,
    onHistoryUpsert: upsertHistoryEntry,
  });

  if (!mpw) {
    return (
      <div className="app-shell locked">
        <div className="locked-tools">
          <ThemeSwitcher preference={preference} onChange={changePreference} />
          <LanguageSwitcher />
        </div>
        <UnlockView
          fullName={fullName}
          masterPassword={masterPassword}
          showMaster={showMaster}
          isUnlocking={isUnlocking}
          error={unlockError}
          onFullNameChange={setFullName}
          onMasterPasswordChange={setMasterPassword}
          onToggleMaster={toggleShowMaster}
          onSubmit={unlock}
        />
        <UpdatePrompt />
      </div>
    );
  }

  const selectedId = historyEntryId(
    generation.site,
    generation.template,
    generation.counter,
  );
  const historyProps: HistoryProps = {
    entries: history,
    search,
    selectedId,
    onClear: clearEntries,
    onLoad: generation.loadEntry,
    onRemove: removeHistoryEntry,
    onSearchChange: setSearch,
  };
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <KeyRound size={21} />
          </span>
          <strong>{t("brand.name")}</strong>
          <small>{t("brand.version")}</small>
        </div>
        <div className="session-info">
          <span>{fullName}</span>
          <ThemeSwitcher preference={preference} onChange={changePreference} />
          <span className="language-area">
            <LanguageSwitcher />
          </span>
          <button
            className="icon-button"
            type="button"
            onClick={() => setTransferOpen(true)}
            title={t("app.migrate")}
            aria-label={t("app.migrate")}
          >
            <QrCode size={19} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={lockSession}
            title={t("app.lock")}
            aria-label={t("app.lock")}
          >
            <LockKeyhole size={19} />
          </button>
        </div>
      </header>
      <main className="workspace">
        <section className="generator" aria-labelledby="generator-title">
          <MobileHistory {...historyProps} />
          <div className="generator-controls">
            <GeneratorForm
              site={generation.site}
              counter={generation.counter}
              template={generation.template}
              advancedOpen={generation.advancedOpen}
              error={generation.error}
              hasResult={Boolean(generation.result)}
              isGenerating={generation.isGenerating}
              onSiteChange={generation.changeSite}
              onCounterChange={generation.changeCounter}
              onTemplateChange={generation.changeTemplate}
              onAdvancedToggle={generation.toggleAdvanced}
              onReset={() => {
                generation.reset();
              }}
              onSubmit={generation.generate}
            />
            <GeneratedResult
              result={generation.result}
              showResult={generation.showResult}
              copied={generation.copied}
              onToggleVisibility={generation.toggleResultVisibility}
              onCopy={() => void generation.copyResult()}
            />
          </div>
        </section>
        <DesktopHistory {...historyProps} />
      </main>
      <footer>
        <span>{t("app.algorithm")}</span>
        <div className="footer-meta">
          <span>{t("app.footer")}</span>
          <BuildInfo />
        </div>
      </footer>
      {transferOpen && mpw && (
        <HistoryTransfer
          entries={history}
          mpw={mpw}
          onImport={mergeHistoryEntries}
          onClose={() => setTransferOpen(false)}
        />
      )}
      <UpdatePrompt />
    </div>
  );
}

export default App;
