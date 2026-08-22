import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function UpdatePrompt() {
  const { needRefresh: refreshState, updateServiceWorker } = useRegisterSW();
  const [needRefresh, setNeedRefresh] = refreshState;

  if (!needRefresh) return null;

  return (
    <aside className="update-prompt" role="status" aria-live="polite">
      <div className="update-prompt-copy">
        <strong>发现新版本</strong>
        <span>更新会刷新页面，当前会话需要重新解锁。</span>
      </div>
      <div className="update-prompt-actions">
        <button
          className="update-prompt-dismiss"
          type="button"
          onClick={() => setNeedRefresh(false)}
        >
          稍后
        </button>
        <button
          className="update-prompt-confirm"
          type="button"
          onClick={() => void updateServiceWorker(true)}
        >
          <RefreshCw size={15} />
          立即更新
        </button>
        <button
          className="update-prompt-close"
          type="button"
          onClick={() => setNeedRefresh(false)}
          title="关闭更新提示"
          aria-label="关闭更新提示"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}

export default UpdatePrompt;