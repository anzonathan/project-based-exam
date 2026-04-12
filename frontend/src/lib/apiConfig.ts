/** Base URL for the Django API (trailing path segments omit the /api prefix). */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
