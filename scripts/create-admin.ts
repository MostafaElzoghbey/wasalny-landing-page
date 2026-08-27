import { randomUUID } from 'node:crypto';
import { getDb } from '../server/db/connection.js';
import { migrate } from '../server/db/migrate.js';
import { hashPassword } from '../server/auth/passwords.js';

function resolveCredentials(): { email: string; password: string } {
  const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? '').trim();
  const password = (process.argv[3] ?? process.env.ADMIN_PASSWORD ?? '').trim();

  if (email.length === 0 || password.length === 0) {
    process.stderr.write(
      'Usage: tsx scripts/create-admin.ts <email> <password>\n' +
        '   or set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.\n',
    );
    process.exit(1);
  }

  return { email, password };
}

function main(): void {
  const { email, password } = resolveCredentials();

  const db = getDb();
  migrate(db);

  const { hash, salt } = hashPassword(password);

  const existing = db
    .prepare('SELECT id FROM admins WHERE email = ?')
    .get(email) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      'UPDATE admins SET password_hash = ?, password_salt = ? WHERE email = ?',
    ).run(hash, salt, email);
    process.stdout.write(`Updated admin account for ${email}.\n`);
  } else {
    const id = 'admin-' + randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(
      'INSERT INTO admins (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(id, email, hash, salt, createdAt);
    process.stdout.write(`Created admin account for ${email}.\n`);
  }
}

main();
