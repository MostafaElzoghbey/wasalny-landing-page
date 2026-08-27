import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from '../db/connection.js';

export interface AdminClaim {
  id: string;
  email: string;
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
  email: string;
  expires_at: string;
}

/**
 * Hono middleware that requires a valid opaque session cookie.
 *
 * On success it stores `{ id, email }` on the context under the `admin` key
 * and calls `next()`. On any failure (missing cookie, unknown session, or an
 * expired session that is deleted as a side effect) it responds 401.
 */
export const requireAdmin = async (c: Context, next: Next): Promise<Response | void> => {
  const sessionId = getCookie(c, 'session');
  if (!sessionId) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.id AS session_id, s.admin_id, a.email, s.expires_at
       FROM sessions s
       JOIN admins a ON a.id = s.admin_id
       WHERE s.id = ?`,
    )
    .get(sessionId) as SessionLookup | undefined;

  if (!row) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  if (row.expires_at < new Date().toISOString()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return c.json({ error: 'unauthorized' }, 401);
  }

  c.set('admin', { id: row.admin_id, email: row.email } satisfies AdminClaim);
  await next();
};
