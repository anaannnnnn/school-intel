import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Both surfaces are served from one origin so the demo API's local store is
// shared: a request a guardian submits in the family app appears in the staff CRM.
//   /               product entry
//   /family-pwa/    parent and student mobile web app (installable PWA)
//   /staff-web/     teacher and administration CRM
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
      input: {
        index: path('./apps/index.html'),
        family: path('./apps/family-pwa/index.html'),
        staff: path('./apps/staff-web/index.html'),
      },
    },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: {
    root: path('.'),
    include: ['services/**/*.test.ts'],
    environment: 'node',
  },
});
