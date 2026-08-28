// API base URL. Defaults to same-origin (relative `/api/...`) so the app works
// out of the box whether served by the Hono server in production or via the
// Vite dev proxy. Set VITE_BASE_URL only when the API is hosted on a different
// origin than the frontend (e.g. a separate Node host).
export const BASE_URL: string =
  (import.meta.env.VITE_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
