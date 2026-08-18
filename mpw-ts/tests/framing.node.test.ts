import { describe, expect, it, vi } from 'vitest';

import { NAMESPACE } from '../src/constants.js';
import type { CryptoProvider } from '../src/crypto/types.js';
import { MPW } from '../src/mpw.js';

describe('MPW v3 message framing', () => {
  it('uses UTF-8 byte lengths for Unicode names', async () => {
    const scrypt = vi.fn<CryptoProvider['scrypt']>(() =>
      Promise.resolve(new Uint8Array(64)),
    );
    const provider: CryptoProvider = {
      scrypt,
      pbkdf2Sha256: vi.fn(),
      hmacSha256: vi.fn(),
    };

    await MPW.calculateKey('用户', 'password', provider);

    const salt = scrypt.mock.calls[0][1];
    const namespaceLength = new TextEncoder().encode(NAMESPACE).length;
    const encodedLength = new DataView(
      salt.buffer,
      salt.byteOffset + namespaceLength,
      4,
    ).getUint32(0, false);
    expect(encodedLength).toBe(6);
  });
});
