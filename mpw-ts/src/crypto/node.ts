import {
  createHmac,
  pbkdf2 as nodePbkdf2,
  scrypt as nodeScrypt,
  type ScryptOptions,
} from 'node:crypto';
import { promisify } from 'node:util';

import type { CryptoProvider } from './types.js';

const pbkdf2Async = promisify(nodePbkdf2);

function scryptAsync(
  password: Uint8Array,
  salt: Uint8Array,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, keyLength, options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

export const nodeCryptoProvider: CryptoProvider = {
  async pbkdf2Sha256(password, salt, iterations, keyLength) {
    const result = await pbkdf2Async(
      password,
      salt,
      iterations,
      keyLength,
      'sha256',
    );
    return new Uint8Array(result);
  },

  async scrypt(password, salt, cost, blockSize, parallelization, keyLength) {
    const requiredMemory = 128 * cost * blockSize + 1024 * 1024;
    const result = await scryptAsync(password, salt, keyLength, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: requiredMemory,
    });
    return new Uint8Array(result);
  },

  hmacSha256(key, data) {
    return Promise.resolve(
      new Uint8Array(createHmac('sha256', key).update(data).digest()),
    );
  },
};
