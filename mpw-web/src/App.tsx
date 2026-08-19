import {
  Check,
  ChevronDown,
  Clipboard,
  Eye,
  EyeOff,
  Globe2,
  History,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Minus,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import { MPW, TEMPLATES, type TemplateName } from '@mpw/core'

import './App.css'
import {
  clearHistory,
  loadHistory,
  removeHistory,
  saveHistory,
  upsertHistory,
  type SiteHistoryEntry,
} from './lib/history'

type MpwInstance = Awaited<ReturnType<typeof MPW.create>>

const templateLabels: Record<TemplateName, string> = {
  maximum: '最高强度 · 20 位',
  long: '长密码 · 14 位',
  medium: '中等 · 8 位',
  basic: '基础 · 8 位',
  short: '短密码 · 4 位',
  pin: 'PIN · 4 位数字',
  name: '用户名 · 9 位',
  phrase: '短语 · 4 组单词',
}

function relativeTime(timestamp: number): string {
  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

interface UnlockViewProps {
  error: string
  fullName: string
  isUnlocking: boolean
  masterPassword: string
  showMaster: boolean
  onFullNameChange: (value: string) => void
  onMasterPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent) => void
  onToggleMaster: () => void
}

function UnlockView(props: UnlockViewProps) {
  return (
    <main className="unlock-page">
      <section className="unlock-panel" aria-labelledby="unlock-title">
        <span className="unlock-mark"><KeyRound size={29} /></span>
        <h1 id="unlock-title">解锁离线密钥</h1>
        <p className="unlock-copy">身份信息只在当前页面内存中使用，锁定或刷新后立即清除。</p>
        <form className="unlock-form" onSubmit={props.onSubmit}>
          <label className="field">
            <span>完整姓名</span>
            <div className="input-shell">
              <UserRound size={18} />
              <input value={props.fullName} onChange={(event) => props.onFullNameChange(event.target.value)} autoComplete="name" autoFocus placeholder="与其他设备保持完全一致" />
            </div>
          </label>
          <label className="field">
            <span>主密码</span>
            <div className="input-shell">
              <LockKeyhole size={18} />
              <input type={props.showMaster ? 'text' : 'password'} value={props.masterPassword} onChange={(event) => props.onMasterPasswordChange(event.target.value)} autoComplete="current-password" placeholder="不会被保存" />
              <button type="button" onClick={props.onToggleMaster} title={props.showMaster ? '隐藏主密码' : '显示主密码'} aria-label={props.showMaster ? '隐藏主密码' : '显示主密码'}>
                {props.showMaster ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {props.error && <div className="error" role="alert">{props.error}</div>}
          <button className="primary-button unlock-button" type="submit" disabled={props.isUnlocking}>
            {props.isUnlocking ? <LoaderCircle className="spin" size={19} /> : <LockKeyhole size={19} />}
            {props.isUnlocking ? '正在派生密钥…' : '解锁'}
          </button>
        </form>
        <div className="unlock-security"><ShieldCheck size={17} /><span>无账户 · 无网络请求 · 不保存身份</span></div>
      </section>
    </main>
  )
}

interface HistoryProps {
  entries: SiteHistoryEntry[]
  search: string
  selectedId: string
  onClear: () => void
  onLoad: (entry: SiteHistoryEntry) => void
  onRemove: (id: string) => void
  onSearchChange: (value: string) => void
}

function HistoryList({ entries, selectedId, onLoad, onRemove }: Pick<HistoryProps, 'entries' | 'selectedId' | 'onLoad' | 'onRemove'>) {
  return (
    <div className="history-list">
      {entries.length === 0 ? (
        <div className="empty"><KeyRound size={25} /><strong>尚无网站历史</strong><span>成功生成后会出现在这里</span></div>
      ) : entries.map((entry) => (
        <article className={`history-item ${selectedId === entry.id ? 'selected' : ''}`} key={entry.id}>
          <button className="history-load" type="button" onClick={() => onLoad(entry)} aria-label={`载入 ${entry.site}，${templateLabels[entry.template].split(' · ')[0]}，计数器 ${entry.counter}`}>
            <span className="monogram">{entry.site.charAt(0).toUpperCase()}</span>
            <span><strong>{entry.site}</strong><small>{templateLabels[entry.template].split(' · ')[0]} · 计数器 {entry.counter} · {relativeTime(entry.lastUsedAt)}</small></span>
          </button>
          <button className="delete-button" type="button" onClick={() => onRemove(entry.id)} aria-label={`删除 ${entry.site}`}><X size={15} /></button>
        </article>
      ))}
    </div>
  )
}

function DesktopHistory(props: HistoryProps) {
  const filtered = useMemo(() => {
    const query = props.search.trim().toLocaleLowerCase()
    return query ? props.entries.filter((entry) => entry.site.toLocaleLowerCase().includes(query)) : props.entries
  }, [props.entries, props.search])

  return (
    <aside className="history desktop-history" aria-labelledby="history-title">
      <div className="history-heading">
        <h2 id="history-title"><History size={16} /> 最近使用</h2>
        {props.entries.length > 0 && <button className="icon-button quiet" type="button" onClick={props.onClear} aria-label="清除全部历史"><Trash2 size={17} /></button>}
      </div>
      <label className="search-box"><Search size={17} /><input value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="搜索网站" aria-label="搜索网站历史" /></label>
      {filtered.length === 0 && props.search ? <div className="empty"><Search size={24} /><strong>没有匹配的网站</strong></div> : <HistoryList entries={filtered} selectedId={props.selectedId} onLoad={props.onLoad} onRemove={props.onRemove} />}
      <div className="storage-note"><ShieldCheck size={17} /><p><strong>历史中不含敏感信息</strong><span>姓名、主密码和生成结果永不写入浏览器存储。</span></p></div>
    </aside>
  )
}

function MobileHistory(props: Omit<HistoryProps, 'search' | 'onSearchChange'>) {
  const [managing, setManaging] = useState(false)
  return (
    <section className="mobile-history" aria-labelledby="mobile-history-title">
      <div className="mobile-history-heading">
        <h2 id="mobile-history-title"><History size={16} /> 最近使用</h2>
        {props.entries.length > 0 && <button className="text-button" type="button" onClick={() => setManaging((value) => !value)}>{managing ? '完成' : '管理'}</button>}
      </div>
      {props.entries.length === 0 ? <p className="mobile-history-empty">生成第一个密码后，网站会保存在这里。</p> : (
        <div className="history-shortcuts">
          {props.entries.map((entry) => (
            <div className={`shortcut-wrap ${props.selectedId === entry.id ? 'selected' : ''}`} key={entry.id}>
              <button className="history-shortcut" type="button" onClick={() => props.onLoad(entry)} aria-label={`载入 ${entry.site}，${templateLabels[entry.template].split(' · ')[0]}，计数器 ${entry.counter}`}>
                <span className="monogram">{entry.site.charAt(0).toUpperCase()}</span>
                <span><strong>{entry.site}</strong><small>{templateLabels[entry.template].split(' · ')[0]} · 计数器 {entry.counter}</small></span>
              </button>
              {managing && <button className="shortcut-delete" type="button" onClick={() => props.onRemove(entry.id)} aria-label={`删除 ${entry.site}`}><X size={14} /></button>}
            </div>
          ))}
        </div>
      )}
      {managing && props.entries.length > 0 && <button className="clear-mobile" type="button" onClick={props.onClear}><Trash2 size={15} /> 清除全部历史</button>}
    </section>
  )
}

function App() {
  const [fullName, setFullName] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showMaster, setShowMaster] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [site, setSite] = useState('')
  const [counter, setCounter] = useState(1)
  const [template, setTemplate] = useState<TemplateName>('long')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [result, setResult] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<SiteHistoryEntry[]>(loadHistory)
  const [search, setSearch] = useState('')
  const mpwRef = useRef<MpwInstance | null>(null)

  useEffect(() => {
    const invalidate = () => mpwRef.current?.invalidate()
    const handlePageHide = (event: PageTransitionEvent) => {
      if (!event.persisted) invalidate()
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => { window.removeEventListener('pagehide', handlePageHide); invalidate() }
  }, [])

  function storeHistory(entries: SiteHistoryEntry[]) {
    setHistory(entries)
    saveHistory(entries)
  }

  async function unlock(event: FormEvent) {
    event.preventDefault()
    const name = fullName.trim()
    if (!name || !masterPassword) {
      setError('请输入完整姓名和主密码。')
      return
    }
    setIsUnlocking(true)
    setError('')
    try {
      mpwRef.current?.invalidate()
      mpwRef.current = await MPW.create(name, masterPassword)
      setFullName(name)
      setMasterPassword('')
      setShowMaster(false)
      setIsUnlocked(true)
    } catch (cause) {
      setError(cause instanceof Error ? `解锁失败：${cause.message}` : '解锁失败。')
    } finally {
      setIsUnlocking(false)
    }
  }

  function lockSession() {
    mpwRef.current?.invalidate()
    mpwRef.current = null
    setIsUnlocked(false)
    setFullName('')
    setMasterPassword('')
    setSite('')
    setResult('')
    setCopied(false)
    setError('')
  }

  async function generate(event: FormEvent) {
    event.preventDefault()
    const target = site.trim()
    if (!mpwRef.current) { lockSession(); return }
    if (!target) { setError('请输入网站或服务。'); return }
    setIsGenerating(true)
    setError('')
    setCopied(false)
    try {
      const generated = await mpwRef.current.generateAuthentication(target, { counter, template })
      setResult(generated)
      setShowResult(false)
      storeHistory(upsertHistory(history, { site: target, counter, template }))
    } catch (cause) {
      setError(cause instanceof Error ? `生成失败：${cause.message}` : '生成失败。')
    } finally {
      setIsGenerating(false)
    }
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch { setError('无法访问剪贴板，请手动复制。') }
  }

  function loadEntry(entry: SiteHistoryEntry) {
    setSite(entry.site)
    setCounter(entry.counter)
    setTemplate(entry.template)
    setAdvancedOpen(entry.counter !== 1 || entry.template !== 'long')
    setResult('')
    setError('')
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelector<HTMLInputElement>('#site-input')?.focus()
    }
  }

  function removeEntry(id: string) { storeHistory(removeHistory(history, id)) }
  function clearEntries() {
    if (!window.confirm('清除全部网站历史？')) return
    clearHistory()
    setHistory([])
  }

  if (!isUnlocked) {
    return <div className="app-shell locked"><UnlockView fullName={fullName} masterPassword={masterPassword} showMaster={showMaster} isUnlocking={isUnlocking} error={error} onFullNameChange={setFullName} onMasterPasswordChange={setMasterPassword} onToggleMaster={() => setShowMaster((value) => !value)} onSubmit={unlock} /></div>
  }

  const selectedId = history.find((entry) => entry.site === site && entry.counter === counter && entry.template === template)?.id ?? ''
  const historyProps: HistoryProps = { entries: history, search, selectedId, onClear: clearEntries, onLoad: loadEntry, onRemove: removeEntry, onSearchChange: setSearch }
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><KeyRound size={21} /></span><strong>离线密钥</strong><small>MPW v3</small></div>
        <div className="session-info"><span>{fullName}</span><button className="icon-button" type="button" onClick={lockSession} title="锁定会话" aria-label="锁定会话"><LockKeyhole size={19} /></button></div>
      </header>
      <main className="workspace">
        <section className="generator" aria-labelledby="generator-title">
          <MobileHistory {...historyProps} />
          <div className="generator-controls">
            <form onSubmit={generate}>
            <fieldset className="target-fields" aria-label="密码生成参数">
              <label className="field site-field"><span className="section-label"><Globe2 size={16} /> 网站或服务</span><input id="site-input" value={site} onChange={(event) => { setSite(event.target.value); setResult('') }} autoComplete="off" placeholder="例如 example.com" /></label>
              <details className="advanced" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
                <summary><Settings2 size={16} /><span>高级选项</span><small>{templateLabels[template].split(' · ')[0]} · 计数器 {counter}</small><ChevronDown size={16} /></summary>
                <div className="advanced-fields">
                  <label className="field"><span>密码模板</span><select value={template} onChange={(event) => setTemplate(event.target.value as TemplateName)}>{(Object.keys(TEMPLATES) as TemplateName[]).map((name) => <option key={name} value={name}>{templateLabels[name]}</option>)}</select></label>
                  <div className="field"><span>计数器</span><div className="stepper"><button type="button" onClick={() => setCounter((value) => Math.max(1, value - 1))} aria-label="减少计数器"><Minus size={16} /></button><input type="number" min="1" max="4294967295" value={counter} onChange={(event) => setCounter(Math.max(1, Number(event.target.value) || 1))} aria-label="计数器" /><button type="button" onClick={() => setCounter((value) => Math.min(0xffffffff, value + 1))} aria-label="增加计数器"><Plus size={16} /></button></div></div>
                </div>
              </details>
            </fieldset>
            {error && <div className="error" role="alert">{error}</div>}
            <div className="generate-row"><button className="primary-button" type="submit" disabled={isGenerating}>{isGenerating ? <LoaderCircle className="spin" size={19} /> : <KeyRound size={19} />}{isGenerating ? '正在生成…' : '生成密码'}</button><span>首次解锁后，生成只需瞬间</span></div>
            </form>
            <div className={`result ${result ? 'ready' : ''}`} aria-live="polite"><div><span>生成结果</span><strong className={result && !showResult ? 'masked' : ''}>{result || '等待生成'}</strong></div><div className="result-actions"><button className="icon-button" type="button" disabled={!result} onClick={() => setShowResult((value) => !value)} aria-label="显示或隐藏结果">{showResult ? <EyeOff size={18} /> : <Eye size={18} />}</button><button className="copy-button" type="button" disabled={!result} onClick={copyResult}>{copied ? <Check size={18} /> : <Clipboard size={18} />}{copied ? '已复制' : '复制'}</button></div></div>
          </div>
        </section>
        <DesktopHistory {...historyProps} />
      </main>
      <footer><span>算法版本 MPW v3</span><span>离线优先 · 无需账户 · 无网络请求</span></footer>
    </div>
  )
}

export default App