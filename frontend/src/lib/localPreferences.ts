import type { LocalLikedMovie, LocalWatchlistItem } from "@/types/movie";

/** Browser localStorage keys for client-only movie lists. */
export const LOCAL_STORAGE_KEYS = {
  likedMovies: "cq_liked",
  watchlist: "cq_watchlist",
  watched: "cq_watched",
} as const;

const LIKED_STORAGE_KEY = LOCAL_STORAGE_KEYS.likedMovies;
const WATCHLIST_STORAGE_KEY = LOCAL_STORAGE_KEYS.watchlist;
const WATCHED_STORAGE_KEY = LOCAL_STORAGE_KEYS.watched;

/** Read parsed liked/disliked entries from localStorage (empty array on server or parse errors). */
export function getLikedMovies(): LocalLikedMovie[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Persist the full liked/disliked list under ``LOCAL_STORAGE_KEYS.likedMovies``. */
export function saveLikedMovies(movies: LocalLikedMovie[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(movies));
}

/** Read parsed local watchlist items from localStorage. */
export function getWatchlist(): LocalWatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Persist the full local watchlist under ``LOCAL_STORAGE_KEYS.watchlist``. */
export function saveWatchlist(movies: LocalWatchlistItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(movies));
}

/** Read parsed local watched items from localStorage. */
export function getWatchedMovies(): { id: number }[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WATCHED_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Persist the full local watched list under ``LOCAL_STORAGE_KEYS.watched``. */
export function saveWatchedMovies(movies: { id: number }[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(movies));
}
