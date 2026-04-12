import { API_BASE_URL } from "@/lib/apiConfig";

/**
 * Fetch the anonymous TMDB-shaped movie document (credits, videos, recommendations, similar).
 *
 * Unlike ``moviesAPI.getDetail``, this uses a plain ``fetch`` so the client can read
 * nested TMDB blocks without going through the typed compact serializer.
 *
 * @param tmdbId TMDB numeric movie id
 * @throws Error when the response status is not OK
 */
export async function fetchTmdbMovieBundle(tmdbId: number): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/movies/tmdb/${tmdbId}/`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}
