import { API_BASE_URL } from "@/lib/apiConfig";

/** Raw TMDB-shaped movie JSON from GET /movies/tmdb/{id}/ (includes recommendations, similar). */
export async function fetchTmdbMovieBundle(tmdbId: number): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/movies/tmdb/${tmdbId}/`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}
