// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ember-and-oak.pages.dev',
  vite: { plugins: [tailwindcss()] },
});
