import {
  Eye,
  EyeOff,
  Github,
  History,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Search,
  ShieldCheck,
  QrCode,
  Trash2,
  UserRound,
} from 'lucide-react';
import {
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import './App.css';
import GeneratedResult from './components/GeneratedResult';
import GeneratorForm from './components/GeneratorForm';
import HistoryItem from './components/HistoryItem';
import HistoryTransfer from './components/HistoryTransfer';
import {
  historyEntryId,
  normalizeSite,
  type SiteHistoryEntry,
} from './lib/history';
import { useHistory } from './lib/useHistory';
import { useGenerator } from './lib/useGenerator';
import { useUnlock } from './lib/useUnlock';

function BuildInfo() {
  return (
    <div className="build-info">
      <span>Commit {__COMMIT_SHA__}</span>
      <a
        href="https://github.com/sshhsh/mpw-ts"
        target="_blank"
        rel="noreferrer"
        aria-label="在 GitHub 查看源代码"
      >
        <Github size={14} />
        <span>github.com/sshhsh/mpw-ts</span>
      </a>
    </div>
  );
}

interface UnlockViewProps {
  error: string;
  fullName: string;
  isUnlocking: boolean;
  masterPassword: string;
  showMaster: boolean;
  onFullNameChange: (value: string) => void;
  onMasterPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onToggleMaster: () => void;
}

function UnlockView(props: UnlockViewProps) {
  return (
    <main className="unlock-page">
      <section className="unlock-panel" aria-labelledby="unlock-title">
        <span className="unlock-mark">
          <KeyRound size={29} />
        </span>
        <h1 id="unlock-title">解锁离线密钥</h1>
        <p className="unlock-copy">
          身份信息只在当前页面内存中使用，锁定或刷新后立即清除。
        </p>
        <form className="unlock-form" onSubmit={props.onSubmit}>
          <label className="field">
            <span>完整姓名</span>
            <div className="input-shell">
              <UserRound size={18} />
              <input
                value={props.fullName}
                onChange={(event) => props.onFullNameChange(event.target.value)}
                autoComplete="name"
                autoFocus
                placeholder="与其他设备保持完全一致"
              />
            </div>
          </label>
          <label className="field">
            <span>主密码</span>
            <div className="input-shell">
              <LockKeyhole size={18} />
              <input
                type={props.showMaster ? 'text' : 'password'}
                value={props.masterPassword}
                onChange={(event) =>
                  props.onMasterPasswordChange(event.target.value)
                }
                autoComplete="current-password"
                placeholder="不会被保存"
              />
              <button
                type="button"
                onClick={props.onToggleMaster}
                title={props.showMaster ? '隐藏主密码' : '显示主密码'}
                aria-label={props.showMaster ? '隐藏主密码' : '显示主密码'}
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
            {props.isUnlocking ? '正在派生密钥…' : '解锁'}
          </button>
        </form>
        <div className="unlock-security">
          <ShieldCheck size={17} />
          <span>无账户 · 无网络请求 · 不保存身份</span>
        </div>
        <BuildInfo />
      </section>
    </main>
  );
}

interface HistoryProps {
  entries: SiteHistoryEntry[];
  search: string;
  selectedId: string;
  onClear: () => void;
  onLoad: (entry: SiteHistoryEntry) => void;
  onRemove: (id: string) => void;
  onSearchChange: (value: string) => void;
}

function HistoryList({
  entries,
  selectedId,
  onLoad,
  onRemove,
}: Pick<HistoryProps, 'entries' | 'selectedId' | 'onLoad' | 'onRemove'>) {
  return (
    <div className="history-list">
      {entries.length === 0 ? (
        <div className="empty">
          <KeyRound size={25} />
          <strong>尚无网站历史</strong>
          <span>成功生成后会出现在这里</span>
        </div>
      ) : (
        entries.map((entry) => (
          <HistoryItem
            key={entry.id}
            entry={entry}
            selected={selectedId === entry.id}
            variant="desktop"
            onLoad={onLoad}
            onRemove={onRemove}
          />
        ))
      )}
    </div>
  );
}

function DesktopHistory(props: HistoryProps) {
  const filtered = useMemo(() => {
    const query = normalizeSite(props.search);
    return query
      ? props.entries.filter((entry) =>
          normalizeSite(entry.site).includes(query),
        )
      : props.entries;
  }, [props.entries, props.search]);

  return (
    <aside className="history desktop-history" aria-labelledby="history-title">
      <div className="history-heading">
        <h2 id="history-title">
          <History size={16} /> 最近使用
        </h2>
        {props.entries.length > 0 && (
          <button
            className="icon-button quiet"
            type="button"
            onClick={props.onClear}
            aria-label="清除全部历史"
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
      <label className="search-box">
        <Search size={17} />
        <input
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="搜索网站"
          aria-label="搜索网站历史"
        />
      </label>
      {filtered.length === 0 && props.search ? (
        <div className="empty">
          <Search size={24} />
          <strong>没有匹配的网站</strong>
        </div>
      ) : (
        <HistoryList
          entries={filtered}
          selectedId={props.selectedId}
          onLoad={props.onLoad}
          onRemove={props.onRemove}
        />
      )}
      <div className="storage-note">
        <ShieldCheck size={17} />
        <p>
          <strong>历史中不含敏感信息</strong>
          <span>姓名、主密码和生成结果永不写入浏览器存储。</span>
        </p>
      </div>
    </aside>
  );
}

function MobileHistory(props: HistoryProps) {
  const [managing, setManaging] = useState(false);
  const filtered = useMemo(() => {
    const query = normalizeSite(props.search);
    return query
      ? props.entries.filter((entry) =>
          normalizeSite(entry.site).includes(query),
        )
      : props.entries;
  }, [props.entries, props.search]);

  return (
    <section className="mobile-history" aria-labelledby="mobile-history-title">
      <div className="mobile-history-heading">
        <h2 id="mobile-history-title">
          <History size={16} /> 最近使用
        </h2>
        {props.entries.length > 0 && (
          <button
            className="text-button"
            type="button"
            onClick={() => setManaging((value) => !value)}
          >
            {managing ? '完成' : '管理'}
          </button>
        )}
      </div>
      <label className="search-box mobile-search-box">
        <Search size={17} />
        <input
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="搜索网站"
          aria-label="搜索移动端网站历史"
        />
      </label>
      {props.entries.length === 0 ? (
        <p className="mobile-history-empty">
          生成第一个密码后，网站会保存在这里。
        </p>
      ) : filtered.length === 0 ? (
        <p className="mobile-history-empty">没有匹配的网站</p>
      ) : (
        <div className="history-shortcuts">
          {filtered.map((entry) => (
            <HistoryItem
              key={entry.id}
              entry={entry}
              selected={props.selectedId === entry.id}
              variant="mobile"
              managing={managing}
              onLoad={props.onLoad}
              onRemove={props.onRemove}
            />
          ))}
        </div>
      )}
      {managing && props.entries.length > 0 && (
        <button className="clear-mobile" type="button" onClick={props.onClear}>
          <Trash2 size={15} /> 清除全部历史
        </button>
      )}
    </section>
  );
}

function App() {
  const {
    site,
    changeSite,
    counter,
    changeCounter,
    template,
    changeTemplate,
    advancedOpen,
    toggleAdvanced,
    result,
    setGeneratedResult,
    showResult,
    toggleResultVisibility,
    reset: resetGenerator,
    load: loadGenerator,
  } = useGenerator();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
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
    resetGenerator();
    setCopied(false);
    setError('');
    setTransferOpen(false);
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    const target = site.trim();
    if (!mpw) {
      lockSession();
      return;
    }
    if (!target) {
      setError('请输入网站或服务。');
      return;
    }
    setIsGenerating(true);
    setError('');
    setCopied(false);
    try {
      const generated = await mpw.generateAuthentication(target, {
        counter,
        template,
      });
      setGeneratedResult(generated);
      upsertHistoryEntry({ site: target, counter, template });
    } catch (cause) {
      setError(
        cause instanceof Error ? `生成失败：${cause.message}` : '生成失败。',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('无法访问剪贴板，请手动复制。');
    }
  }

  function loadEntry(entry: SiteHistoryEntry) {
    loadGenerator(entry);
    setError('');
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelector<HTMLInputElement>('#site-input')?.focus();
    }
  }

  function clearEntries() {
    if (!window.confirm('清除全部网站历史？')) return;
    clearHistoryEntries();
  }

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

  const selectedId = historyEntryId(site, template, counter);
  const historyProps: HistoryProps = {
    entries: history,
    search,
    selectedId,
    onClear: clearEntries,
    onLoad: loadEntry,
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
              site={site}
              counter={counter}
              template={template}
              advancedOpen={advancedOpen}
              error={error}
              hasResult={Boolean(result)}
              isGenerating={isGenerating}
              onSiteChange={changeSite}
              onCounterChange={changeCounter}
              onTemplateChange={changeTemplate}
              onAdvancedToggle={toggleAdvanced}
              onReset={() => {
                resetGenerator();
                setError('');
              }}
              onSubmit={generate}
            />
            <GeneratedResult
              result={result}
              showResult={showResult}
              copied={copied}
              onToggleVisibility={toggleResultVisibility}
              onCopy={() => void copyResult()}
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
