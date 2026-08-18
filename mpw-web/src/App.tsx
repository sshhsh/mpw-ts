import {
  Check,
  Clipboard,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { MPW, TEMPLATES, type TemplateName } from '@mpw/core'

import './App.css'
import {
  clearHistory,
  loadHistory,
  removeHistory,
  saveHistory,
  upsertHistory,
  type Purpose,
  type SiteHistoryEntry,
} from './lib/history'

type MpwInstance = Awaited<ReturnType<typeof MPW.create>>

const purposes: Array<{ value: Purpose; label: string; detail: string }> = [
  { value: 'authentication', label: '密码', detail: '登录凭据' },
  { value: 'identification', label: '用户名', detail: '身份标识' },
  { value: 'recovery', label: '安全回答', detail: '恢复答案' },
]

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

function App() {
  const [fullName, setFullName] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [site, setSite] = useState('')
  const [counter, setCounter] = useState(1)
  const [template, setTemplate] = useState<TemplateName>('long')
  const [purpose, setPurpose] = useState<Purpose>('authentication')
  const [context, setContext] = useState('')
  const [result, setResult] = useState('')
  const [showMaster, setShowMaster] = useState(false)
  const [showResult, setShowResult] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<SiteHistoryEntry[]>(loadHistory)
  const [search, setSearch] = useState('')
  const mpwRef = useRef<MpwInstance | null>(null)
  const identityRef = useRef('')

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return query
      ? history.filter((entry) => entry.site.toLocaleLowerCase().includes(query))
      : history
  }, [history, search])

  useEffect(() => {
    if (!mpwRef.current) return
    mpwRef.current.invalidate()
    mpwRef.current = null
    identityRef.current = ''
    setResult('')
  }, [fullName, masterPassword])

  useEffect(() => {
    const invalidate = () => mpwRef.current?.invalidate()
    window.addEventListener('pagehide', invalidate)
    return () => {
      window.removeEventListener('pagehide', invalidate)
      invalidate()
    }
  }, [])

  function storeHistory(entries: SiteHistoryEntry[]) {
    setHistory(entries)
    saveHistory(entries)
  }

  function lockSession() {
    mpwRef.current?.invalidate()
    mpwRef.current = null
    identityRef.current = ''
    setMasterPassword('')
    setResult('')
    setCopied(false)
    setError('')
  }

  function selectPurpose(next: Purpose) {
    setPurpose(next)
    if (next === 'identification') setTemplate('name')
    else if (next === 'recovery') setTemplate('phrase')
    else setTemplate('long')
    setResult('')
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault()
    const name = fullName.trim()
    const target = site.trim()
    if (!name || !masterPassword || !target) {
      setError('请完整填写姓名、主密码和网站。')
      return
    }

    setIsGenerating(true)
    setError('')
    setCopied(false)
    try {
      const identity = `${name}\u0000${masterPassword}`
      if (!mpwRef.current || identityRef.current !== identity) {
        mpwRef.current?.invalidate()
        mpwRef.current = await MPW.create(name, masterPassword)
        identityRef.current = identity
      }

      const options = { counter, context, template }
      const generated =
        purpose === 'identification'
          ? await mpwRef.current.generateIdentification(target, options)
          : purpose === 'recovery'
            ? await mpwRef.current.generateRecovery(target, options)
            : await mpwRef.current.generateAuthentication(target, options)

      setResult(generated)
      setShowResult(true)
      storeHistory(
        upsertHistory(history, {
          site: target,
          counter,
          template,
          purpose,
          context,
        }),
      )
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
    } catch {
      setError('无法访问剪贴板，请手动复制。')
    }
  }

  function loadEntry(entry: SiteHistoryEntry) {
    setSite(entry.site)
    setCounter(entry.counter)
    setTemplate(entry.template)
    setPurpose(entry.purpose)
    setContext(entry.context)
    setResult('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><KeyRound size={21} /></span>
          <strong>离线密钥</strong>
          <small>MPW v3</small>
        </div>
        <button className="icon-button" type="button" onClick={lockSession} title="锁定会话" aria-label="锁定会话">
          <LockKeyhole size={19} />
        </button>
      </header>

      <main className="workspace">
        <section className="generator" aria-labelledby="generator-title">
          <div className="intro">
            <div>
              <span className="eyebrow">确定性凭据生成器</span>
              <h1 id="generator-title">需要时生成，用完即忘</h1>
            </div>
            <p><ShieldCheck size={18} /> 所有计算仅在此设备完成</p>
          </div>

          <form onSubmit={generate}>
            <fieldset>
              <legend><span>01</span> 你的身份</legend>
              <div className="field-grid identity-grid">
                <label className="field">
                  <span>完整姓名</span>
                  <div className="input-shell">
                    <UserRound size={18} />
                    <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="与其他设备保持完全一致" />
                  </div>
                </label>
                <label className="field">
                  <span>主密码</span>
                  <div className="input-shell">
                    <LockKeyhole size={18} />
                    <input type={showMaster ? 'text' : 'password'} value={masterPassword} onChange={(event) => setMasterPassword(event.target.value)} autoComplete="current-password" placeholder="不会被保存" />
                    <button type="button" onClick={() => setShowMaster((value) => !value)} title={showMaster ? '隐藏主密码' : '显示主密码'} aria-label={showMaster ? '隐藏主密码' : '显示主密码'}>
                      {showMaster ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend><span>02</span> 目标凭据</legend>
              <div className="purpose-tabs" role="radiogroup" aria-label="凭据用途">
                {purposes.map((item) => (
                  <button key={item.value} type="button" role="radio" aria-checked={purpose === item.value} className={purpose === item.value ? 'active' : ''} onClick={() => selectPurpose(item.value)}>
                    <strong>{item.label}</strong><small>{item.detail}</small>
                  </button>
                ))}
              </div>

              <div className="field-grid site-grid">
                <label className="field site-field">
                  <span>网站或服务</span>
                  <input value={site} onChange={(event) => { setSite(event.target.value); setResult('') }} autoComplete="off" placeholder="例如 example.com" />
                </label>
                <label className="field">
                  <span>模板</span>
                  <select value={template} onChange={(event) => setTemplate(event.target.value as TemplateName)}>
                    {(Object.keys(TEMPLATES) as TemplateName[]).map((name) => <option key={name} value={name}>{templateLabels[name]}</option>)}
                  </select>
                </label>
                <div className="field">
                  <span>计数器</span>
                  <div className="stepper">
                    <button type="button" onClick={() => setCounter((value) => Math.max(1, value - 1))} aria-label="减少计数器"><Minus size={16} /></button>
                    <input type="number" min="1" max="4294967295" value={counter} onChange={(event) => setCounter(Math.max(1, Number(event.target.value) || 1))} aria-label="计数器" />
                    <button type="button" onClick={() => setCounter((value) => Math.min(0xffffffff, value + 1))} aria-label="增加计数器"><Plus size={16} /></button>
                  </div>
                </div>
              </div>

              {purpose === 'recovery' && (
                <label className="field context-field">
                  <span>问题上下文</span>
                  <input value={context} onChange={(event) => setContext(event.target.value)} placeholder="例如：第一只宠物的名字" />
                </label>
              )}
            </fieldset>

            {error && <div className="error" role="alert">{error}</div>}
            <div className="generate-row">
              <button className="primary-button" type="submit" disabled={isGenerating}>
                {isGenerating ? <LoaderCircle className="spin" size={19} /> : <KeyRound size={19} />}
                {isGenerating ? '正在派生密钥…' : '生成凭据'}
              </button>
              <span>首次生成约需数秒</span>
            </div>
          </form>

          <div className={`result ${result ? 'ready' : ''}`} aria-live="polite">
            <div><span>生成结果</span><strong className={showResult ? '' : 'masked'}>{result || '等待生成'}</strong></div>
            <div className="result-actions">
              <button className="icon-button" type="button" disabled={!result} onClick={() => setShowResult((value) => !value)} aria-label="显示或隐藏结果">{showResult ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              <button className="copy-button" type="button" disabled={!result} onClick={copyResult}>{copied ? <Check size={18} /> : <Clipboard size={18} />}{copied ? '已复制' : '复制'}</button>
            </div>
          </div>
        </section>

        <aside className="history" aria-labelledby="history-title">
          <div className="history-heading">
            <div><span className="eyebrow">仅保存在本机</span><h2 id="history-title">最近网站</h2></div>
            {history.length > 0 && <button className="icon-button quiet" type="button" onClick={() => { if (window.confirm('清除全部网站历史？')) { clearHistory(); setHistory([]) } }} aria-label="清除全部历史"><Trash2 size={17} /></button>}
          </div>
          <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索网站" aria-label="搜索网站历史" /></label>
          <div className="history-list">
            {filteredHistory.length === 0 ? (
              <div className="empty"><KeyRound size={25} /><strong>{search ? '没有匹配的网站' : '尚无网站历史'}</strong><span>成功生成后会出现在这里</span></div>
            ) : filteredHistory.map((entry) => (
              <article className="history-item" key={entry.id}>
                <button className="history-load" type="button" onClick={() => loadEntry(entry)}>
                  <span className="monogram">{entry.site.charAt(0).toUpperCase()}</span>
                  <span><strong>{entry.site}</strong><small>{purposes.find((item) => item.value === entry.purpose)?.label} · {templateLabels[entry.template].split(' · ')[0]} · {relativeTime(entry.lastUsedAt)}</small></span>
                </button>
                <button className="delete-button" type="button" onClick={() => storeHistory(removeHistory(history, entry.id))} aria-label={`删除 ${entry.site}`}><X size={15} /></button>
              </article>
            ))}
          </div>
          <div className="storage-note"><ShieldCheck size={17} /><p><strong>历史中不含敏感信息</strong><span>姓名、主密码和生成结果永不写入浏览器存储。</span></p></div>
        </aside>
      </main>
      <footer><span>算法版本 MPW v3</span><span>离线优先 · 无需账户 · 无网络请求</span></footer>
    </div>
  )
}

export default App
