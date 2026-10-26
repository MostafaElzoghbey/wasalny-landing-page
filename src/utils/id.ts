/**
 * Generate a prefixed unique ID.
 * Uses crypto.randomUUID() (available in browsers, Node 19+, Workers).
 * Format: `prefix-xxxxxxxxxxxxxxxx` (12 hex chars after prefix).
 *
 * nanoid was considered but not installed — crypto.randomUUID() needs zero deps.
 */
export function generateId(prefix: string): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `${prefix}-${random}`;
}
