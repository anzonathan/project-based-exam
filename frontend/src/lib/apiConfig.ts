/**
 * Root URL for the Django REST API, including the `/api` path segment.
 * Mirrors ``NEXT_PUBLIC_API_URL`` so both `fetch` helpers and `apiFetch` stay aligned.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
