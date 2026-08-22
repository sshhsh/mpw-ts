import {
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import type { SubmitEvent } from 'react';

import BuildInfo from './BuildInfo';

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

export default UnlockView;