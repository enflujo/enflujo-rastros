import { build } from 'esbuild';

async function magia() {
  await build({
    entryPoints: ['aplicaciones/servidor/fuente/index.ts'],
    bundle: true,
    minify: true,
    platform: 'node',
    target: ['node10.4'],
    outfile: 'servidor/index.js',
  });
}

magia();
