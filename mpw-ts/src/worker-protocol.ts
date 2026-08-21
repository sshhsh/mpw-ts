import type { GenerateOptions, GeneratePurposeOptions } from './mpw.js';

export interface WorkerCallMap {
  generate: { site: string; options?: GenerateOptions; result: string };
  generateAuthentication: {
    site: string;
    options?: GeneratePurposeOptions;
    result: string;
  };
  generateIdentification: {
    site: string;
    options?: GeneratePurposeOptions;
    result: string;
  };
  generateRecovery: {
    site: string;
    options?: GeneratePurposeOptions;
    result: string;
  };
  deriveHistoryTransferKey: { result: Uint8Array };
}

export type WorkerMethod = keyof WorkerCallMap;

export type WorkerCall = {
  [Method in WorkerMethod]: { type: 'call'; method: Method } & Omit<
    WorkerCallMap[Method],
    'result'
  >;
}[WorkerMethod];

export type WorkerRequest =
  | {
      id: number;
      type: 'create';
      name: string;
      password: string;
    }
  | (WorkerCall & { id: number });

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
