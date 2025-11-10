import { defineConfig } from 'rolldown';

export default defineConfig({
  input: {
    index: 'src/index.ts',
  },
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
    entryFileNames: '[name].mjs',
  },
  treeshake: true,
  external: (id: string) => id.startsWith('node:'),
});

