import QRCode from 'qrcode'
import QrScanner from 'qr-scanner'

import type { SiteHistoryEntry } from './history'

const FRAME_VERSION = 1
const DEFAULT_CHUNK_SIZE = 700
const MAX_FRAMES = 10_000

export interface QrTransferFrame {
  v: number
  b: string
  i: number
  t: number
  d: string
}

export interface QrTransferProgress {
  batchId: string
  received: number
  total: number
  added: boolean
}

function randomBatchId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9))
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

function digest(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function createQrFrames(
  encoded: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
): string[] {
  if (!encoded || !Number.isInteger(chunkSize) || chunkSize < 100) {
    throw new Error('Invalid QR payload')
  }
  const total = Math.ceil(encoded.length / chunkSize)
  if (total > MAX_FRAMES) throw new Error('二维码帧数过多。')
  const batchId = randomBatchId()
  const checksum = digest(encoded)
  return Array.from({ length: total }, (_, index) =>
    JSON.stringify({
      v: FRAME_VERSION,
      b: batchId,
      i: index,
      t: total,
      d: `${checksum}.${encoded.slice(index * chunkSize, (index + 1) * chunkSize)}`,
    } satisfies QrTransferFrame),
  )
}

export function parseQrFrame(value: string): QrTransferFrame {
  const parsed: unknown = JSON.parse(value)
  if (typeof parsed !== 'object' || parsed === null) throw new Error('二维码格式无效。')
  const frame = parsed as Partial<QrTransferFrame>
  if (
    frame.v !== FRAME_VERSION ||
    typeof frame.b !== 'string' ||
    !/^[A-Za-z0-9_-]{8,32}$/.test(frame.b) ||
    typeof frame.i !== 'number' ||
    !Number.isInteger(frame.i) ||
    typeof frame.t !== 'number' ||
    !Number.isInteger(frame.t) ||
    frame.t < 1 ||
    frame.t > MAX_FRAMES ||
    frame.i < 0 ||
    frame.i >= frame.t ||
    typeof frame.d !== 'string'
  ) {
    throw new Error('二维码格式无效。')
  }
  return frame as QrTransferFrame
}

export class QrFrameCollector {
  private batchId = ''
  private total = 0
  private checksum = ''
  private complete = false
  private readonly frames = new Map<number, string>()

  add(value: string): QrTransferProgress & { complete?: string } {
    const frame = parseQrFrame(value)
    const separator = frame.d.indexOf('.')
    if (separator <= 0) throw new Error('二维码校验信息无效。')
    const checksum = frame.d.slice(0, separator)
    const payload = frame.d.slice(separator + 1)
    if (!this.batchId) {
      this.batchId = frame.b
      this.total = frame.t
      this.checksum = checksum
    }
    if (frame.b !== this.batchId || frame.t !== this.total || checksum !== this.checksum) {
      throw new Error('二维码不属于当前迁移批次。')
    }
    const added = !this.frames.has(frame.i)
    this.frames.set(frame.i, payload)
    const progress = {
      batchId: this.batchId,
      received: this.frames.size,
      total: this.total,
      added,
    }
    if (this.complete || this.frames.size !== this.total) return progress
    const encoded = Array.from({ length: this.total }, (_, index) => this.frames.get(index)).join('')
    if (digest(encoded) !== this.checksum) throw new Error('二维码数据校验失败。')
    this.complete = true
    return { ...progress, complete: encoded }
  }

  reset(): void {
    this.batchId = ''
    this.total = 0
    this.checksum = ''
    this.complete = false
    this.frames.clear()
  }
}

export function renderQrFrame(canvas: HTMLCanvasElement, frame: string): Promise<void> {
  return QRCode.toCanvas(canvas, frame, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: { dark: '#15352d', light: '#ffffff' },
  })
}

export async function scanQrImage(file: File): Promise<string> {
  const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
  return result.data
}

export function createCameraScanner(
  video: HTMLVideoElement,
  onDecode: (value: string) => void,
  onError: (message: string) => void,
): QrScanner {
  return new QrScanner(
    video,
    (result) => onDecode(result.data),
    {
      preferredCamera: 'environment',
      maxScansPerSecond: 2,
      calculateScanRegion: (video) => {
        const size = Math.round(Math.min(video.videoWidth, video.videoHeight) * 0.7)
        return {
          x: Math.round((video.videoWidth - size) / 2),
          y: Math.round((video.videoHeight - size) / 2),
          width: size,
          height: size,
          downScaledWidth: 320,
          downScaledHeight: 320,
        }
      },
      returnDetailedScanResult: true,
      onDecodeError: (error) => {
        if (error instanceof Error) onError(error.message)
      },
    },
  )
}

export { DEFAULT_CHUNK_SIZE, FRAME_VERSION, MAX_FRAMES }

export type { SiteHistoryEntry }
export type { QrScanner }