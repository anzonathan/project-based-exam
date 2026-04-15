"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Play, Heart, Bookmark, ThumbsDown, Eye, CheckCircle, ThumbsUp } from "lucide-react";
import { posterUrl, formatRuntime, ratingColor, cn } from "@/lib/utils";
import type { MovieCompact } from "@/types/movie";
import { useAuth } from "@/lib/AuthContext";
import { recommendationsAPI } from "@/lib/api";
import { 
  getLikedMovies, saveLikedMovies, 
  getWatchlist, saveWatchlist,
  getWatchedMovies, saveWatchedMovies
} from "@/lib/localPreferences";

interface MovieCardProps {
  movie: MovieCompact;
  size?: "sm" | "md" | "lg";
  showOverview?: boolean;
  index?: number;
}

export default function MovieCard({
  movie,
  size = "md",
  showOverview = false,
  index = 0,
}: MovieCardProps) {
  const { isAuthenticated } = useAuth();
  const tmdbId = movie.tmdb_id || movie.id;
  const imgUrl = posterUrl(
    movie.poster_url || (movie as any).poster_path,
    size === "sm" ? "w185" : "w500"
  );

  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  useEffect(() => {
    const liked = getLikedMovies();
    const watchlist = getWatchlist();
    const watched = getWatchedMovies();
    const likedEntry = liked.find((m) => m.id === tmdbId);
    setIsLiked(likedEntry?.type === "like");
    setIsDisliked(likedEntry?.type === "dislike");
    setIsBookmarked(watchlist.some((m) => m.id === tmdbId));
    setIsWatched(watched.some((m) => m.id === tmdbId));
  }, [tmdbId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const liked = getLikedMovies();
    const filtered = liked.filter((m) => m.id !== tmdbId);

    if (isLiked) {
      saveLikedMovies(filtered);
      setIsLiked(false);
    } else {
      saveLikedMovies([...filtered, {
        id: tmdbId,
        title: movie.title,
        poster_url: imgUrl,
        type: "like",
        genres: movie.genre_ids || (movie.genres || []).map(g => g.id),
        timestamp: Date.now()
      }]);
      setIsLiked(true);
      setIsDisliked(false);

      if (isAuthenticated) {
        recommendationsAPI.trackInteraction({
          movie_tmdb_id: tmdbId,
          movie_title: movie.title,
          poster_path: (movie as any).poster_path || "",
          interaction_type: "like",
          genre_ids: movie.genre_ids || (movie.genres || []).map(g => g.id)
        }).catch(console.error);
      }
    }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const liked = getLikedMovies();
    const filtered = liked.filter((m) => m.id !== tmdbId);

    if (isDisliked) {
      saveLikedMovies(filtered);
      setIsDisliked(false);
    } else {
      saveLikedMovies([...filtered, {
        id: tmdbId,
        title: movie.title,
        poster_url: imgUrl,
        type: "dislike",
        genres: movie.genre_ids || (movie.genres || []).map(g => g.id),
        timestamp: Date.now()
      }]);
      setIsDisliked(true);
      setIsLiked(false);

      if (isAuthenticated) {
        recommendationsAPI.trackInteraction({
          movie_tmdb_id: tmdbId,
          movie_title: movie.title,
          poster_path: (movie as any).poster_path || "",
          interaction_type: "dislike",
          genre_ids: movie.genre_ids || (movie.genres || []).map(g => g.id)
        }).catch(console.error);
      }
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const watchlist = getWatchlist();
    if (isBookmarked) {
      saveWatchlist(watchlist.filter((m) => m.id !== tmdbId));
      setIsBookmarked(false);
    } else {
      saveWatchlist([...watchlist, {
        id: tmdbId,
        title: movie.title,
        poster_url: imgUrl,
        timestamp: Date.now()
      }]);
      setIsBookmarked(true);

      if (isAuthenticated) {
        recommendationsAPI.addToWatchlist({
          movie_tmdb_id: tmdbId,
          movie_title: movie.title,
          poster_path: (movie as any).poster_path || "",
        }).catch(console.error);
      }
    }
  };

  const handleWatched = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const watched = getWatchedMovies();
    if (isWatched) {
      saveWatchedMovies(watched.filter((m) => m.id !== tmdbId));
      setIsWatched(false);
    } else {
      saveWatchedMovies([...watched, { id: tmdbId }]);
      setIsWatched(true);
      if (isAuthenticated) {
        recommendationsAPI.trackInteraction({
          movie_tmdb_id: tmdbId,
          movie_title: movie.title,
          poster_path: (movie as any).poster_path || "",
          interaction_type: "watched",
          genre_ids: movie.genre_ids || (movie.genres || []).map(g => g.id)
        }).catch(console.error);
      }
    }
  };

  const sizeClasses = { sm: "w-[140px]", md: "w-[175px]", lg: "w-[220px]" };
  const imgHeight = { sm: "h-[210px]", md: "h-[262px]", lg: "h-[330px]" };

  return (
    <Link
      href={`/movie/${tmdbId}`}
      className={`movie-card group flex-shrink-0 ${sizeClasses[size]}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Poster */}
      <div className={`relative ${imgHeight[size]} rounded-xl overflow-hidden bg-surface-2 mb-3`}>
        <Image
          src={imgUrl}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes={size === "sm" ? "140px" : size === "md" ? "175px" : "220px"}
          unoptimized
        />

        {/* Shine overlay */}
        <div className="movie-card-shine" />

        {/* Interaction Buttons (Top Right) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button
            onClick={handleLike}
            className={cn(
              "p-2 rounded-lg backdrop-blur-md border transition-all duration-300",
              isLiked 
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                : "bg-black/40 border-white/10 text-white/60 hover:text-emerald-400 hover:border-emerald-500/30"
            )}
            title={isLiked ? "Unlike" : "Like"}
          >
            <ThumbsUp className={cn("w-3.5 h-3.5", isLiked && "fill-emerald-400")} />
          </button>
          <button
            onClick={handleDislike}
            className={cn(
              "p-2 rounded-lg backdrop-blur-md border transition-all duration-300",
              isDisliked 
                ? "bg-red-500/20 border-red-500/40 text-red-400" 
                : "bg-black/40 border-white/10 text-white/60 hover:text-red-400 hover:border-red-500/30"
            )}
            title={isDisliked ? "Un-dislike" : "Dislike"}
          >
            <ThumbsDown className={cn("w-3.5 h-3.5", isDisliked && "fill-red-400")} />
          </button>
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20">
          <button
            onClick={handleBookmark}
            className={cn(
              "p-2 rounded-lg backdrop-blur-md border transition-all duration-300",
              isBookmarked 
                ? "bg-gold/20 border-gold/40 text-gold" 
                : "bg-black/40 border-white/10 text-white/60 hover:text-gold hover:border-gold/30 opacity-0 group-hover:opacity-100"
            )}
            title={isBookmarked ? "Remove from Watchlist" : "Save to Watchlist"}
          >
            <Bookmark className={cn("w-3.5 h-3.5", isBookmarked && "fill-gold")} />
          </button>
          <button
            onClick={handleWatched}
            className={cn(
              "p-2 rounded-lg backdrop-blur-md border transition-all duration-300",
              isWatched 
                ? "bg-blue-500/20 border-blue-500/40 text-blue-400" 
                : "bg-black/40 border-white/10 text-white/60 hover:text-blue-400 hover:border-blue-500/30 opacity-0 group-hover:opacity-100"
            )}
            title={isWatched ? "Mark as Unwatched" : "Mark as Watched"}
          >
            <Eye className={cn("w-3.5 h-3.5", isWatched && "fill-blue-400")} />
          </button>
        </div>

        {/* Hover overlay */}
        <div className="movie-card-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 flex flex-col items-center justify-end pb-4 transition-opacity duration-400">
          <div className="w-11 h-11 rounded-full bg-gold/90 flex items-center justify-center mb-2 shadow-lg shadow-gold/30 transition-transform group-hover:scale-110">
            <Play className="w-4 h-4 text-surface-0 ml-0.5" fill="currentColor" />
          </div>
          <span className="text-[11px] text-white/70 font-medium">View Details</span>
        </div>

        {/* Rating badge */}
        {movie.vote_average > 0 && !isLiked && !isDisliked && !isBookmarked && !isWatched && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/5 transition-opacity group-hover:opacity-0">
            <Star className="w-3 h-3 text-gold fill-gold" />
            <span className={`text-[11px] font-bold ${ratingColor(movie.vote_average)}`}>
              {movie.vote_average.toFixed(1)}
            </span>
          </div>
        )}

        {/* Bottom gradient (always visible, subtle) */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface-0/50 to-transparent pointer-events-none" />
      </div>

      {/* Info */}
      <div className="space-y-1 px-0.5">
        <h3 className="text-[13px] font-semibold line-clamp-2 text-white/90 group-hover:text-gold transition-colors duration-300 leading-snug">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-white/30">
          {movie.year && <span>{movie.year}</span>}
          {movie.runtime && movie.runtime > 0 && (
            <>
              <span className="text-white/10">•</span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {formatRuntime(movie.runtime)}
              </span>
            </>
          )}
        </div>
        {showOverview && movie.overview && (
          <p className="text-[11px] text-white/25 line-clamp-2 mt-1 leading-relaxed">
            {movie.overview}
          </p>
        )}
      </div>
    </Link>
  );
}

// Skeleton 
export function MovieCardSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "w-[140px]", md: "w-[175px]", lg: "w-[220px]" };
  const imgHeight = { sm: "h-[210px]", md: "h-[262px]", lg: "h-[330px]" };

  return (
    <div className={`flex-shrink-0 ${sizeClasses[size]}`}>
      <div className={`${imgHeight[size]} skeleton rounded-xl mb-3`} />
      <div className="skeleton h-4 w-3/4 rounded mb-2" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  );
}
