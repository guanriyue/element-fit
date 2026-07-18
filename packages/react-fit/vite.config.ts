import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(root, 'src');

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

const isExternal = (id: string): boolean => {
  return external.some((packageName) => id === packageName || id.startsWith(`${packageName}/`));
};

const toPosixPath = (path: string): string => {
  return path.split(sep).join('/');
};

const getSourceRelativePath = (fileName: string): string | null => {
  const normalizedFileName = toPosixPath(fileName);

  if (normalizedFileName.startsWith('src/')) {
    return normalizedFileName.slice('src/'.length);
  }

  const normalizedSrcRoot = toPosixPath(srcRoot);

  if (normalizedFileName.startsWith(`${normalizedSrcRoot}/`)) {
    return normalizedFileName.slice(normalizedSrcRoot.length + 1);
  }

  const relativePath = relative(srcRoot, fileName);

  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    return null;
  }

  return toPosixPath(relativePath);
};

const getStyleAssetName = (fileName: string): string | null => {
  const relativePath = getSourceRelativePath(fileName);

  if (relativePath === null) {
    return null;
  }

  if (relativePath.endsWith('.css')) {
    return relativePath;
  }

  const directory = relativePath.slice(0, relativePath.lastIndexOf('/'));

  if (directory.length === 0) {
    return 'style.css';
  }

  return `${directory}/style.css`;
};

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2023',
    lib: {
      entry: {
        index: resolve(root, 'src/index.ts'),
        'CompactGrid/index': resolve(root, 'src/CompactGrid/index.ts'),
        'FitGrid/index': resolve(root, 'src/FitGrid/index.ts'),
        'FitSwitch/index': resolve(root, 'src/FitSwitch/index.ts'),
        'InlineOverflow/index': resolve(root, 'src/InlineOverflow/index.ts'),
        'LineClamp/index': resolve(root, 'src/LineClamp/index.ts'),
        'Textarea/index': resolve(root, 'src/Textarea/index.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    cssCodeSplit: true,

    rolldownOptions: {
      external: isExternal,
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names.some((name) => name.endsWith('.css'))) {
            const styleAssetName = assetInfo.originalFileNames
              .map((fileName) => getStyleAssetName(fileName))
              .find((assetName) => assetName !== null);

            if (styleAssetName !== undefined) {
              return styleAssetName;
            }
          }

          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: '_chunks/[name]-[hash].js',
      },
    },
  },
});
