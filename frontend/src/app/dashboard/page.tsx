"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3, Heart, ThumbsDown, Eye, Bookmark, Star,
  TrendingUp, Clock, LogIn, Sparkles, Film, CheckCircle
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { recommendationsAPI } from "@/lib/api";
import MovieCarousel from "@/components/MovieCarousel";
import WrappedSlideshow from "@/components/WrappedSlideshow";
import type { 
  DashboardStats, DashboardSummary, GenreDistribution, 
  PreferenceScore, ActivityEntry, UserInteraction, MovieCompact,
  WatchlistItem
} from "@/types/movie";

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWrapped, setShowWrapped] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchDashboard();
  }, [isAuthenticated]);

  async function fetchDashboard() {
    try {
      const data = await recommendationsAPI.getDashboard();
      setStats(data);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Not logged in
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="pt-24 pb-20 px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8 text-gold/30" />
          </div>
          <h1 className="text-3xl font-bold font-display mb-3">Your Dashboard</h1>
          <p className="text-white/30 mb-6">
            Sign in to track your movie preferences, view genre analytics, and get personalized insights.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-surface-0 font-semibold text-sm"
          >
            <LogIn className="w-4 h-4" />
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-24 pb-20 px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto">
        <div className="space-y-6">
          <div className="skeleton h-12 w-64 rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const summary: DashboardSummary = stats?.summary || {
    total_interactions: 0,
    likes: 0,
    dislikes: 0,
    watched: 0,
    searches: 0,
    watchlist_total: 0,
    watchlist_watched: 0,
    average_rating: null,
  };
  const genreDist: GenreDistribution[] = stats?.genre_distribution || [];
  const prefScores: PreferenceScore[] = stats?.preference_scores || [];
  const timeline: ActivityEntry[] = stats?.activity_timeline || [];
  const recent: UserInteraction[] = stats?.recent_activity || [];
  const maxGenreCount = Math.max(...genreDist.map((g) => g.count), 1);
  const maxPrefWeight = Math.max(...prefScores.map((p) => p.weight), 1);

  // Ensure genre names are strings (sometimes backend returns ids)
  const normalizedGenreDist = genreDist.map(g => ({ ...g, name: typeof g.name === 'number' ? String(g.name) : g.name }));

  const statCards = [
    { label: "Liked", value: summary.likes || 0, icon: Heart, color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-600/5" },
    { label: "Disliked", value: summary.dislikes || 0, icon: ThumbsDown, color: "text-red-400", bg: "from-red-500/10 to-red-600/5" },
    { label: "Watched", value: summary.watched || 0, icon: Eye, color: "text-blue-400", bg: "from-blue-500/10 to-blue-600/5" },
    { label: "Watchlist", value: summary.watchlist_total || 0, icon: Bookmark, color: "text-gold", bg: "from-gold/10 to-amber-600/5" },
  ];

  // Map interactions to MovieCompact for carousels
  const mapToMovieCompact = (items: UserInteraction[]): MovieCompact[] => {
    return items.map(item => ({
      id: item.id,
      tmdb_id: item.movie_tmdb_id,
      title: item.movie_title,
      poster_url: item.poster_url,
      poster_url_small: item.poster_url,
      vote_average: 0,
      vote_count: 0,
      popularity: 0,
      overview: "",
      release_date: "",
      year: null,
      genres: [],
      runtime: null,
      genre_ids: item.genre_ids
    }));
  };

  const mapWatchlistToMovieCompact = (items: WatchlistItem[]): MovieCompact[] => {
    return items.map(item => ({
      id: item.id,
      tmdb_id: item.movie_tmdb_id,
      title: item.movie_title,
      poster_url: (item as any).poster_url || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null),
      poster_url_small: (item as any).poster_url || (item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : null),
      vote_average: 0,
      vote_count: 0,
      popularity: 0,
      overview: "",
      release_date: "",
      year: null,
      genres: [],
      runtime: null
    }));
  };

  const likedMovies = mapToMovieCompact(stats?.liked_movies || []);
  const watchedMovies = mapToMovieCompact(stats?.watched_movies || []);
  const dislikedMovies = mapToMovieCompact(stats?.disliked_movies || []);
  const watchlistMovies = mapWatchlistToMovieCompact(stats?.watchlist_items || []);

  return (
    <div className="pt-24 pb-20 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="px-6 md:px-10 lg:px-20 flex items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shadow-lg shadow-gold/10">
            <BarChart3 className="w-5 h-5 text-surface-0" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">
              Your <span className="text-gold italic">Dashboard</span>
            </h1>
            <p className="text-sm text-white/30">
              Welcome back, {user?.username}. Here&apos;s your movie journey.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWrapped(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-surface-0 font-semibold text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Your Wrapped
          </button>
        </div>
      </div>

      {/* Wrapped slideshow component */}
      <WrappedSlideshow isOpen={showWrapped} onClose={() => setShowWrapped(false)} wrapped={stats?.wrapped} />

      {/* Statistics cards */}
      <div className="px-6 md:px-10 lg:px-20 grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card rounded-xl p-5 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${bg}`} />
            <div className="relative z-10">
              <Icon className={`w-5 h-5 ${color} mb-3`} />
              <p className="text-3xl font-bold font-display">{value}</p>
              <p className="text-[11px] text-white/30 uppercase tracking-wider mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Watchlist Detailed Stats */}
      {summary.watchlist_total > 0 && (
        <div className="px-6 md:px-10 lg:px-20 mb-10">
          <div className="glass-card rounded-xl p-4 flex items-center justify-between border-l-4 border-gold">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-gold" />
              <div>
                <p className="text-sm font-semibold">Watchlist Progress</p>
                <p className="text-xs text-white/30">You&apos;ve watched {summary.watchlist_watched} out of {summary.watchlist_total} saved movies.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gold transition-all duration-1000" 
                  style={{ width: `${(summary.watchlist_watched / summary.watchlist_total) * 100}%` }}
                />
              </div>
              <span className="text-sm font-mono text-gold font-bold">
                {Math.round((summary.watchlist_watched / summary.watchlist_total) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Movie Carousels */}
      <div className="space-y-12 mb-16">
        {watchlistMovies.length > 0 && (
          <MovieCarousel 
            title="Your Watchlist" 
            subtitle="Movies you've saved to watch later"
            icon={<Bookmark className="w-4 h-4 text-gold" />}
            movies={watchlistMovies}
          />
        )}

        {likedMovies.length > 0 && (
          <MovieCarousel 
            title="Liked Movies" 
            subtitle="Your all-time favorites"
            icon={<Heart className="w-4 h-4 text-emerald-400" />}
            movies={likedMovies}
          />
        )}

        {watchedMovies.length > 0 && (
          <MovieCarousel 
            title="Recently Watched" 
            subtitle="Movies you've already seen"
            icon={<Eye className="w-4 h-4 text-blue-400" />}
            movies={watchedMovies}
          />
        )}

        {dislikedMovies.length > 0 && (
          <MovieCarousel 
            title="Disliked Movies" 
            subtitle="Movies you didn't enjoy"
            icon={<ThumbsDown className="w-4 h-4 text-red-400" />}
            movies={dislikedMovies}
          />
        )}
      </div>

      <div className="px-6 md:px-10 lg:px-20 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Genre distribution */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Film className="w-4 h-4 text-gold" />
            <h2 className="text-lg font-bold font-display">Genre Distribution</h2>
          </div>
          {genreDist.length > 0 ? (
            <div className="space-y-3">
              {genreDist.slice(0, 8).map((genre: any) => (
                <div key={genre.name} className="flex items-center gap-3">
                  <span className="text-[12px] text-white/50 w-24 text-right flex-shrink-0 truncate">
                    {genre.name}
                  </span>
                  <div className="flex-1 h-6 bg-surface-3 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-gold/60 to-gold/30 transition-all duration-700"
                      style={{ width: `${(genre.count / maxGenreCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-white/30 w-8 font-mono">{genre.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/20 text-center py-8">
              Like some movies to see your genre breakdown
            </p>
          )}
        </div>

        {/* Preference scores */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-gold" />
            <h2 className="text-lg font-bold font-display">Preference Scores</h2>
          </div>
          {prefScores.length > 0 ? (
            <div className="space-y-3">
              {prefScores.slice(0, 8).map((pref: any) => (
                <div key={pref.name} className="flex items-center gap-3">
                  <span className="text-[12px] text-white/50 w-24 text-right flex-shrink-0 truncate">
                    {pref.name}
                  </span>
                  <div className="flex-1 h-6 bg-surface-3 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-emerald-500/60 to-emerald-500/30 transition-all duration-700"
                      style={{ width: `${(pref.weight / maxPrefWeight) * 100}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-white/30 w-10 font-mono">{pref.weight}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/20 text-center py-8">
              Interact with movies to build your preference profile
            </p>
          )}
        </div>
      </div>

      {/* Activity timeline */}
      {timeline.length > 0 && (
        <div className="px-6 md:px-10 lg:px-20 mb-10">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4 text-gold" />
              <h2 className="text-lg font-bold font-display">Activity (Last 30 Days)</h2>
            </div>
            <div className="flex items-end gap-1 h-32">
              {timeline.map((day: any) => {
                const maxCount = Math.max(...timeline.map((d: any) => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex-1 group relative"
                    title={`${day.date}: ${day.count} interactions`}
                  >
                    <div
                      className="w-full bg-gradient-to-t from-gold/50 to-gold/20 rounded-t transition-all hover:from-gold/70 hover:to-gold/40"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-white/15 mt-2">
              <span>{timeline[0]?.date}</span>
              <span>{timeline[timeline.length - 1]?.date}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <div className="px-6 md:px-10 lg:px-20">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-gold" />
              <h2 className="text-lg font-bold font-display">Recent Activity</h2>
            </div>
            <div className="space-y-2">
              {recent.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      item.interaction_type === "like" ? "bg-emerald-500/15 text-emerald-400" :
                      item.interaction_type === "dislike" ? "bg-red-500/15 text-red-400" :
                      item.interaction_type === "watched" ? "bg-blue-500/15 text-blue-400" :
                      "bg-white/5 text-white/40"
                    }`}>
                      {item.interaction_type}
                    </span>
                    <span className="text-sm text-white/70">{item.movie_title}</span>
                  </div>
                  <span className="text-[11px] text-white/20">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {summary.total_interactions === 0 && (
        <div className="px-6 md:px-10 lg:px-20 mt-10">
          <div className="text-center py-16 glass-card rounded-2xl">
            <BarChart3 className="w-10 h-10 text-gold/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold font-display mb-2">No activity yet</h3>
            <p className="text-sm text-white/30 mb-6 max-w-sm mx-auto">
              Start exploring movies, liking your favorites, and building your watchlist to see your stats here.
            </p>
            <Link
              href="/mood"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-surface-0 font-semibold text-sm"
            >
              <Sparkles className="w-4 h-4" /> Pick a Mood
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
