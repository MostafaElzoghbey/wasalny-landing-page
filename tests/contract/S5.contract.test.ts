// tests/contract/S5.contract.test.ts
// S5: no permissive CORS header; session cookie HttpOnly and SameSite=Lax.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createHarness, type D1Harness } from '../helpers/d1.js';
import { app } from '../../server/app.js';
import { hashPassword } from '../../server/auth/passwords.js';

describe('S5: security headers/cookies contract', () => {
  let h: D1Harness;

  beforeAll(async () => {
    h = await createHarness();
    await h.applyMigrations();
  });

  afterAll(async () => {
    await h.dispose();
  });

  beforeEach(async () => {
    await h.resetTables();
    const pw = await hashPassword('admin123');
    await h.db
      .prepare(
        'INSERT INTO admins (id, username, password_hash, role) VALUES (?, ?, ?, ?)',
      )
      .bind('a1', 'admin', pw, 'admin')
      .run();
  });

  it('login sets HttpOnly SameSite=Lax session cookie; no permissive CORS', async () => {
    const loginReq = new Request('http://localhost/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });
    const loginRes = await app.request(loginReq, {}, h.env);
    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).not.toMatch(/SameSite=None/i);

    const cors = loginRes.headers.get('access-control-allow-origin');
    expect(cors).toBeNull();
  });
});
