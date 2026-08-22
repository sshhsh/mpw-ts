import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { KeyRound } from 'lucide-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(root, 'public');

const icons = [
  { fileName: 'favicon.svg', size: 64 },
  { fileName: 'pwa-192.svg', size: 192 },
  { fileName: 'pwa-512.svg', size: 512 },
];

await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  icons.map(async ({ fileName, size }) => {
    const markup = renderToStaticMarkup(
      createElement(KeyRound, {
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        color: '#f4f1e8',
        fill: 'none',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: {
          backgroundColor: '#15352d',
          borderRadius: '18.75%',
        },
      }),
    );

    await writeFile(
      resolve(outputDirectory, fileName),
      `<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`,
    );
  }),
);