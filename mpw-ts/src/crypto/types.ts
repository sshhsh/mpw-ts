export interface CryptoProvider {
  pbkdf2Sha256(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLength: number,
  ): Promise<Uint8Array>;

  scrypt(
    password: Uint8Array,
    salt: Uint8Array,
    cost: number,
    blockSize: number,
    parallelization: number,
    keyLength: number,
  ): Promise<Uint8Array>;

  hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array>;
}
