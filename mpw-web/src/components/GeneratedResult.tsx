import { Check, Clipboard, Eye, EyeOff } from 'lucide-react';

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
  return (
    <div className={`result ${result ? 'ready' : ''}`} aria-live="polite">
      <div>
        <span>生成结果</span>
        <strong className={result && !showResult ? 'masked' : ''}>
          {result || '等待生成'}
        </strong>
      </div>
      <div className="result-actions">
        <button
          className="icon-button"
          type="button"
          disabled={!result}
          onClick={onToggleVisibility}
          aria-label="显示或隐藏结果"
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
          {copied ? '已复制' : '复制'}
        </button>
      </div>
    </div>
  );
}

export default GeneratedResult;