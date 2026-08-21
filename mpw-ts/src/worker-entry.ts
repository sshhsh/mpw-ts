import { createBrowserCryptoProvider } from './crypto/browser.js';
import { MPW } from './mpw.js';
import type {
  SerializedWorkerError,
  WorkerRequest,
  WorkerResponse,
} from './worker-protocol.js';

interface WorkerEndpoint {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
}

const endpoint = globalThis as unknown as WorkerEndpoint;
const cryptoProvider = createBrowserCryptoProvider(() => Promise.resolve());
let mpw: MPW | null = null;

function serializeError(cause: unknown): SerializedWorkerError {
  if (cause instanceof Error) {
    return { name: cause.name, message: cause.message };
  }
  return { name: 'Error', message: String(cause) };
}

async function handleRequest(request: WorkerRequest): Promise<WorkerResponse> {
  try {
    if (request.type === 'create') {
      mpw?.invalidate();
      mpw = await MPW.create(request.name, request.password, {
        cryptoProvider,
      });
      return { id: request.id, ok: true };
    }

    if (mpw === null) throw new Error('MPW worker has not been initialized');

    switch (request.method) {
      case 'generate':
        return {
          id: request.id,
          ok: true,
          value: await mpw.generate(request.site, request.options),
        };
      case 'generateAuthentication':
        return {
          id: request.id,
          ok: true,
          value: await mpw.generateAuthentication(
            request.site,
            request.options,
          ),
        };
      case 'generateIdentification':
        return {
          id: request.id,
          ok: true,
          value: await mpw.generateIdentification(
            request.site,
            request.options,
          ),
        };
      case 'generateRecovery':
        return {
          id: request.id,
          ok: true,
          value: await mpw.generateRecovery(
            request.site,
            request.options,
          ),
        };
      case 'deriveHistoryTransferKey':
        return {
          id: request.id,
          ok: true,
          value: await mpw.deriveHistoryTransferKey(),
        };
    }
  } catch (cause) {
    return { id: request.id, ok: false, error: serializeError(cause) };
  }
}

endpoint.onmessage = (event) => {
  void handleRequest(event.data).then((response) =>
    endpoint.postMessage(response),
  );
};
