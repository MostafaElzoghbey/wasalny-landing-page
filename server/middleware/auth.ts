import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from '../db/d1.js';
import type { AppEnv } from '../db/d1.js';

export interface AdminClaim {
  id: string;
  username: string | null;
  email: string | null;
}

// Make the `admin` context variable available to any Hono app that imports
// `requireAdmin`, so `c.set('admin', ...)` / `c.get('admin')` are typed.
declare module 'hono' {
  interface ContextVariableMap {
    admin: AdminClaim;
  }
}

interface SessionLookup {
  session_id: string;
  admin_id: string;
  username: string | null;
  email: string | null;
  expires_at: string;
}

/**
 * Hono middleware that requires a valid opaque session cookie.
 *
 * On success it stores `{ id, email }` on the context under the `admin` key
 * and calls `next()`. On any failure (missing cookie, unknown session, or an
 * expired session that is deleted as a side effect) it responds 401.
 *
 * The session read and the expired-session delete go through the request-scoped
 * D1 binding (`c.env.DB`), so no per-request state is shared between workers.
 */
export const requireAdmin: MiddlewareHandler<{ Bindings: AppEnv }> = async (c, next) => {
  const sessionId = getCookie(c, 'session');
  if (!sessionId) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const db = getDb(c.env);
  const row = await db
    .prepare(
      `SELECT s.id AS session_id, s.admin_id, a.username, a.email, s.expires_at
       FROM sessions s
       JOIN admins a ON a.id = s.admin_id
       WHERE s.id = ?`,
    )
    .bind(sessionId)
    .first<SessionLookup>();

  if (row === null) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  if (row.expires_at < new Date().toISOString()) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    return c.json({ error: 'unauthorized' }, 401);
  }

  c.set(
    'admin',
    { id: row.admin_id, username: row.username, email: row.email } satisfies AdminClaim,
  );
  await next();
};