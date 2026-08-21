import {
  AUTHENTICATION_NAMESPACE,
  IDENTIFICATION_NAMESPACE,
  isValidCounter,
  MAX_COUNTER,
  MIN_COUNTER,
  NAMESPACE,
  PASSWORD_CHARACTERS,
  RECOVERY_NAMESPACE,
  TEMPLATES,
  VERSION,
  type TemplateCharacter,
  type TemplateName,
} from './constants.js';
import type { CryptoProvider } from './crypto/types.js';
import { concatenate, encodeUtf8, uint32BigEndian } from './utils.js';

const HISTORY_TRANSFER_KEY_CONTEXT =
  'com.lyndir.masterpassword.history-transfer.v1';

export interface CreateMpwOptions {
  cryptoProvider: CryptoProvider;
}

export interface GenerateOptions {
  counter?: number;
  context?: string | null;
  template?: TemplateName;
  namespace?: string;
}

export class MPW {
  static readonly VERSION = VERSION;
  static readonly NAMESPACE = NAMESPACE;
  static readonly AUTHENTICATION_NAMESPACE = AUTHENTICATION_NAMESPACE;
  static readonly IDENTIFICATION_NAMESPACE = IDENTIFICATION_NAMESPACE;
  static readonly RECOVERY_NAMESPACE = RECOVERY_NAMESPACE;

  readonly name: string;
  readonly version = VERSION;

  private invalidated = false;

  protected constructor(
    name: string,
    private readonly masterKey: Uint8Array,
    private readonly cryptoProvider: CryptoProvider,
  ) {
    this.name = name;
  }

  static async create(
    name: string,
    password: string,
    options: CreateMpwOptions,
  ): Promise<MPW> {
    const masterKey = await MPW.calculateKey(
      name,
      password,
      options.cryptoProvider,
    );
    return new MPW(name, masterKey, options.cryptoProvider);
  }

  static async calculateKey(
    name: string,
    password: string,
    cryptoProvider: CryptoProvider,
  ): Promise<Uint8Array> {
    if (name.length === 0) throw new TypeError('name must not be empty');
    if (password.length === 0)
      throw new TypeError('password must not be empty');

    const encodedName = encodeUtf8(name);
    const salt = concatenate(
      encodeUtf8(NAMESPACE),
      uint32BigEndian(encodedName.length),
      encodedName,
    );
    return cryptoProvider.scrypt(encodeUtf8(password), salt, 32768, 8, 2, 64);
  }

  async calculateSeed(
    site: string,
    counter = 1,
    context: string | null = null,
    namespace = NAMESPACE,
  ): Promise<Uint8Array> {
    this.assertValid();
    if (site.length === 0) throw new TypeError('site must not be empty');
    if (!isValidCounter(counter)) {
      throw new RangeError(
        `counter must be an integer between ${MIN_COUNTER} and ${MAX_COUNTER}`,
      );
    }

    const encodedSite = encodeUtf8(site);
    const parts = [
      encodeUtf8(namespace),
      uint32BigEndian(encodedSite.length),
      encodedSite,
      uint32BigEndian(counter),
    ];
    if (context !== null && context.length > 0) {
      const encodedContext = encodeUtf8(context);
      parts.push(uint32BigEndian(encodedContext.length), encodedContext);
    }

    return this.cryptoProvider.hmacSha256(
      this.masterKey,
      concatenate(...parts),
    );
  }

  async generate(site: string, options: GenerateOptions = {}): Promise<string> {
    const {
      counter = 1,
      context = null,
      template = 'long',
      namespace = NAMESPACE,
    } = options;
    if (!Object.hasOwn(TEMPLATES, template)) {
      throw new TypeError(`Unknown template: ${String(template)}`);
    }
    const seed = await this.calculateSeed(site, counter, context, namespace);
    const candidates = TEMPLATES[template];
    const selectedTemplate = candidates[seed[0] % candidates.length];

    return [...selectedTemplate]
      .map((character, index) => {
        const characters = PASSWORD_CHARACTERS[character as TemplateCharacter];
        return characters[seed[index + 1] % characters.length];
      })
      .join('');
  }

  generateAuthentication(
    site: string,
    options: Omit<GenerateOptions, 'namespace'> = {},
  ): Promise<string> {
    return this.generate(site, {
      ...options,
      namespace: AUTHENTICATION_NAMESPACE,
    });
  }

  generateIdentification(
    site: string,
    options: Omit<GenerateOptions, 'namespace' | 'template'> & {
      template?: TemplateName;
    } = {},
  ): Promise<string> {
    return this.generate(site, {
      template: 'name',
      ...options,
      namespace: IDENTIFICATION_NAMESPACE,
    });
  }

  generateRecovery(
    site: string,
    options: Omit<GenerateOptions, 'namespace' | 'template'> & {
      template?: TemplateName;
    } = {},
  ): Promise<string> {
    return this.generate(site, {
      template: 'phrase',
      ...options,
      namespace: RECOVERY_NAMESPACE,
    });
  }

  deriveHistoryTransferKey(): Promise<Uint8Array> {
    this.assertValid();
    return this.cryptoProvider.hmacSha256(
      this.masterKey,
      encodeUtf8(HISTORY_TRANSFER_KEY_CONTEXT),
    );
  }

  invalidate(): void {
    this.masterKey.fill(0);
    this.invalidated = true;
  }

  private assertValid(): void {
    if (this.invalidated) throw new Error('MPW instance has been invalidated');
  }
}
