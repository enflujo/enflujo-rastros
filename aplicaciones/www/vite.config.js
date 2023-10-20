import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  // base: '/',
  server: {
    port: 3000,
  },
  publicDir: 'estaticos',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./fuente', import.meta.url)),
      'simple-peer': 'simple-peer/simplepeer.min.js',
    },
  },
  plugins: [mkcert()],
  build: {
    outDir: '../../publico',
    assetsDir: 'recursos',
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        maquina: resolve(__dirname, 'maquina/index.html'),
      },
    },
  },
});
