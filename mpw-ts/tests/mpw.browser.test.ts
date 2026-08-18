import { expect, it } from 'vitest';

import { MPW } from '../src/index.js';

it('matches the original implementation in a browser', async () => {
  const mpw = await MPW.create('user', 'password');

  await expect(mpw.generate('example.com')).resolves.toBe('ZedaFaxcZaso9*');
}, 120_000);
