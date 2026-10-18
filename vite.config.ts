import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths let the page work under any path prefix of a reverse proxy.
  base: './',
  build: { outDir: 'dist', assetsDir: 'assets' },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    environment: 'node',
    restoreMocks: true,
  },
});
