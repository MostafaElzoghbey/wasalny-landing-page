import { Hono } from 'hono';
import { publicApi } from './routes/public.js';
import { adminAuth } from './routes/adminAuth.js';
import { adminCrud } from './routes/adminCrud.js';
import type { AppEnv } from './db/d1.js';

/**
 * Cloudflare Worker entry point (wrangler `main`).
 *
 * It composes the exact same sub-apps as the Node entry in `app.ts`, so the
 * mounted route tree is identical in both runtimes:
 *
 *   publicApi  -> /api/data, /api/pricing
 *   adminAuth  -> /api/admin/login, /api/admin/logout, /api/admin/me
 *   adminCrud  -> /api/admin/<cars|faqs|route-data|content|locations|...>
 *
 * Mounting both adminAuth and adminCrud under /api/admin is safe because their
 * sub-paths do not collide.
 *
 * This module is the Workers-side mirror of `app.ts` and deliberately contains
 * NO `node:fs` / `node:path` / `node:process` imports: the static asset /
 * SPA fallback there is replaced on Workers by the `assets` block in
 * wrangler.jsonc (`not_found_handling: single-page-application` with
 * `run_worker_first: ["/api/*"]`), so this Worker only has to own `/api/*`.
 *
 * Every mounted router reads through the request-scoped `DB` binding
 * (`getDb(c.env)`), so the Worker never touches the Node `better-sqlite3`
 * singleton.
 */
const app = new Hono<{ Bindings: AppEnv }>();

app.route('/api', publicApi);
app.route('/api/admin', adminAuth);
app.route('/api/admin', adminCrud);

app.get('/api/health', (c) => c.json({ ok: true }));

// Any /api/* path that is not matched by the mounted sub-apps returns a 404
// JSON response (covers all HTTP methods). Registered AFTER the routers and
// BEFORE anything else so an unknown /api/* path can never fall through to the
// SPA asset fallback and be answered with HTML.
app.all('/api/*', (c) => c.json({ error: 'Not Found' }, 404));

export default app;
