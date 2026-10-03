// Allowlist for Arabic-only names (letters, tatweel, tashkeel, space, Arabic comma).
// eslint-disable-next-line no-misleading-character-class -- tashkeel marks are matched standalone on purpose.
const ALLOWED_CHAR = new RegExp('[\\u0621-\\u064A\\u066E\\u0671-\\u06D3\\u06FA-\\u06FC\\u064B-\\u065F\\u06D6-\\u06ED \\u060C]', 'u');

export function filterArabicName(value: string): string {
  return [...value].filter((ch) => ALLOWED_CHAR.test(ch)).join('');
}

export function validateArabicName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return 'الاسم مطلوب';
  if ([...trimmed].some((ch) => !ALLOWED_CHAR.test(ch))) return 'الاسم يجب أن يكون باللغة العربية فقط';
  return null;
}
