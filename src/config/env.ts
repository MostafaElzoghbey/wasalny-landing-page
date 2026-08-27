export const BASE_URL: string =
  (import.meta.env.VITE_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'https://wasalny.pages.dev'
