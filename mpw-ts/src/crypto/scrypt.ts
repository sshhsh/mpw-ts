import type { CryptoProvider } from './types.js';

export type Scheduler = () => Promise<void>;

const defaultScheduler: Scheduler = () =>
  new Promise((resolve) => globalThis.setTimeout(resolve, 0));

function salsaXor(
  temporary: Uint32Array,
  input: Uint32Array,
  output: Uint32Array,
): void {
  const working = new Uint32Array(16);
  const original = new Uint32Array(16);

  for (let index = 0; index < 16; index += 1) {
    const value = temporary[index] ^ input[index];
    working[index] = value;
    original[index] = value;
  }

  for (let round = 0; round < 8; round += 2) {
    let sum = (working[0] + working[12]) | 0;
    working[4] ^= (sum << 7) | (sum >>> 25);
    sum = (working[4] + working[0]) | 0;
    working[8] ^= (sum << 9) | (sum >>> 23);
    sum = (working[8] + working[4]) | 0;
    working[12] ^= (sum << 13) | (sum >>> 19);
    sum = (working[12] + working[8]) | 0;
    working[0] ^= (sum << 18) | (sum >>> 14);

    sum = (working[5] + working[1]) | 0;
    working[9] ^= (sum << 7) | (sum >>> 25);
    sum = (working[9] + working[5]) | 0;
    working[13] ^= (sum << 9) | (sum >>> 23);
    sum = (working[13] + working[9]) | 0;
    working[1] ^= (sum << 13) | (sum >>> 19);
    sum = (working[1] + working[13]) | 0;
    working[5] ^= (sum << 18) | (sum >>> 14);

    sum = (working[10] + working[6]) | 0;
    working[14] ^= (sum << 7) | (sum >>> 25);
    sum = (working[14] + working[10]) | 0;
    working[2] ^= (sum << 9) | (sum >>> 23);
    sum = (working[2] + working[14]) | 0;
    working[6] ^= (sum << 13) | (sum >>> 19);
    sum = (working[6] + working[2]) | 0;
    working[10] ^= (sum << 18) | (sum >>> 14);

    sum = (working[15] + working[11]) | 0;
    working[3] ^= (sum << 7) | (sum >>> 25);
    sum = (working[3] + working[15]) | 0;
    working[7] ^= (sum << 9) | (sum >>> 23);
    sum = (working[7] + working[3]) | 0;
    working[11] ^= (sum << 13) | (sum >>> 19);
    sum = (working[11] + working[7]) | 0;
    working[15] ^= (sum << 18) | (sum >>> 14);

    sum = (working[0] + working[3]) | 0;
    working[1] ^= (sum << 7) | (sum >>> 25);
    sum = (working[1] + working[0]) | 0;
    working[2] ^= (sum << 9) | (sum >>> 23);
    sum = (working[2] + working[1]) | 0;
    working[3] ^= (sum << 13) | (sum >>> 19);
    sum = (working[3] + working[2]) | 0;
    working[0] ^= (sum << 18) | (sum >>> 14);

    sum = (working[5] + working[4]) | 0;
    working[6] ^= (sum << 7) | (sum >>> 25);
    sum = (working[6] + working[5]) | 0;
    working[7] ^= (sum << 9) | (sum >>> 23);
    sum = (working[7] + working[6]) | 0;
    working[4] ^= (sum << 13) | (sum >>> 19);
    sum = (working[4] + working[7]) | 0;
    working[5] ^= (sum << 18) | (sum >>> 14);

    sum = (working[10] + working[9]) | 0;
    working[11] ^= (sum << 7) | (sum >>> 25);
    sum = (working[11] + working[10]) | 0;
    working[8] ^= (sum << 9) | (sum >>> 23);
    sum = (working[8] + working[11]) | 0;
    working[9] ^= (sum << 13) | (sum >>> 19);
    sum = (working[9] + working[8]) | 0;
    working[10] ^= (sum << 18) | (sum >>> 14);

    sum = (working[15] + working[14]) | 0;
    working[12] ^= (sum << 7) | (sum >>> 25);
    sum = (working[12] + working[15]) | 0;
    working[13] ^= (sum << 9) | (sum >>> 23);
    sum = (working[13] + working[12]) | 0;
    working[14] ^= (sum << 13) | (sum >>> 19);
    sum = (working[14] + working[13]) | 0;
    working[15] ^= (sum << 18) | (sum >>> 14);
  }

  for (let index = 0; index < 16; index += 1) {
    const value = (working[index] + original[index]) >>> 0;
    temporary[index] = value;
    output[index] = value;
  }
}

