import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Dedicated Vitest config. Keeps the `@` -> src alias that the unit/integration
// tests rely on, but excludes the Playwright e2e specs (tests/e2e) which are run
// separately via `npm run test:e2e` (they use @playwright/test, not vitest).
export default defineConfig({
  esbuild: {
    include: /\.(ts|tsx|mts|cts)$/,
    loader: 'tsx',
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    clearMocks: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/coverage/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/components/ui/ChipInput.tsx',
        'src/components/ui/ImageDropzone.tsx',
        'src/utils/**/*.ts',
        'server/db/queries.ts',
      ],
      exclude: ['**/*.test.{ts,tsx}', '**/tests/**'],
      all: true,
    },
  },
});
