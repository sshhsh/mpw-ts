import { describe, expect, it } from 'vitest';

import { browserCryptoProvider } from '../src/crypto/browser.js';

const encoder = new TextEncoder();

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

describe('Browser crypto provider', () => {
  it('matches PBKDF2 and HMAC-SHA256 vectors', async () => {
    const pbkdf2 = await browserCryptoProvider.pbkdf2Sha256(
      encoder.encode('password'),
      encoder.encode('salt'),
      1,
      32,
    );
    const hmac = await browserCryptoProvider.hmacSha256(
      encoder.encode('key'),
      encoder.encode('The quick brown fox jumps over the lazy dog'),
    );

    expect(hex(pbkdf2)).toBe(
      '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b',
    );
    expect(hex(hmac)).toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    );
  });

  it('matches the RFC 7914 scrypt vector', async () => {
    const result = await browserCryptoProvider.scrypt(
      new Uint8Array(),
      new Uint8Array(),
      16,
      1,
      1,
      64,
    );

    expect(hex(result)).toBe(
      '77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906',
    );
  });
});
