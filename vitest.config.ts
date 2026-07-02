import pluginReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [pluginReact()],
  test: {
    setupFiles: ['./vitest.setup.ts'],
    projects: ['packages/*'],
  },
});
