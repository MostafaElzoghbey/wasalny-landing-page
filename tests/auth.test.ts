import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHarness, type D1Harness } from './helpers/d1.js';
import {
  generateSessionId,
  hashPassword,
  needsRehash,
  verifyPassword,
} from '../server/auth/passwords.js';
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

const LOGIN_BODY = (email: string, password: string): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

describe('password hashing', () => {
  it('verifies a correct password', async () => {
    const stored = await hashPassword('secret123');
    expect(await verifyPassword('secret123', stored)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const stored = await hashPassword('secret123');
    expect(await verifyPassword('wrong-password', stored)).toBe(false);
  });

  it('encodes scheme, 210k iterations, 16-byte salt and 256-bit hash', async () => {
    const stored = await hashPassword('secret123');
    const [scheme, iterations, saltHex, hashHex] = stored.split('$');

    expect(scheme).toBe('pbkdf2-sha256');
    expect(iterations).toBe('210000');
    expect(saltHex).toMatch(/^[0-9a-f]{32}$/);
    expect(hashHex).toMatch(/^[0-9a-f]{64}$/);
    expect(needsRehash(stored)).toBe(false);
  });

  it('produces different hashes for the same password with different salts', async () => {
    const a = await hashPassword('secret123');
    const b = await hashPassword('secret123');
    expect(a).not.toBe(b);
    // Both must still verify.
    expect(await verifyPassword('secret123', a)).toBe(true);
    expect(await verifyPassword('secret123', b)).toBe(true);
  });

  it('rejects a legacy scrypt row that carries no scheme prefix', async () => {
    // A pre-PBKDF2 row: bare 64-byte digest plus its own hex salt.
    const scryptHash = 'a'.repeat(128);
    const scryptSalt = 'b'.repeat(32);

    expect(await verifyPassword('secret123', scryptHash, scryptSalt)).toBe(false);
    expect(needsRehash(scryptHash)).toBe(true);
  });

  it('rejects a row whose password_salt column disagrees with the encoded salt', async () => {
    const stored = await hashPassword('secret123');

    expect(await verifyPassword('secret123', stored, 'c'.repeat(32))).toBe(false);
    expect(needsRehash(stored)).toBe(false);
  });

  it('rejects a stored hash shorter than 256 bits without throwing', async () => {
    const stored = await hashPassword('secret123');
    const truncated = stored.replace(/.{8}$/, '');

    expect(await verifyPassword('secret123', truncated)).toBe(false);
  });

  it('flags a row derived with fewer iterations than current policy', () => {
    const fresh = 'pbkdf2-sha256$210000$' + 'a'.repeat(32) + '$' + 'b'.repeat(64);
    const weak = 'pbkdf2-sha256$1000$' + 'a'.repeat(32) + '$' + 'b'.repeat(64);

    expect(needsRehash(fresh)).toBe(false);
    expect(needsRehash(weak)).toBe(true);
  });
});

describe('session ids', () => {
  it('is 64 lowercase hex chars and differs on every call', () => {
    const a = generateSessionId();
    const b = generateSessionId();

    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(b).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe('admin auth flow', () => {
  const EMAIL = 'admin@example.com';
  const PASSWORD = 'secret123';

  let h: D1Harness;

  beforeAll(async () => {
    h = await createHarness();
    await h.applyMigrations();
    const hash = await hashPassword(PASSWORD);
    await h.db
      .prepare(
        'INSERT INTO admins (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind('a1', EMAIL, hash, hash.split('$')[2], new Date().toISOString())
      .run();
  });

  afterAll(async () => {
    await h.dispose();
  });

  it('logs in with valid credentials and sets a session cookie', async () => {
    const res = await adminAuth.request('/login', LOGIN_BODY(EMAIL, PASSWORD), h.env);

    expect(res.status).toBe(200);
    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).not.toBeNull();
    expect(setCookieHeader!.toLowerCase()).toContain('session');
    expect(setCookieHeader!.toLowerCase()).toContain('httponly');
    expect(setCookieHeader!.toLowerCase()).toContain('samesite=lax');
    expect(setCookieHeader!.toLowerCase()).toContain('max-age=604800');

    const body = (await res.json()) as { ok: boolean; email: string };
    expect(body.ok).toBe(true);
    expect(body.email).toBe(EMAIL);
  });

  it('omits Secure on a plain-HTTP request so wrangler dev can store the cookie', async () => {
    const res = await adminAuth.request('http://localhost/login', LOGIN_BODY(EMAIL, PASSWORD), h.env);

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')!.toLowerCase()).not.toContain('secure');
  });

  it('sets Secure on an https request', async () => {
    const res = await adminAuth.request('https://wasalny.app/login', LOGIN_BODY(EMAIL, PASSWORD), h.env);

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')!.toLowerCase()).toContain('secure');
  });

  it('returns the admin email from /me when authenticated', async () => {
    const login = await adminAuth.request('/login', LOGIN_BODY(EMAIL, PASSWORD), h.env);
    const setCookieHeader = login.headers.get('set-cookie')!;
    const cookie = setCookieHeader.split(';')[0]; // "session=<id>"
    expect(readSession(cookie)).toBeTruthy();

    const res = await adminAuth.request(
      '/me',
      {
        headers: { cookie },
      },
      h.env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { email: string };
    expect(body.email).toBe(EMAIL);
  });

  it('rejects /me without a session cookie', async () => {
    const res = await adminAuth.request('/me', {}, h.env);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('unauthorized');
  });

  it('rejects /me with an unknown session id', async () => {
    const res = await adminAuth.request(
      '/me',
      {
        headers: { cookie: `session=${generateSessionId()}` },
      },
      h.env,
    );
    expect(res.status).toBe(401);
  });

  it('rejects /me with an expired session and deletes that row', async () => {
    const expiredId = 'expired-session';
    await h.db.prepare('DELETE FROM sessions WHERE id = ?').bind(expiredId).run();
    await h.db
      .prepare('INSERT INTO sessions (id, admin_id, expires_at) VALUES (?, ?, ?)')
      .bind(expiredId, 'a1', new Date(Date.now() - 1000).toISOString())
      .run();

    const res = await adminAuth.request(
      '/me',
      { headers: { cookie: `session=${expiredId}` } },
      h.env,
    );
    expect(res.status).toBe(401);

    const row = await h.db
      .prepare('SELECT id FROM sessions WHERE id = ?')
      .bind(expiredId)
      .first();
    expect(row).toBeNull();
  });

  it('rejects login with a wrong password', async () => {
    const res = await adminAuth.request('/login', LOGIN_BODY(EMAIL, 'not-the-right-one'), h.env);
    expect(res.status).toBe(401);
  });

  it('rejects login with a missing field', async () => {
    const res = await adminAuth.request(
      '/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: EMAIL }),
      },
      h.env,
    );
    expect(res.status).toBe(400);
  });

  it('logs out and invalidates the session', async () => {
    const login = await adminAuth.request('/login', LOGIN_BODY(EMAIL, PASSWORD), h.env);
    const cookie = login.headers.get('set-cookie')!.split(';')[0];

    const logout = await adminAuth.request(
      '/logout',
      {
        method: 'POST',
        headers: { cookie },
      },
      h.env,
    );
    expect(logout.status).toBe(200);

    const me = await adminAuth.request('/me', { headers: { cookie } }, h.env);
    expect(me.status).toBe(401);
  });
});
