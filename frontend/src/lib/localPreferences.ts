import type { LocalLikedMovie, LocalWatchlistItem } from "@/types/movie";

const LIKED_STORAGE_KEY = "cq_liked";
const WATCHLIST_STORAGE_KEY = "cq_watchlist";

export function getLikedMovies(): LocalLikedMovie[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveLikedMovies(movies: LocalLikedMovie[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(movies));
}

export function getWatchlist(): LocalWatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveWatchlist(movies: LocalWatchlistItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(movies));
}
