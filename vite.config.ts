import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// One web app. It asks who you are (student, parent or teacher), signs you in, then loads the matching
// workspace: the family app (students and parents) or the staff workspace. Both read the same school
// database file, so a request a guardian sends appears in the staff queue.
export default defineConfig({
  root: path('./apps'),
  publicDir: path('./apps/public'),
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@school-intel/ui': path('./packages/ui/src/index.tsx'),
      '@school-intel/contracts': path('./packages/contracts/src/index.ts'),
      '@school-intel/api': path('./services/api/src/index.ts'),
    },
  },
  build: {
    outDir: path('./dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: { index: path('./apps/index.html') },
    },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: {
    root: path('.'),
    include: ['services/**/*.test.ts'],
    environment: 'node',
    setupFiles: [path('./services/api/src/test-setup.ts')],
  },
});
