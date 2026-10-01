// scripts/create-admin.ts
// Creates or re-passwords an admin row using the SAME PBKDF2 encoder the
// Worker verifies against (server/auth/passwords.ts), then applies it to D1
// through `wrangler d1 execute`.
//
// Why wrangler and not better-sqlite3: the admin table now lives in D1, so a
// Node-only write to data/app.db no longer reaches the database the API serves.
// This script therefore shells out to wrangler, which writes the local D1
// database by default and the remote one with `--remote`.
//
// The write is an UPSERT keyed on `email` and it KEEPS `admins.id` on update
// (the UPDATE branch touches only the hash columns), so existing `sessions`
// rows stay valid across a password reset — same contract the previous
// better-sqlite3 version had. Re-running never creates a second row.
//
// Usage:
//   npm run admin:create -- <email> <password>            # local D1
//   npm run admin:create -- <email> <password> --remote   # remote D1
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create
//
// Any other flag (e.g. `--persist-to <dir>`, `--env staging`) is forwarded to
// `wrangler d1 execute` untouched. Defaults to `--local` when neither
// `--local` nor `--remote` is given.
//
// Requires the schema first:
//   npx wrangler d1 migrations apply wasalny-db --local|--remote

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';
import { hashPassword } from '../server/auth/passwords.js';

const DB_NAME = 'wasalny-db';

interface Args {
  email: string;
  password: string;
  remote: boolean;
  wranglerFlags: readonly string[];
}

/**
 * The first two bare tokens are `<email> <password>`; every remaining token is
 * forwarded to `wrangler d1 execute` verbatim, in order, so flags that take a
 * value (`--persist-to <dir>`, `--env staging`) keep it.
 */
function parseArgs(argv: readonly string[]): Args {
  const positional: string[] = [];
  const forwarded: string[] = [];
  for (const token of argv) {
    if (positional.length < 2 && !token.startsWith('--')) positional.push(token);
    else forwarded.push(token);
  }

  const email = (positional[0] ?? process.env.ADMIN_EMAIL ?? '').trim();
  const password = (positional[1] ?? process.env.ADMIN_PASSWORD ?? '').trim();
  const remote = forwarded.includes('--remote');

  if (email.length === 0 || password.length === 0) {
    process.stderr.write(
      'Usage: tsx scripts/create-admin.ts <email> <password> [--remote] [wrangler flags]\n' +
        '   or set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.\n',
    );
    process.exit(1);
  }

  const wranglerFlags = ['--local', ...forwarded.filter((f) => f !== '--local')];

  return { email, password, remote, wranglerFlags };
}

/**
 * Single-quoted SQL literal. Doubling `'` is sufficient — SQLite does not
 * process backslash escapes inside a quoted string.
 */
function lit(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

/**
 * One UPSERT. `admins.email` is UNIQUE (0001_init.sql), so the conflict target
 * is valid, and the DO UPDATE branch leaves `id` and `created_at` alone. The
 * salt column is set to NULL: the PBKDF2 parameters travel inside
 * `password_hash`, and the login verifier trusts the embedded salt when the
 * column is NULL.
 */
function upsertSql(args: Args, hash: string, createdAt: string): string {
  const values = [
    lit(`admin-${crypto.randomUUID()}`),
    lit(args.email),
    lit(hash),
    'NULL',
    lit(createdAt),
  ].join(', ');
  return [
    `INSERT INTO admins (id, email, password_hash, password_salt, created_at)`,
    `VALUES (${values})`,
    `ON CONFLICT(email) DO UPDATE SET`,
    `  password_hash = excluded.password_hash,`,
    `  password_salt = excluded.password_salt;`,
    '',
  ].join('\n');
}

/**
 * Runs the SQL through the wrangler CLI. The statement goes through a
 * throwaway file rather than `--command` so the hash never lands in a shell
 * history or in `ps` output, and the directory is removed either way.
 */
function executeOnD1(sql: string, flags: readonly string[]): void {
  const dir = mkdtempSync(resolve(tmpdir(), 'wasalny-admin-'));
  const file = resolve(dir, 'admin.sql');
  try {
    writeFileSync(file, sql, { encoding: 'utf8', mode: 0o600 });
    execFileSync(
      'npx',
      ['wrangler', 'd1', 'execute', DB_NAME, ...flags, '--file', file],
      { stdio: ['ignore', 'ignore', 'inherit'] },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const hash = await hashPassword(args.password);
  executeOnD1(upsertSql(args, hash, new Date().toISOString()), args.wranglerFlags);
  const target = args.remote ? 'remote' : 'local';
  process.stdout.write(
    `Upserted admin account for ${args.email} into ${DB_NAME} (${target}).\n`,
  );
}

await main().catch((error: unknown) => {
  process.stderr.write(`create-admin failed: ${String(error)}\n`);
  process.exit(1);
});
