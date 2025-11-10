import { defineConfig } from 'rolldown';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'pathe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  input: {
    index: 'src/index.ts',
  },
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
    entryFileNames: '[name].mjs',
    chunkFileNames: 'shared/[name].[hash].mjs',
  },
  treeshake: true,
  resolve: {
    alias: [
      {
        find: '@oplink/core',
        // Require core to be built first (monorepo dependency enforces order)
        replacement: resolve(__dirname, '../oplink/dist/index.mjs'),
      },
    ],
  },
});

