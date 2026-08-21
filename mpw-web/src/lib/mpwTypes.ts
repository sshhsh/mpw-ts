import { MPW } from '@mpw/core/worker';

export type MpwInstance = Awaited<ReturnType<typeof MPW.create>>;