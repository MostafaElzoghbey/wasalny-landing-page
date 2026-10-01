// tests/contract/S6.contract.test.ts
// S6: production build green.

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('S6: production build', () => {
  it('npm run build succeeds', () => {
    expect(() => {
      execSync('npm run build', { stdio: 'pipe', timeout: 300000 });
    }).not.toThrow();
  }, 300000);
});
