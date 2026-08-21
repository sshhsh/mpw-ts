import {
  Clipboard,
  FileText,
  LoaderCircle,
  Pause,
  Play,
  QrCode,
  ScanLine,
  SkipBack,
  SkipForward,
  Upload,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import { MPW } from '@mpw/core/worker';

import type { SiteHistoryEntry } from '../lib/history';
import { decryptHistory, encryptHistory } from '../lib/historyTransfer';
import {
  createCameraScanner,
  createQrFrames,
  QrFrameCollector,
  renderQrFrame,
  scanQrImage,
  type QrScanner,
} from '../lib/qrTransfer';

type MpwInstance = Awaited<ReturnType<typeof MPW.create>>;
type TransferMode =
  | 'menu'
  | 'export'
  | 'import'
  | 'text-export'
  | 'text-import';

interface HistoryTransferProps {
  entries: SiteHistoryEntry[];
  mpw: MpwInstance;
  onClose: () => void;
  onImport: (entries: SiteHistoryEntry[]) => void;
}

function HistoryTransfer({
  entries,
  mpw,
  onClose,
  onImport,
}: HistoryTransferProps) {
  const [mode, setMode] = useState<TransferMode>('menu');
  const [frames, setFrames] = useState<string[]>([]);
  const [transferText, setTransferText] = useState('');
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState('');
  const [exporting, setExporting] = useState(false);
  const [transferError, setTransferError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const collectorRef = useRef(new QrFrameCollector());
  const processingRef = useRef(false);

  useEffect(() => {
    if (!frames.length || !canvasRef.current) return;
    void renderQrFrame(canvasRef.current, frames[frameIndex]).catch(() => {
      setTransferError('无法生成二维码。');
    });
  }, [frameIndex, frames]);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = window.setInterval(
      () => setFrameIndex((value) => (value + 1) % frames.length),
      1400,
    );
    return () => window.clearInterval(timer);
  }, [frames.length, playing]);

  useEffect(
    () => () => {
      scannerRef.current?.destroy();
      collectorRef.current.reset();
    },
    [],
  );

  async function withTransferKey<T>(
    operation: (key: Uint8Array) => Promise<T>,
  ): Promise<T> {
    const key = await mpw.deriveHistoryTransferKey();
    try {
      return await operation(key);
    } finally {
      key.fill(0);
    }
  }

  async function runTransfer<T>(operation: () => Promise<T>): Promise<T> {
    setTransferError('');
    setExporting(true);
    try {
      return await operation();
    } catch (cause) {
      setTransferError(
        cause instanceof Error ? cause.message : '无法迁移历史。',
      );
      throw cause;
    } finally {
      setExporting(false);
    }
  }

  function createEncryptedTransfer(): Promise<string> {
    return withTransferKey((key) => encryptHistory(entries, key));
  }

  function resetFeedback(): void {
    setProgress('');
    setTransferError('');
  }

  function resetScanner(): void {
    scannerRef.current?.destroy();
    scannerRef.current = null;
    collectorRef.current.reset();
  }

  function returnToMenu(): void {
    resetScanner();
    resetFeedback();
    setTransferText('');
    setFrames([]);
    setMode('menu');
  }

  async function exportHistory() {
    try {
      const encoded = await runTransfer(createEncryptedTransfer);
      setFrames(createQrFrames(encoded));
      setFrameIndex(0);
      setPlaying(true);
      setMode('export');
    } catch {
      // Feedback is handled by runTransfer.
    }
  }

  async function exportText() {
    try {
      setTransferText(await runTransfer(createEncryptedTransfer));
      setMode('text-export');
    } catch {
      // Feedback is handled by runTransfer.
    }
  }

  async function importText() {
    const encoded = transferText.trim();
    if (!encoded) {
      setTransferError('请粘贴迁移文本。');
      return;
    }
    try {
      const imported = await runTransfer(() =>
        withTransferKey((key) => decryptHistory(encoded, key)),
      );
      onImport(imported);
      setProgress(`已合并 ${imported.length} 条历史`);
      setTransferText('');
    } catch {
      // Feedback is handled by runTransfer.
    }
  }

  async function copyTransferText() {
    try {
      await navigator.clipboard.writeText(transferText);
      setProgress('迁移文本已复制');
      setTransferError('');
    } catch {
      setTransferError('无法访问剪贴板，请手动复制。');
    }
  }

  async function consumeFrame(value: string) {
    if (processingRef.current) return;
    try {
      const result = collectorRef.current.add(value);
      if (result.added) {
        setProgress(`已收集 ${result.received} / ${result.total} 张`);
      }
      if (!result.complete) return;
      processingRef.current = true;
      scannerRef.current?.stop();
      const imported = await withTransferKey((key) =>
        decryptHistory(result.complete!, key),
      );
      onImport(imported);
      setProgress(`已合并 ${imported.length} 条历史`);
    } catch (cause) {
      setTransferError(
        cause instanceof Error ? cause.message : '无法读取二维码。',
      );
    } finally {
      processingRef.current = false;
    }
  }

  async function startCamera() {
    setTransferError('');
    setMode('import');
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    if (!videoRef.current) return;
    resetScanner();
    const scanner = createCameraScanner(
      videoRef.current,
      (value) => void consumeFrame(value),
      () => undefined,
    );
    scannerRef.current = scanner;
    try {
      await scanner.start();
    } catch {
      setTransferError('无法打开摄像头，请允许权限或选择二维码图片。');
    }
  }

  async function importImages(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    if (!files.length) return;
    setMode('import');
    setTransferError('');
    for (const file of files) {
      try {
        await consumeFrame(await scanQrImage(file));
      } catch (cause) {
        setTransferError(
          cause instanceof Error ? cause.message : '图片中没有可用二维码。',
        );
        break;
      }
    }
    event.target.value = '';
  }

  function closeTransfer() {
    resetScanner();
    onClose();
  }

  return (
    <div
      className={`transfer-backdrop ${mode === 'import' ? 'scanning' : ''}`}
      role="presentation"
    >
      <section
        className={`transfer-dialog ${mode === 'export' ? 'exporting-qr' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-title"
      >
        <div className="transfer-heading">
          <div>
            <QrCode size={18} />
            <h2 id="transfer-title">迁移网站历史</h2>
          </div>
          <button
            className="icon-button quiet"
            type="button"
            onClick={closeTransfer}
            aria-label="关闭历史迁移"
          >
            <X size={18} />
          </button>
        </div>
        {mode === 'menu' && (
          <div className="transfer-menu">
            <p>
              迁移数据使用当前身份加密，只能由相同姓名和主密码解锁的设备导入。
            </p>
            <div className="transfer-option-group" aria-labelledby="qr-options">
              <h3 id="qr-options">二维码</h3>
              <button
                className="transfer-option"
                type="button"
                onClick={() => void exportHistory()}
                disabled={entries.length === 0 || exporting}
              >
                {exporting ? (
                  <LoaderCircle className="spin" size={22} />
                ) : (
                  <QrCode size={22} />
                )}
                <span>
                  <strong>
                    {exporting ? '正在加密历史…' : '显示迁移二维码'}
                  </strong>
                  <small>导出全部 {entries.length} 条历史</small>
                </span>
              </button>
              <button
                className="transfer-option"
                type="button"
                onClick={() => void startCamera()}
              >
                <ScanLine size={22} />
                <span>
                  <strong>使用摄像头扫描</strong>
                  <small>手机建议使用后置摄像头</small>
                </span>
              </button>
              <label className="transfer-option">
                <Upload size={22} />
                <span>
                  <strong>选择二维码图片</strong>
                  <small>电脑可一次选择多张截图</small>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void importImages(event)}
                />
              </label>
            </div>
            <div
              className="transfer-option-group"
              aria-labelledby="text-options"
            >
              <h3 id="text-options">文本</h3>
              <button
                className="transfer-option"
                type="button"
                onClick={() => void exportText()}
                disabled={entries.length === 0 || exporting}
              >
                <FileText size={22} />
                <span>
                  <strong>导出迁移文本</strong>
                  <small>复制全部 {entries.length} 条加密历史</small>
                </span>
              </button>
              <button
                className="transfer-option"
                type="button"
                onClick={() => {
                  resetFeedback();
                  setTransferText('');
                  setMode('text-import');
                }}
              >
                <Clipboard size={22} />
                <span>
                  <strong>导入迁移文本</strong>
                  <small>粘贴另一台设备导出的加密文本</small>
                </span>
              </button>
            </div>
          </div>
        )}
        {mode === 'export' && (
          <div className="transfer-export">
            <canvas
              ref={canvasRef}
              aria-label={`迁移二维码 ${frameIndex + 1}/${frames.length}`}
            />
            <div className="transfer-counter">
              第 {frameIndex + 1} / {frames.length} 张
            </div>
            <div className="transfer-controls">
              <button
                className="icon-button"
                type="button"
                onClick={() =>
                  setFrameIndex(
                    (value) => (value - 1 + frames.length) % frames.length,
                  )
                }
                aria-label="上一张二维码"
              >
                <SkipBack size={18} />
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={() => setPlaying((value) => !value)}
                aria-label={playing ? '暂停二维码轮播' : '继续二维码轮播'}
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={() =>
                  setFrameIndex((value) => (value + 1) % frames.length)
                }
                aria-label="下一张二维码"
              >
                <SkipForward size={18} />
              </button>
            </div>
            <button className="text-button" type="button" onClick={returnToMenu}>
              返回
            </button>
          </div>
        )}
        {mode === 'import' && (
          <div className="transfer-import">
            <video ref={videoRef} muted playsInline />
            <div className="transfer-progress">
              {progress || '扫描或选择同一批次的全部二维码'}
            </div>
            <label className="primary-button">
              <Upload size={18} />
              选择二维码图片
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => void importImages(event)}
              />
            </label>
            <button className="text-button" type="button" onClick={returnToMenu}>
              重新开始
            </button>
          </div>
        )}
        {mode === 'text-export' && (
          <div className="transfer-text">
            <textarea
              value={transferText}
              readOnly
              aria-label="导出的迁移文本"
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="transfer-progress">
              {progress || '复制这段加密文本到另一台设备'}
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => void copyTransferText()}
            >
              <Clipboard size={18} />
              复制迁移文本
            </button>
            <button className="text-button" type="button" onClick={returnToMenu}>
              返回
            </button>
          </div>
        )}
        {mode === 'text-import' && (
          <div className="transfer-text">
            <textarea
              value={transferText}
              onChange={(event) => setTransferText(event.target.value)}
              placeholder="粘贴迁移文本"
              aria-label="要导入的迁移文本"
              autoFocus
            />
            {progress && <div className="transfer-progress">{progress}</div>}
            <button
              className="primary-button"
              type="button"
              disabled={!transferText.trim() || exporting}
              onClick={() => void importText()}
            >
              {exporting ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Clipboard size={18} />
              )}
              {exporting ? '正在解密历史…' : '导入并合并'}
            </button>
            <button className="text-button" type="button" onClick={returnToMenu}>
              返回
            </button>
          </div>
        )}
        {transferError && (
          <div className="error transfer-error" role="alert">
            {transferError}
          </div>
        )}
      </section>
    </div>
  );
}

export default HistoryTransfer;
