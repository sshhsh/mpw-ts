import {
  AUTHENTICATION_NAMESPACE,
  IDENTIFICATION_NAMESPACE,
  NAMESPACE,
  RECOVERY_NAMESPACE,
  type TemplateName,
  VERSION,
} from './constants.js';
import type { GenerateOptions } from './mpw.js';
import type {
  SerializedWorkerError,
  WorkerMethod,
  WorkerRequest,
  WorkerRequestWithoutId,
  WorkerResponse,
} from './worker-protocol.js';

interface PendingRequest {
  resolve(value: string | Uint8Array | undefined): void;
  reject(reason: unknown): void;
}

function deserializeError(error: SerializedWorkerError): Error {
  const ErrorConstructor =
    error.name === 'TypeError'
      ? TypeError
      : error.name === 'RangeError'
        ? RangeError
        : Error;
  const result = new ErrorConstructor(error.message);
  result.name = error.name;
  return result;
}

export class MPW {
  static readonly VERSION = VERSION;
  static readonly NAMESPACE = NAMESPACE;
  static readonly AUTHENTICATION_NAMESPACE = AUTHENTICATION_NAMESPACE;
  static readonly IDENTIFICATION_NAMESPACE = IDENTIFICATION_NAMESPACE;
  static readonly RECOVERY_NAMESPACE = RECOVERY_NAMESPACE;

  readonly version = VERSION;

  private nextRequestId = 1;
  private invalidated = false;
  private readonly pending = new Map<number, PendingRequest>();

  private constructor(
    readonly name: string,
    private readonly worker: Worker,
  ) {
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const pending = this.pending.get(response.id);
      if (pending === undefined) return;
      this.pending.delete(response.id);
      if (response.ok) pending.resolve(response.value);
      else pending.reject(deserializeError(response.error));
    };
    worker.onerror = (event) => {
      this.fail(new Error(event.message || 'MPW worker failed'));
    };
    worker.onmessageerror = () => {
      this.fail(new Error('MPW worker returned an unreadable message'));
    };
  }

  static async create(name: string, password: string): Promise<MPW> {
    const worker = new Worker(new URL('./worker-entry.js', import.meta.url), {
      type: 'module',
      name: 'mpw-crypto',
    });
    const instance = new MPW(name, worker);
    try {
      await instance.request({ type: 'create', name, password });
      return instance;
    } catch (cause) {
      instance.invalidate();
      throw cause;
    }
  }

  generate(site: string, options: GenerateOptions = {}): Promise<string> {
    return this.callString('generate', site, options);
  }

  generateAuthentication(
    site: string,
    options: Omit<GenerateOptions, 'namespace'> = {},
  ): Promise<string> {
    return this.callString('generateAuthentication', site, options);
  }

  generateIdentification(
    site: string,
    options: Omit<GenerateOptions, 'namespace' | 'template'> & {
      template?: TemplateName;
    } = {},
  ): Promise<string> {
    return this.callString('generateIdentification', site, options);
  }

  generateRecovery(
    site: string,
    options: Omit<GenerateOptions, 'namespace' | 'template'> & {
      template?: TemplateName;
    } = {},
  ): Promise<string> {
    return this.callString('generateRecovery', site, options);
  }

  async deriveHistoryTransferKey(): Promise<Uint8Array> {
    const value = await this.request({
      type: 'call',
      method: 'deriveHistoryTransferKey',
    });
    if (!(value instanceof Uint8Array)) {
      throw new Error('MPW worker returned an invalid key');
    }
    return value;
  }

  invalidate(): void {
    if (this.invalidated) return;
    this.invalidated = true;
    this.worker.terminate();
    this.rejectPending(new Error('MPW instance has been invalidated'));
  }

  private async callString(
    method: WorkerMethod,
    site: string,
    options: GenerateOptions,
  ): Promise<string> {
    const value = await this.request({ type: 'call', method, site, options });
    if (typeof value !== 'string') {
      throw new Error('MPW worker returned an invalid password');
    }
    return value;
  }

  private request(
    request: WorkerRequestWithoutId,
  ): Promise<string | Uint8Array | undefined> {
    if (this.invalidated) {
      return Promise.reject(new Error('MPW instance has been invalidated'));
    }
    const id = this.nextRequestId;
    this.nextRequestId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ ...request, id } satisfies WorkerRequest);
    });
  }

  private fail(error: Error): void {
    if (!this.invalidated) {
      this.invalidated = true;
      this.worker.terminate();
    }
    this.rejectPending(error);
  }

  private rejectPending(error: Error): void {
    for (const request of this.pending.values()) request.reject(error);
    this.pending.clear();
  }
}
