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
    chunkFileNames: 'shared/[name].[hash].mjs',
  },
  treeshake: true,
  external: (id: string) =>
    id.startsWith('node:') ||
    id === 'fs' || id === 'fs/promises' || id === 'path' || id === 'url' || id === 'os' ||
    id === 'child_process' || id === 'process' || id === 'tty' || id === 'util' ||
    id === 'stream' || id === 'assert' ||
    // Externalize runtime deps that may include CJS/require usage
    id.startsWith('mcporter') || id.startsWith('dotenv') || id.startsWith('@iarna/toml') ||
    id.startsWith('@leeoniya/ufuzzy'),
});
