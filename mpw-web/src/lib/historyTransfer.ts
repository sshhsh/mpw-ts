import { parseHistoryEntry, type SiteHistoryEntry } from './history';

const PROTOCOL_VERSION = 1;
const PROTOCOL_PURPOSE = 'mpw-history-transfer';
const MAX_ENCODED_BYTES = 2 * 1024 * 1024;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8', { fatal: true });

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

interface TransferEnvelope {
  v: number;
  p: string;
  n: string;
  c: string;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid encoding');
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function transform(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const source = new ReadableStream<ArrayBuffer>({
    start(controller) {
      controller.enqueue(asBufferSource(bytes));
      controller.close();
    },
  });
  const result = await new Response(source.pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(result);
}

function authenticatedHeader(): Uint8Array {
  return textEncoder.encode(`${PROTOCOL_PURPOSE}:${PROTOCOL_VERSION}`);
}

async function importAesKey(
  keyBytes: Uint8Array,
  usage: KeyUsage,
): Promise<CryptoKey> {
  if (keyBytes.length !== 32) throw new Error('Invalid transfer key');
  return crypto.subtle.importKey(
    'raw',
    asBufferSource(keyBytes),
    'AES-GCM',
    false,
    [usage],
  );
}

export async function encryptHistory(
  entries: SiteHistoryEntry[],
  keyBytes: Uint8Array,
): Promise<string> {
  const serialized = textEncoder.encode(JSON.stringify(entries));
  if (serialized.length > MAX_ENCODED_BYTES) {
    throw new Error('历史数据过大，无法导出。');
  }
  const compressed = await transform(serialized, new CompressionStream('gzip'));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await importAesKey(keyBytes, 'encrypt');
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: asBufferSource(nonce),
      additionalData: asBufferSource(authenticatedHeader()),
    },
    key,
    asBufferSource(compressed),
  );
  const envelope: TransferEnvelope = {
    v: PROTOCOL_VERSION,
    p: PROTOCOL_PURPOSE,
    n: toBase64Url(nonce),
    c: toBase64Url(new Uint8Array(ciphertext)),
  };
  return toBase64Url(textEncoder.encode(JSON.stringify(envelope)));
}

export async function decryptHistory(
  encoded: string,
  keyBytes: Uint8Array,
): Promise<SiteHistoryEntry[]> {
  try {
    if (encoded.length > MAX_ENCODED_BYTES * 2)
      throw new Error('Oversized data');
    const envelope = JSON.parse(
      textDecoder.decode(fromBase64Url(encoded)),
    ) as Partial<TransferEnvelope>;
    if (
      envelope.v !== PROTOCOL_VERSION ||
      envelope.p !== PROTOCOL_PURPOSE ||
      typeof envelope.n !== 'string' ||
      typeof envelope.c !== 'string'
    ) {
      throw new Error('Invalid envelope');
    }
    const nonce = fromBase64Url(envelope.n);
    if (nonce.length !== 12) throw new Error('Invalid nonce');
    const key = await importAesKey(keyBytes, 'decrypt');
    const compressed = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: asBufferSource(nonce),
        additionalData: asBufferSource(authenticatedHeader()),
      },
      key,
      asBufferSource(fromBase64Url(envelope.c)),
    );
    const serialized = await transform(
      new Uint8Array(compressed),
      new DecompressionStream('gzip'),
    );
    if (serialized.length > MAX_ENCODED_BYTES)
      throw new Error('Oversized data');
    const parsed: unknown = JSON.parse(textDecoder.decode(serialized));
    if (!Array.isArray(parsed)) throw new Error('Invalid history');
    const entries = parsed.map(parseHistoryEntry);
    if (entries.some((entry) => entry === null))
      throw new Error('Invalid entry');
    return entries as SiteHistoryEntry[];
  } catch {
    throw new Error('身份不匹配或迁移数据已损坏。');
  }
}

export { MAX_ENCODED_BYTES, PROTOCOL_VERSION };
