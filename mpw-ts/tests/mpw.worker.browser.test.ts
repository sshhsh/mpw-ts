import { describe, expect, it } from 'vitest';

import { MPW } from '../src/worker.js';

describe('Worker MPW', () => {
  it('derives and generates without blocking the main thread', async () => {
    let timerFired = false;
    const timer = new Promise<void>((resolve) => {
      globalThis.setTimeout(() => {
        timerFired = true;
        resolve();
      }, 0);
    });

    const creating = MPW.create('user', 'password');
    await timer;
    expect(timerFired).toBe(true);

    const mpw = await creating;
    await expect(mpw.generateAuthentication('example.com')).resolves.toBe(
      'ZedaFaxcZaso9*',
    );
    await expect(mpw.deriveHistoryTransferKey()).resolves.toHaveLength(32);
    mpw.invalidate();
  }, 120_000);

  it('preserves errors and rejects calls after invalidation', async () => {
    await expect(MPW.create('', 'password')).rejects.toThrow(TypeError);

    const mpw = await MPW.create('user', 'password');
    mpw.invalidate();
    await expect(mpw.generate('example.com')).rejects.toThrow(
      'MPW instance has been invalidated',
    );
  }, 120_000);
});
