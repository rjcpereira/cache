import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess';

const port = 3000,
  extensions = ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.svelte', '.css', '.scss', '.sass'];

export default defineConfig({
  server: {
    port
  },
  preview: {
    port
  },
  resolve: {
    extensions,
    alias: {
      '@': ''
    }
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess()
    })
  ],
});