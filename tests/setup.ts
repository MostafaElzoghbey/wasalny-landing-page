// Shared Vitest setup. Registers jest-dom matchers (toBeInTheDocument, etc.)
// for component tests and cleans up between tests.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
