import { describe, expect, it } from 'vitest';

import { upsertHistory } from './history';
import { decryptHistory, encryptHistory } from './historyTransfer';

const key = Uint8Array.from({ length: 32 }, (_, index) => index);
const otherKey = Uint8Array.from({ length: 32 }, (_, index) => index + 1);

describe('encrypted history transfer', () => {
  it('round-trips complete history', async () => {
    const entries = Array.from(
      { length: 75 },
      (_, index) =>
        upsertHistory(
          [],
          { site: `site-${index}.example`, counter: 1, template: 'long' },
          index,
        )[0],
    );

    await expect(
      decryptHistory(await encryptHistory(entries, key), key),
    ).resolves.toEqual(entries);
  });

  it('uses a fresh nonce for every export', async () => {
    const entries = upsertHistory([], {
      site: 'example.com',
      counter: 1,
      template: 'long',
    });

    const first = await encryptHistory(entries, key);
    const second = await encryptHistory(entries, key);

    expect(first).not.toBe(second);
  });

  it('rejects another identity and modified data', async () => {
    const entries = upsertHistory([], {
      site: 'example.com',
      counter: 1,
      template: 'long',
    });
    const encoded = await encryptHistory(entries, key);

    await expect(decryptHistory(encoded, otherKey)).rejects.toThrow(
      '身份不匹配',
    );
    const replacement = encoded.endsWith('A') ? 'B' : 'A';
    await expect(
      decryptHistory(`${encoded.slice(0, -1)}${replacement}`, key),
    ).rejects.toThrow('身份不匹配');
  });
});
