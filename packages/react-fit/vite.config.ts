import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

const isExternal = (id: string): boolean => {
  return external.some((packageName) => id === packageName || id.startsWith(`${packageName}/`));
};

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2023',
    lib: {
      entry: {
        index: resolve(root, 'src/index.ts'),
        'FitGrid/index': resolve(root, 'src/FitGrid/index.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,

    rolldownOptions: {
      external: isExternal,
      output: {
        chunkFileNames: '_chunks/[name]-[hash].js',
      },
    },
  },
});
