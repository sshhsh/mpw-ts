import type { GenerateOptions } from './mpw.js';

export type WorkerMethod =
  | 'generate'
  | 'generateAuthentication'
  | 'generateIdentification'
  | 'generateRecovery'
  | 'deriveHistoryTransferKey';

export type WorkerRequest =
  | {
      id: number;
      type: 'create';
      name: string;
      password: string;
    }
  | {
      id: number;
      type: 'call';
      method: WorkerMethod;
      site?: string;
      options?: GenerateOptions;
    };

export type WorkerRequestWithoutId = WorkerRequest extends infer Request
  ? Request extends WorkerRequest
    ? Omit<Request, 'id'>
    : never
  : never;

export interface SerializedWorkerError {
  name: string;
  message: string;
}

export type WorkerResponse =
  | { id: number; ok: true; value?: string | Uint8Array }
  | { id: number; ok: false; error: SerializedWorkerError };
