import path from 'node:path';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      'framer-motion': path.resolve(__dirname, 'src/__mocks__/framer-motion.ts'),
      '@lmring/ui': path.resolve(__dirname, 'src/__mocks__/@lmring/ui.tsx'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 10000,
    hookTimeout: 15000,
    pool: 'threads',
    teardownTimeout: 5000,
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/**/*.stories.{js,jsx,ts,tsx}', 'src/__mocks__/**/*'],
    },
    env: loadEnv('', process.cwd(), ''),
  },
});
