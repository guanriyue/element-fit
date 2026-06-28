import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

export default defineConfig({
  build: {
    target: 'es2023',
    lib: {
      entry: {
        index: resolve(root, 'src/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,

    rolldownOptions: {
      external,
    },
  },
});
