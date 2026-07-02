import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
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
});
