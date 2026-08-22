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
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import type { SiteHistoryEntry } from "../lib/history";
import { decryptHistory, encryptHistory } from "../lib/historyTransfer";
import type { MpwInstance } from "../lib/mpwTypes";
import { useLanguage } from "../lib/useLanguage";
import {
  createCameraScanner,
  createQrFrames,
  QrFrameCollector,
  renderQrFrame,
  scanQrImage,
  type QrScanner,
} from "../lib/qrTransfer";

type TransferMode =
  "menu" | "export" | "import" | "text-export" | "text-import";

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
  const { t } = useLanguage();
  const [mode, setMode] = useState<TransferMode>("menu");
  const [frames, setFrames] = useState<string[]>([]);
  const [transferText, setTransferText] = useState("");
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState("");
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [transferError, setTransferError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const collectorRef = useRef(new QrFrameCollector());
  const processingRef = useRef(false);

  useEffect(() => {
    if (!frames.length || !canvasRef.current) return;
    void renderQrFrame(canvasRef.current, frames[frameIndex]).catch(() => {
      setTransferError(t("transfer.qrGenerateFailed"));
    });
  }, [frameIndex, frames, t]);

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

  async function runTransfer<T>(
    operation: () => Promise<T>,
    fallback = t("transfer.failed"),
  ): Promise<T | null> {
    setTransferError("");
    setIsProcessingTransfer(true);
    try {
      return await operation();
    } catch (cause) {
      setTransferError(cause instanceof Error ? cause.message : fallback);
      return null;
    } finally {
      setIsProcessingTransfer(false);
    }
  }

  function createEncryptedTransfer(): Promise<string> {
    return withTransferKey((key) => encryptHistory(entries, key));
  }

  function resetFeedback(): void {
    setProgress("");
    setTransferError("");
  }

  function resetScanner(): void {
    scannerRef.current?.destroy();
    scannerRef.current = null;
    collectorRef.current.reset();
  }

  function returnToMenu(): void {
    resetScanner();
    resetFeedback();
    setTransferText("");
    setFrames([]);
    setMode("menu");
  }

  async function exportHistory() {
    const encoded = await runTransfer(createEncryptedTransfer);
    if (encoded === null) return;
    setFrames(createQrFrames(encoded));
    setFrameIndex(0);
    setPlaying(true);
    setMode("export");
  }

  async function exportText() {
    const encoded = await runTransfer(createEncryptedTransfer);
    if (encoded === null) return;
    setTransferText(encoded);
    setMode("text-export");
  }

  async function importText() {
    const encoded = transferText.trim();
    if (!encoded) {
      setTransferError(t("transfer.pasteRequired"));
      return;
    }
    const imported = await runTransfer(() =>
      withTransferKey((key) => decryptHistory(encoded, key)),
    );
    if (imported === null) return;
    onImport(imported);
    setProgress(t("transfer.merged", { count: imported.length }));
    setTransferText("");
  }

  async function copyTransferText() {
    try {
      await navigator.clipboard.writeText(transferText);
      setProgress(t("transfer.copied"));
      setTransferError("");
    } catch {
      setTransferError(t("transfer.clipboardFailed"));
    }
  }

  async function consumeFrame(value: string) {
    if (processingRef.current) return;
    try {
      const result = collectorRef.current.add(value);
      if (result.added) {
        setProgress(
          t("transfer.collected", {
            received: result.received,
            total: result.total,
          }),
        );
      }
      if (!result.complete) return;
      processingRef.current = true;
      scannerRef.current?.stop();
      const imported = await runTransfer(
        () => withTransferKey((key) => decryptHistory(result.complete!, key)),
        t("transfer.qrReadFailed"),
      );
      if (imported === null) return;
      onImport(imported);
      setProgress(t("transfer.merged", { count: imported.length }));
    } catch (cause) {
      setTransferError(
        cause instanceof Error ? cause.message : t("transfer.qrReadFailed"),
      );
    } finally {
      processingRef.current = false;
    }
  }

  async function startCamera() {
    setTransferError("");
    setMode("import");
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    if (!videoRef.current) return;
    resetScanner();
    const scanner = createCameraScanner(
      videoRef.current,
      (value) => void consumeFrame(value),
    );
    scannerRef.current = scanner;
    try {
      await scanner.start();
    } catch {
      setTransferError(t("transfer.cameraFailed"));
    }
  }

  async function importImages(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    if (!files.length) return;
    setMode("import");
    setTransferError("");
    for (const file of files) {
      try {
        await consumeFrame(await scanQrImage(file));
      } catch (cause) {
        setTransferError(
          cause instanceof Error ? cause.message : t("transfer.imageFailed"),
        );
        break;
      }
    }
    event.target.value = "";
  }

  function closeTransfer() {
    resetScanner();
    onClose();
  }

  return (
    <div
      className={`transfer-backdrop ${mode === "import" ? "scanning" : ""}`}
      role="presentation"
    >
      <section
        className={`transfer-dialog ${mode === "export" ? "exporting-qr" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-title"
      >
        <div className="transfer-heading">
          <div>
            <QrCode size={18} />
            <h2 id="transfer-title">{t("app.migrate")}</h2>
          </div>
          <button
            className="icon-button quiet"
            type="button"
            onClick={closeTransfer}
            aria-label={t("transfer.close")}
          >
            <X size={18} />
          </button>
        </div>
        {mode === "menu" && (
          <div className="transfer-menu">
            <p>{t("transfer.description")}</p>
            <div className="transfer-option-group" aria-labelledby="qr-options">
              <h3 id="qr-options">{t("transfer.qr")}</h3>
              <button
                className="transfer-option"
                type="button"
                onClick={() => void exportHistory()}
                disabled={entries.length === 0 || isProcessingTransfer}
              >
                {isProcessingTransfer ? (
                  <LoaderCircle className="spin" size={22} />
                ) : (
                  <QrCode size={22} />
                )}
                <span>
                  <strong>
                    {isProcessingTransfer
                      ? t("transfer.encrypting")
                      : t("transfer.exportQr")}
                  </strong>
                  <small>
                    {t("transfer.exportQrDetail", { count: entries.length })}
                  </small>
                </span>
              </button>
              <button
                className="transfer-option"
                type="button"
                onClick={() => void startCamera()}
              >
                <ScanLine size={22} />
                <span>
                  <strong>{t("transfer.scanCamera")}</strong>
                  <small>{t("transfer.scanCameraDetail")}</small>
                </span>
              </button>
              <label className="transfer-option">
                <Upload size={22} />
                <span>
                  <strong>{t("transfer.chooseQr")}</strong>
                  <small>{t("transfer.chooseQrDetail")}</small>
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
              <h3 id="text-options">{t("transfer.text")}</h3>
              <button
                className="transfer-option"
                type="button"
                onClick={() => void exportText()}
                disabled={entries.length === 0 || isProcessingTransfer}
              >
                <FileText size={22} />
                <span>
                  <strong>{t("transfer.exportText")}</strong>
                  <small>
                    {t("transfer.exportTextDetail", { count: entries.length })}
                  </small>
                </span>
              </button>
              <button
                className="transfer-option"
                type="button"
                onClick={() => {
                  resetFeedback();
                  setTransferText("");
                  setMode("text-import");
                }}
              >
                <Clipboard size={22} />
                <span>
                  <strong>{t("transfer.importText")}</strong>
                  <small>{t("transfer.importTextDetail")}</small>
                </span>
              </button>
            </div>
          </div>
        )}
        {mode === "export" && (
          <div className="transfer-export">
            <canvas
              ref={canvasRef}
              aria-label={t("transfer.frame", {
                current: frameIndex + 1,
                total: frames.length,
              })}
            />
            <div className="transfer-counter">
              {t("transfer.frame", {
                current: frameIndex + 1,
                total: frames.length,
              })}
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
                aria-label={t("transfer.previousQr")}
              >
                <SkipBack size={18} />
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={() => setPlaying((value) => !value)}
                aria-label={
                  playing ? t("transfer.pauseQr") : t("transfer.resumeQr")
                }
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={() =>
                  setFrameIndex((value) => (value + 1) % frames.length)
                }
                aria-label={t("transfer.nextQr")}
              >
                <SkipForward size={18} />
              </button>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={returnToMenu}
            >
              {t("transfer.back")}
            </button>
          </div>
        )}
        {mode === "import" && (
          <div className="transfer-import">
            <video ref={videoRef} muted playsInline />
            <div className="transfer-progress">
              {progress || t("transfer.scanPrompt")}
            </div>
            <label className="primary-button">
              <Upload size={18} />
              {t("transfer.chooseQr")}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => void importImages(event)}
              />
            </label>
            <button
              className="text-button"
              type="button"
              onClick={returnToMenu}
            >
              {t("transfer.restart")}
            </button>
          </div>
        )}
        {mode === "text-export" && (
          <div className="transfer-text">
            <textarea
              value={transferText}
              readOnly
              aria-label={t("transfer.textExported")}
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="transfer-progress">
              {progress || t("transfer.copyPrompt")}
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => void copyTransferText()}
            >
              <Clipboard size={18} />
              {t("transfer.copyText")}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={returnToMenu}
            >
              {t("transfer.back")}
            </button>
          </div>
        )}
        {mode === "text-import" && (
          <div className="transfer-text">
            <textarea
              value={transferText}
              onChange={(event) => setTransferText(event.target.value)}
              placeholder={t("transfer.importPlaceholder")}
              aria-label={t("transfer.importLabel")}
              autoFocus
            />
            {progress && <div className="transfer-progress">{progress}</div>}
            <button
              className="primary-button"
              type="button"
              disabled={!transferText.trim() || isProcessingTransfer}
              onClick={() => void importText()}
            >
              {isProcessingTransfer ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Clipboard size={18} />
              )}
              {isProcessingTransfer
                ? t("transfer.decrypting")
                : t("transfer.importMerge")}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={returnToMenu}
            >
              {t("transfer.back")}
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
