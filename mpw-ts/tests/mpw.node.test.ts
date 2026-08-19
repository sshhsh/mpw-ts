import { beforeAll, describe, expect, it } from 'vitest';

import { MPW } from '../src/node.js';
import type { MPW as MpwInstance } from '../src/mpw.js';

describe('MPW v3 compatibility', () => {
  let mpw: MpwInstance;

  beforeAll(async () => {
    mpw = await MPW.create('user', 'password');
  });

  it('matches the original implementation vector', async () => {
    expect(mpw).toBeInstanceOf(MPW);
    await expect(mpw.generate('example.com')).resolves.toBe('ZedaFaxcZaso9*');
  });

  it('supports all password templates', async () => {
    await expect(
      Promise.all([
        mpw.generate('example.com', { template: 'maximum' }),
        mpw.generate('example.com', { template: 'medium' }),
        mpw.generate('example.com', { template: 'basic' }),
        mpw.generate('example.com', { template: 'short' }),
        mpw.generate('example.com', { template: 'pin' }),
        mpw.generate('example.com', { template: 'name' }),
        mpw.generate('example.com', { template: 'phrase' }),
      ]),
    ).resolves.toEqual([
      expect.stringMatching(/^.{20}$/),
      expect.stringMatching(/^.{8}$/),
      expect.stringMatching(/^.{8}$/),
      expect.stringMatching(/^.{4}$/),
      expect.stringMatching(/^\d{4}$/),
      expect.stringMatching(/^[a-z]{9}$/),
      expect.stringContaining(' '),
    ]);
  });

  it('separates namespaces, counters, and contexts', async () => {
    const results = await Promise.all([
      mpw.generateAuthentication('example.com'),
      mpw.generateIdentification('example.com'),
      mpw.generateRecovery('example.com'),
      mpw.generate('example.com', { counter: 2 }),
      mpw.generate('example.com', { context: 'question' }),
    ]);

    expect(new Set(results).size).toBe(results.length);
  });

  it('rejects invalid generation inputs', async () => {
    await expect(mpw.generate('')).rejects.toThrow(TypeError);
    await expect(mpw.generate('example.com', { counter: 0 })).rejects.toThrow(
      RangeError,
    );
    await expect(
      mpw.generate('example.com', { template: 'invalid' as 'long' }),
    ).rejects.toThrow('Unknown template');
  });

  it('derives an identity-bound history transfer key', async () => {
    const sameIdentity = await MPW.create('user', 'password');
    const otherIdentity = await MPW.create('other user', 'password');

    const [first, same, other] = await Promise.all([
      mpw.deriveHistoryTransferKey(),
      sameIdentity.deriveHistoryTransferKey(),
      otherIdentity.deriveHistoryTransferKey(),
    ]);

    expect(first).toHaveLength(32);
    expect(same).toEqual(first);
    expect(other).not.toEqual(first);
  });

  it('zeroizes and invalidates its key', async () => {
    const disposable = await MPW.create('disposable', 'password');
    disposable.invalidate();

    await expect(disposable.generate('example.com')).rejects.toThrow(
      'invalidated',
    );
    expect(() => disposable.deriveHistoryTransferKey()).toThrow('invalidated');
  });
});

describe('MPW input validation', () => {
  it('rejects empty credentials before deriving a key', async () => {
    await expect(MPW.create('', 'password')).rejects.toThrow(TypeError);
    await expect(MPW.create('user', '')).rejects.toThrow(TypeError);
  });
});
