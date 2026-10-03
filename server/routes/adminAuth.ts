import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { getDb } from '../db/d1.js';
import type { AppEnv } from '../db/d1.js';
import { generateSessionId, verifyPassword } from '../auth/passwords.js';
import { requireAdmin } from '../middleware/auth.js';

export const adminAuth = new Hono<{ Bindings: AppEnv }>();

interface AdminRow {
  id: string;
  username: string | null;
  email: string | null;
  password_hash: string;
  password_salt: string | null;
}

const SESSION_TTL_MS = 7 * 864e5;
const SESSION_TTL_S = 7 * 86400;

adminAuth.post('/login', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid body' }, 400);
  }

  // Login accepts either a username or an email identifier (never both
  // required): username rows come from the S2 contract, email rows from the
  // admin dashboard and scripts/create-admin.ts.
  const record = body as { username?: unknown; email?: unknown; password?: unknown };
  const username = typeof record.username === 'string' ? record.username : undefined;
  const email = typeof record.email === 'string' ? record.email : undefined;
  const password = record.password;
  if ((username === undefined && email === undefined) || typeof password !== 'string') {
    return c.json({ error: 'username/email and password are required' }, 400);
  }

  const db = getDb(c.env);
  const row =
    username !== undefined
      ? await db
          .prepare(
            'SELECT id, username, email, password_hash, password_salt FROM admins WHERE username = ?',
          )
          .bind(username)
          .first<AdminRow>()
      : await db
          .prepare(
            'SELECT id, username, email, password_hash, password_salt FROM admins WHERE email = ?',
          )
          .bind(email)
          .first<AdminRow>();

  if (row === null || !(await verifyPassword(password, row.password_hash, row.password_salt))) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const sessionId = generateSessionId();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db
    .prepare('INSERT INTO sessions (id, admin_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(sessionId, row.id, expiresAt, now)
    .run();

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    // `process.env.NODE_ENV` does not exist on Workers, so it marked the prod
    // cookie insecure. The request scheme is the only correct signal in both
    // runtimes: no `Secure` on plain-HTTP `wrangler dev`, `Secure` on prod https.
    secure: new URL(c.req.url).protocol === 'https:',
    path: '/',
    maxAge: SESSION_TTL_S,
  });

  return c.json({ ok: true, username: row.username, email: row.email });
});

adminAuth.post('/logout', async (c) => {
  const sessionId = getCookie(c, 'session');
  if (sessionId) {
    await getDb(c.env)
      .prepare('DELETE FROM sessions WHERE id = ?')
      .bind(sessionId)
      .run();
  }
  deleteCookie(c, 'session', { path: '/' });
  return c.json({ ok: true });
});

adminAuth.get('/me', requireAdmin, async (c) => {
  const admin = c.get('admin');
  return c.json({ username: admin.username, email: admin.email });
});
