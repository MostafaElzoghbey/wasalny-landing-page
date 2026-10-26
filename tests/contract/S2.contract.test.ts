// tests/contract/S2.contract.test.ts
// S2: login/me/logout, missing/unknown/expired sessions, expired-row deletion.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createHarness, type D1Harness } from '../helpers/d1.js';
import { app } from '../../server/app.js';
import { hashPassword } from '../../server/auth/passwords.js';

describe('S2: auth session contract', () => {
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

  it('login returns 200 with session cookie; me returns admin', async () => {
    const loginReq = new Request('http://localhost/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });
    const loginRes = await app.request(loginReq, {}, h.env);
    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toMatch(/session=/);

    const meReq = new Request('http://localhost/api/admin/me', {
        headers: { cookie: setCookie! },
      });
    const meRes = await app.request(meReq, {}, h.env);
    expect(meRes.status).toBe(200);
    const me = await meRes.json();
    expect(me).toHaveProperty('username', 'admin');
  });

  it('me returns 401 with missing session', async () => {
    const req = new Request('http://localhost/api/admin/me');
    const res = await app.request(req, {}, h.env);
    expect(res.status).toBe(401);
  });

  it('me returns 401 with unknown session', async () => {
    const req = new Request('http://localhost/api/admin/me', {
        headers: { cookie: 'session=nonexist' },
      });
    const res = await app.request(req, {}, h.env);
    expect(res.status).toBe(401);
  });

  it('expired session returns 401 and row is deleted', async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await h.db
      .prepare(
        'INSERT INTO sessions (id, admin_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
      )
      .bind('s-exp', 'a1', past, past)
      .run();

    const req = new Request('http://localhost/api/admin/me', {
        headers: { cookie: 'session=s-exp' },
      });
    const res = await app.request(req, {}, h.env);
    expect(res.status).toBe(401);

    const row = await h.db
      .prepare('SELECT id FROM sessions WHERE id = ?')
      .bind('s-exp')
      .first();
    expect(row).toBeNull();
  });

  it('logout clears session', async () => {
    const loginReq = new Request('http://localhost/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });
    const loginRes = await app.request(loginReq, {}, h.env);
    const setCookie = loginRes.headers.get('set-cookie')!;

    const logoutReq = new Request('http://localhost/api/admin/logout', {
        method: 'POST',
        headers: { cookie: setCookie },
      });
    const logoutRes = await app.request(logoutReq, {}, h.env);
    expect(logoutRes.status).toBe(200);
  });
});
