import * as path from 'node:path';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginTwoslash } from '@rspress/plugin-twoslash';

const normalizeBase = (value = '/') => {
  if (value === '/') {
    return '/';
  }

  return `/${value.replace(/^\/|\/$/g, '')}/`;
};

const base = normalizeBase(process.env.RSPRESS_BASE);

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  base,
  title: 'Element Fit',
  description: 'Element Fit documentation.',
  lang: 'en',
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'Element Fit',
      description: 'Element Fit documentation.',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'Element Fit',
      description: 'Element Fit 文档。',
    },
  ],
  plugins: [pluginTwoslash(), pluginPreview()],
  globalStyles: path.join(__dirname, 'tailwind.css'),
  builderConfig: {
    plugins: [pluginTailwindcss()],
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
      },
    },
  },
});
