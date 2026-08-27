import { Hono } from 'hono';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { publicApi } from './routes/public.js';
import { adminAuth } from './routes/adminAuth.js';
import { adminCrud } from './routes/adminCrud.js';

// Composed Hono application. This module is intentionally side-effect free:
// it never calls migrate/seed/listen at import time so it can be safely
// imported by the test suite (where `dist/` is absent and no DB boot occurs).
export const app = new Hono();

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
// JSON response (covers all HTTP methods). This is registered before the
// static-serving block so API routes are never served by the SPA fallback.
app.all('/api/*', (c) => c.json({ error: 'Not Found' }, 404));

// --- Production static file serving ---------------------------------------
// Only meaningful when a production build exists at <cwd>/dist. Guarded so that
// importing this module in dev/test (where `dist/` is absent) never throws.
//
// Implemented with node:fs (no external static-server dependency) so the server
// is self-contained: it serves hashed build assets and any root-level files
// (favicon, robots.txt, …), and falls back to index.html for client-side
// routing on unmatched non-/api routes.
const distDir = join(process.cwd(), 'dist');

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.mjs': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=UTF-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json; charset=UTF-8',
};

function contentTypeFor(filePath: string): string {
  return CONTENT_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

if (existsSync(join(distDir, 'index.html'))) {
  // Serve real files from dist; fall through to the SPA fallback when missing.
  app.use('/*', async (c, next) => {
    const urlPath = decodeURIComponent(new URL(c.req.url).pathname);
    const rel = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(distDir, rel);

    // Block path traversal and only serve existing regular files.
    if (
      !filePath.startsWith(distDir) ||
      !existsSync(filePath) ||
      !statSync(filePath).isFile()
    ) {
      await next();
      return;
    }

    const data = readFileSync(filePath);
    return c.body(data, 200, { 'content-type': contentTypeFor(filePath) });
  });

  // SPA fallback: any non-/api route that did not match a real file returns
  // index.html so client-side routing works on hard refresh / deep links.
  app.get('/*', (c) => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8');
    return c.html(html);
  });
}
