import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // base: '/',
  server: {
    port: 3000,
  },
  publicDir: 'estaticos',
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