function blockMix(
  input: Uint32Array,
  output: Uint32Array,
  blockSize: number,
): void {
  const temporary = input.slice((2 * blockSize - 1) * 16, 2 * blockSize * 16);

  for (let index = 0; index < 2 * blockSize; index += 2) {
    salsaXor(temporary, input.subarray(index * 16), output.subarray(index * 8));
    salsaXor(
      temporary,
      input.subarray((index + 1) * 16),
      output.subarray((index + 2 * blockSize) * 8),
    );
  }
}

async function smix(
  bytes: Uint8Array,
  blockSize: number,
  cost: number,
  values: Uint32Array,
  first: Uint32Array,
  second: Uint32Array,
  schedule: Scheduler,
): Promise<void> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let index = 0; index < first.length; index += 1) {
    first[index] = view.getUint32(index * 4, true);
  }

  for (let index = 0; index < cost; index += 2) {
    values.set(first, index * 32 * blockSize);
    blockMix(first, second, blockSize);
    values.set(second, (index + 1) * 32 * blockSize);
    blockMix(second, first, blockSize);
    if (index % 256 === 0) await schedule();
  }

  for (let index = 0; index < cost; index += 2) {
    let selected = first[(2 * blockSize - 1) * 16] & (cost - 1);
    for (let word = 0; word < first.length; word += 1) {
      first[word] ^= values[selected * 32 * blockSize + word];
    }
    blockMix(first, second, blockSize);

    selected = second[(2 * blockSize - 1) * 16] & (cost - 1);
    for (let word = 0; word < second.length; word += 1) {
      second[word] ^= values[selected * 32 * blockSize + word];
    }
    blockMix(second, first, blockSize);
    if (index % 256 === 0) await schedule();
  }

  for (let index = 0; index < first.length; index += 1) {
    view.setUint32(index * 4, first[index], true);
  }
}

export async function scrypt(
  provider: Pick<CryptoProvider, 'pbkdf2Sha256'>,
  password: Uint8Array,
  salt: Uint8Array,
  cost: number,
  blockSize: number,
  parallelization: number,
  keyLength: number,
  schedule: Scheduler = defaultScheduler,
): Promise<Uint8Array> {
  if (!Number.isSafeInteger(cost) || cost < 2 || (cost & (cost - 1)) !== 0) {
    throw new RangeError('cost must be a power of two greater than one');
  }
  if (!Number.isSafeInteger(blockSize) || blockSize < 1) {
    throw new RangeError('blockSize must be a positive integer');
  }
  if (
    !Number.isSafeInteger(parallelization) ||
    parallelization < 1 ||
    blockSize * parallelization >= 2 ** 30
  ) {
    throw new RangeError('parallelization is out of range');
  }

  const first = new Uint32Array(32 * blockSize);
  const second = new Uint32Array(32 * blockSize);
  const values = new Uint32Array(32 * cost * blockSize);
  const mixed = await provider.pbkdf2Sha256(
    password,
    salt,
    1,
    parallelization * 128 * blockSize,
  );

  for (let index = 0; index < parallelization; index += 1) {
    await smix(
      mixed.subarray(index * 128 * blockSize, (index + 1) * 128 * blockSize),
      blockSize,
      cost,
      values,
      first,
      second,
      schedule,
    );
  }

  return provider.pbkdf2Sha256(password, mixed, 1, keyLength);
}
