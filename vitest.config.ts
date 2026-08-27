import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Dedicated Vitest config. Keeps the `@` -> src alias that the unit/integration
// tests rely on, but excludes the Playwright e2e specs (tests/e2e) which are run
// separately via `npm run test:e2e` (they use @playwright/test, not vitest).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/coverage/**',
    ],
  },
});
