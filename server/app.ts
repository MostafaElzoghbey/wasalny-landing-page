import { Hono } from 'hono';
import { publicApi } from './routes/public.js';
import { adminAuth } from './routes/adminAuth.js';
import { adminCrud } from './routes/adminCrud.js';
import type { AppEnv } from './db/d1.js';

// Composed Hono application. This module is intentionally side-effect free:
// it never calls migrate/seed/listen at import time so it can be safely
// imported by the test suite (where `dist/` is absent and no DB boot occurs).
//
// Deliberately API-only: static assets and the SPA fallback are owned by
// Cloudflare's asset server (the `assets` block in wrangler.jsonc), which is why
// this module has no filesystem static handler. See the mirror docstring in
// server/worker.ts.
export const app = new Hono<{ Bindings: AppEnv }>();

// --- API surface -----------------------------------------------------------
// publicApi  -> /api/data, /api/pricing
// adminAuth  -> /api/admin/login, /api/admin/logout, /api/admin/me
// adminCrud  -> /api/admin/<cars|faqs|route-data|content|locations|...>
// Mounting both adminAuth and adminCrud under /api/admin is safe because their
// sub-paths do not collide.
app.route('/api', publicApi);
app.route('/api/admin', adminAuth);
app.route('/api/admin', adminCrud);

// Any /api/* path that is not matched by the mounted sub-apps returns a 404
// JSON response (covers all HTTP methods). Registered last so an unknown
// /api/* path is never answered with the SPA's index.html: on Workers the
// `assets` block sends every /api/* request here first (run_worker_first), and
// on the Node runner there is no static fallback at all.
app.all('/api/*', (c) => c.json({ error: 'Not Found' }, 404));
