# mpw-ts

A platform-independent TypeScript implementation of version 3 of the Master Password algorithm. It produces deterministic site passwords without storing them.

This package is based on the `mpw-js` implementation by Tom Thorogood. It intentionally supports algorithm version 3 only and uses modern asynchronous APIs.

## Runtime support

- Browsers use Web Crypto for PBKDF2 and HMAC-SHA256, plus a TypeScript scrypt implementation.
- Node.js uses the native `node:crypto` implementations through the `mpw-ts/node` entry point.
- The shared API and algorithm operate on `Uint8Array` and do not expose `CryptoKey` or `Buffer`.

## Browser usage

```ts
import { MPW } from 'mpw-ts';

const mpw = await MPW.create('Jane Doe', 'correct horse battery staple');
const password = await mpw.generateAuthentication('example.com');

mpw.invalidate();
```

The default entry requires `globalThis.crypto.subtle`. The TypeScript scrypt implementation yields periodically so it does not monopolize the browser event loop, but key derivation remains intentionally expensive.

## Node.js usage

```ts
import { MPW } from 'mpw-ts/node';

const mpw = await MPW.create('Jane Doe', 'correct horse battery staple');
const password = await mpw.generate('example.com', {
  counter: 1,
  template: 'long',
});

mpw.invalidate();
```

Specialized methods are available for each namespace:

```ts
await mpw.generateAuthentication('example.com');
await mpw.generateIdentification('example.com');
await mpw.generateRecovery('example.com', { context: 'first pet' });
```

Supported templates are `maximum`, `long`, `medium`, `basic`, `short`, `pin`, `name`, and `phrase`.

## Development

Requires Node.js 20 or newer.

```sh
npm install
npm run check
npm run test:browser
npm run build
```

`npm run test:browser` requires Playwright Chromium. Install it once with:

```sh
npx playwright install chromium
```

The build emits ESM JavaScript, source maps, and TypeScript declarations into `dist`.

## Security notes

- Losing the master password means generated passwords cannot be recovered.
- Changing the name, master password, site, counter, context, template, or algorithm version changes the result.
- `invalidate()` overwrites the in-memory master key held by the instance and prevents further generation. JavaScript runtimes may retain unrelated copies created internally by cryptographic APIs.
- This implementation has automated compatibility and standard-vector tests, but it has not received an independent security audit.

## License

Licensed under the Creative Commons Attribution 4.0 International License. See [LICENSE](LICENSE).
