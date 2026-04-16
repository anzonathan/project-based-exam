/**
 * Root URL for the Django REST API, including the `/api` path segment.
 * Mirrors ``NEXT_PUBLIC_API_URL`` so both `fetch` helpers and `apiFetch` stay aligned.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_API_URL env var (set at build time / runtime)
 *  2. Localhost (development)
 *  3. Railway deployment (production fallback)
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000/api"
    : "https://cinequest.up.railway.app/api");