// server/auth/passwords.ts
// Owns the two WebCrypto secrets the admin API needs: PBKDF2-HMAC-SHA256
// password hashes and opaque session tokens. Runs unchanged on Cloudflare
// Workers (workerd) and on Node >= 20 — no `node:crypto`, no `Buffer`, no sync
// KDF, so a login never blocks the event loop or trips a Workers CPU limit.
//
// Stored form: `pbkdf2-sha256$<iterations>$<saltHex>$<hashHex>`
//
//   - salt  : 16 bytes from `crypto.getRandomValues`, hex, 32 chars
//   - hash  : 256 bits (32 bytes) from `deriveBits`, hex, 64 chars
//   - the parameters travel with the digest, so raising PBKDF2_ITERATIONS later
//     does not invalidate existing rows: `needsRehash` detects them and the row
//     can be re-derived on the next successful login.
//
// `admins.password_salt` is now nullable: the parameters travel with the
// digest, so a NULL salt column means "verify against the embedded salt".
// `verifyPassword` still requires a non-NULL column and the encoded string to
// agree, so a half-written row fails closed instead of verifying against one
// salt and being stored with another. Rows created without a salt column
// (username-only S2 rows, `scripts/create-admin.ts`) verify purely from the
// self-contained string.
//
// Legacy scrypt rows (bare 64-byte digest, no scheme prefix) can no longer log
// in — scrypt output cannot be re-derived as PBKDF2 — so they MUST be reset:
//
//   npm run admin:create -- <email> '<new-password>'
//
// `scripts/create-admin.ts` UPSERTs on `email` and keeps `admins.id`, so
// existing `sessions` rows stay valid; revoke them deliberately after a
// compromise by signing the admin out (POST /api/admin/logout) or by running
//
//   sqlite3 data/app.db "DELETE FROM sessions WHERE admin_id = '<admins.id>'"

/** Encoded-scheme discriminator, also the first `$`-separated field. */
const SCHEME = 'pbkdf2-sha256';

/** OWASP 2023 floor for PBKDF2-HMAC-SHA256. */
const PBKDF2_ITERATIONS = 210_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;
const HASH_BYTES = HASH_BITS / 8;

/** 32 bytes of CSPRNG output = 256 bits of session-token entropy. */
const SESSION_ID_BYTES = 32;

const LOWERCASE_HEX = /^[0-9a-f]+$/;
const ENCODER = new TextEncoder();

interface ParsedHash {
  iterations: number;
  saltHex: string;
  hashHex: string;
}

/** Lowercase hex, byte-per-iteration. No `Buffer` — workerd has none. */
function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Splits a stored string into its parameters, or `null` if it is unusable. */
function parseHash(stored: string): ParsedHash | null {
  const fields = stored.split('$');
  if (fields.length !== 4) {
    return null;
  }
  const [scheme, iterations, saltHex, hashHex] = fields;
  if (scheme !== SCHEME || !LOWERCASE_HEX.test(saltHex) || !LOWERCASE_HEX.test(hashHex)) {
    return null;
  }
  const count = Number(iterations);
  if (!Number.isInteger(count) || count < 1) {
    return null;
  }
  if (saltHex.length !== SALT_BYTES * 2 || hashHex.length !== HASH_BYTES * 2) {
    return null;
  }
  return { iterations: count, saltHex, hashHex };
}

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

/**
 * Constant-time byte comparison.
 *
 * `crypto.subtle.timingSafeEqual` is a Cloudflare extension — present in
 * workerd, absent in Node before v24 — so the Node runner and the vitest suite
 * take the XOR-accumulate loop the extension itself implements. Both paths need
 * the length guard up front: the native call throws on a length mismatch
 * instead of returning false.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const native = crypto.subtle.timingSafeEqual;
  if (typeof native === 'function') {
    return native.call(crypto.subtle, a, b);
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Hashes a password with PBKDF2-HMAC-SHA256 over a fresh 16-byte random salt.
 * Returns the self-contained encoded string
 * (`pbkdf2-sha256$<iterations>$<saltHex>$<hashHex>`), which is the value stored
 * in `admins.password_hash`. The string binds directly as a SQL TEXT parameter.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const saltHex = toHex(salt);
  const derived = await deriveBits(password, salt, PBKDF2_ITERATIONS);
  return `${SCHEME}$${PBKDF2_ITERATIONS}$${saltHex}$${toHex(derived)}`;
}

/**
 * Verifies a password against a stored `pbkdf2-sha256$...` string.
 *
 * `saltColumn` is `admins.password_salt`. When it is a string it must match
 * the salt encoded in `stored` or the row is rejected; when it is null or
 * undefined (rows created without a salt column) the embedded salt is trusted.
 * Returns false — never throws — for a legacy scrypt row, a malformed string,
 * or a wrong password.
 */
export async function verifyPassword(
  password: string,
  stored: string,
  saltColumn?: string | null,
): Promise<boolean> {
  const parsed = parseHash(stored);
  if (parsed === null) {
    return false;
  }
  if (saltColumn !== undefined && saltColumn !== null && parsed.saltHex !== saltColumn) {
    return false;
  }
  const derived = await deriveBits(password, fromHex(parsed.saltHex), parsed.iterations);
  return timingSafeEqual(fromHex(parsed.hashHex), derived);
}

/**
 * True when `stored` is unusable or weaker than the current policy, i.e. the
 * row should be re-hashed on the next successful login. The login handler only
 * gets to write on success once its write path moves to `c.env.DB` (Task 7).
 */
export function needsRehash(stored: string): boolean {
  const parsed = parseHash(stored);
  return parsed === null || parsed.iterations < PBKDF2_ITERATIONS;
}

/** Opaque session id: 32 CSPRNG bytes as 64 lowercase hex chars. */
export function generateSessionId(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(SESSION_ID_BYTES)));
}
