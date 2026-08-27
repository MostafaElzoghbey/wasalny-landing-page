import { describe, it, expect, beforeAll } from 'vitest';
import { migrate } from '../server/db/migrate.js';
import { getDb } from '../server/db/connection.js';
import { hashPassword, verifyPassword } from '../server/auth/passwords.js';
import { adminAuth } from '../server/routes/adminAuth.js';
import { getCookie } from 'hono/cookie';

// Minimal adapter so we can read a cookie string with Hono's own getCookie
// without pulling in a full Context. getCookie only reads `c.req.raw.headers`.
function readSession(cookieHeader: string): string | undefined {
  const ctx = {
    req: { raw: { headers: { get: (k: string) => (k === 'Cookie' ? cookieHeader : null) } } },
  } as unknown as Parameters<typeof getCookie>[0];
  return getCookie(ctx, 'session');
}

beforeAll(() => {
  // Force an in-memory database so the test never touches data/app.db.
  process.env.NODE_ENV = 'test';
  migrate(getDb());
});

describe('password hashing', () => {
  it('verifies a correct password', () => {
    const { hash, salt } = hashPassword('secret123');
    expect(verifyPassword('secret123', hash, salt)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const { hash, salt } = hashPassword('secret123');
    expect(verifyPassword('wrong-password', hash, salt)).toBe(false);
  });

  it('produces different hashes for the same password with different salts', () => {
    const a = hashPassword('secret123');
    const b = hashPassword('secret123');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    // Both must still verify against their own salt.
    expect(verifyPassword('secret123', a.hash, a.salt)).toBe(true);
    expect(verifyPassword('secret123', b.hash, b.salt)).toBe(true);
  });
});

describe('admin auth flow', () => {
  const EMAIL = 'admin@example.com';
  const PASSWORD = 'secret123';

  beforeAll(() => {
    const db = getDb();
    const { hash, salt } = hashPassword(PASSWORD);
    db.prepare(
      'INSERT INTO admins (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run('a1', EMAIL, hash, salt, new Date().toISOString());
  });

  it('logs in with valid credentials and sets a session cookie', async () => {
    const res = await adminAuth.request('/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });

    expect(res.status).toBe(200);
    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).not.toBeNull();
    expect(setCookieHeader!.toLowerCase()).toContain('session');
    expect(setCookieHeader!.toLowerCase()).toContain('httponly');

    const body = (await res.json()) as { ok: boolean; email: string };
    expect(body.ok).toBe(true);
    expect(body.email).toBe(EMAIL);
  });

  it('returns the admin email from /me when authenticated', async () => {
    const login = await adminAuth.request('/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const setCookieHeader = login.headers.get('set-cookie')!;
    const cookie = setCookieHeader.split(';')[0]; // "session=<id>"
    expect(readSession(cookie)).toBeTruthy();

    const res = await adminAuth.request('/me', {
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { email: string };
    expect(body.email).toBe(EMAIL);
  });

  it('rejects /me without a session cookie', async () => {
    const res = await adminAuth.request('/me');
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('unauthorized');
  });

  it('rejects login with a wrong password', async () => {
    const res = await adminAuth.request('/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: 'not-the-right-one' }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects login with a missing field', async () => {
    const res = await adminAuth.request('/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: EMAIL }),
    });
    expect(res.status).toBe(400);
  });

  it('logs out and invalidates the session', async () => {
    const login = await adminAuth.request('/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const cookie = login.headers.get('set-cookie')!.split(';')[0];

    const logout = await adminAuth.request('/logout', {
      method: 'POST',
      headers: { cookie },
    });
    expect(logout.status).toBe(200);

    const me = await adminAuth.request('/me', { headers: { cookie } });
    expect(me.status).toBe(401);
  });
});
