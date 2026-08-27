import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { randomBytes } from 'node:crypto';
import { getDb } from '../db/connection.js';
import { verifyPassword } from '../auth/passwords.js';
import { requireAdmin } from '../middleware/auth.js';

export const adminAuth = new Hono();

interface AdminRow {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
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

  const email = (body as { email?: unknown }).email;
  const password = (body as { password?: unknown }).password;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return c.json({ error: 'email and password are required' }, 400);
  }

  const db = getDb();
  const row = db
    .prepare('SELECT id, email, password_hash, password_salt FROM admins WHERE email = ?')
    .get(email) as AdminRow | undefined;

  if (!row || !verifyPassword(password, row.password_hash, row.password_salt)) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare('INSERT INTO sessions (id, admin_id, expires_at) VALUES (?, ?, ?)').run(
    sessionId,
    row.id,
    expiresAt,
  );

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_S,
  });

  return c.json({ ok: true, email: row.email });
});

adminAuth.post('/logout', async (c) => {
  const sessionId = getCookie(c, 'session');
  if (sessionId) {
    getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }
  deleteCookie(c, 'session', { path: '/' });
  return c.json({ ok: true });
});

adminAuth.get('/me', requireAdmin, (c) => {
  const admin = c.get('admin');
  return c.json({ email: admin.email });
});
