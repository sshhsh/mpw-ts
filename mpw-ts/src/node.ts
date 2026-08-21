import { nodeCryptoProvider } from './crypto/node.js';
import { MPW as BaseMPW } from './mpw.js';

export * from './constants.js';
export type { CryptoProvider } from './crypto/types.js';
export type {
  CreateMpwOptions,
  GenerateOptions,
  GeneratePurposeOptions,
} from './mpw.js';

export class MPW extends BaseMPW {
  static override async create(name: string, password: string): Promise<MPW> {
    const masterKey = await BaseMPW.calculateKey(
      name,
      password,
      nodeCryptoProvider,
    );
    return new MPW(name, masterKey, nodeCryptoProvider);
  }
}

export { nodeCryptoProvider } from './crypto/node.js';
