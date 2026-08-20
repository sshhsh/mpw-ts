import { scrypt } from './scrypt.js';
import type { CryptoProvider } from './types.js';

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

async function pbkdf2Sha256(
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  keyLength: number,
): Promise<Uint8Array> {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    asBufferSource(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const result = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: asBufferSource(salt),
      iterations,
    },
    key,
    keyLength * 8,
  );
  return new Uint8Array(result);
}

export function createBrowserCryptoProvider(
  schedule?: () => Promise<void>,
): CryptoProvider {
  return {
    pbkdf2Sha256,

    async scrypt(password, salt, cost, blockSize, parallelization, keyLength) {
      return scrypt(
        { pbkdf2Sha256 },
        password,
        salt,
        cost,
        blockSize,
        parallelization,
        keyLength,
        schedule,
      );
    },

    async hmacSha256(keyBytes, data) {
      const key = await globalThis.crypto.subtle.importKey(
        'raw',
        asBufferSource(keyBytes),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const result = await globalThis.crypto.subtle.sign(
        'HMAC',
        key,
        asBufferSource(data),
      );
      return new Uint8Array(result);
    },
  };
}

export const browserCryptoProvider = createBrowserCryptoProvider();
