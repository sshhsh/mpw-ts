import { KeyRound, LockKeyhole, QrCode } from 'lucide-react';
import { useState } from 'react';

import './App.css';
import BuildInfo from './components/BuildInfo';
import GeneratedResult from './components/GeneratedResult';
import GeneratorForm from './components/GeneratorForm';
import {
  DesktopHistory,
  MobileHistory,
  type HistoryProps,
} from './components/HistoryPanels';
import HistoryTransfer from './components/HistoryTransfer';
import UnlockView from './components/UnlockView';
import { historyEntryId } from './lib/history';
import { useHistory } from './lib/useHistory';
import { usePasswordGeneration } from './lib/usePasswordGeneration';
import { useUnlock } from './lib/useUnlock';

function App() {
  const {
    entries: history,
    upsert: upsertHistoryEntry,
    remove: removeHistoryEntry,
    merge: mergeHistoryEntries,
    clear: clearHistoryEntries,
  } = useHistory();
  const [search, setSearch] = useState('');
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
    if (!window.confirm('清除全部网站历史？')) return;
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
          <strong>离线密钥</strong>
          <small>MPW v3</small>
        </div>
        <div className="session-info">
          <span>{fullName}</span>
          <button
            className="icon-button"
            type="button"
            onClick={() => setTransferOpen(true)}
            title="迁移网站历史"
            aria-label="迁移网站历史"
          >
            <QrCode size={19} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={lockSession}
            title="锁定会话"
            aria-label="锁定会话"
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
        <span>算法版本 MPW v3</span>
        <div className="footer-meta">
          <span>离线优先 · 无需账户 · 无网络请求</span>
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
    </div>
  );
}

export default App;
