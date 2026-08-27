import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

export interface PasswordHash {
  hash: string;
  salt: string;
}

/**
 * Hashes a password with scrypt using a per-call random 16-byte salt.
 * Returns hex-encoded salt and hash (64 bytes of scrypt output).
 */
export function hashPassword(password: string): PasswordHash {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

/**
 * Verifies a password against a stored hex hash + salt using a constant-time
 * comparison. Returns false for malformed input rather than throwing.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  let derived: Buffer;
  try {
    derived = scryptSync(password, salt, 64);
  } catch {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(expected, derived);
}
