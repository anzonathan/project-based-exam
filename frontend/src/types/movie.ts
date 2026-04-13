export interface Genre {
  id: number;
  tmdb_id: number;
  name: string;
  slug: string;
  movie_count?: number;
}

export interface Person {
  id: number;
  tmdb_id: number;
  name: string;
  profile_url: string | null;
  known_for_department: string;
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  directed_movies?: MovieCompact[];
  acted_movies?: MovieCompact[];
}

export interface MovieCompact {
  id: number;
  tmdb_id: number;
  title: string;
  overview: string;
  release_date: string;
  year: number | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_url: string | null;
  poster_url_small: string | null;
  genres: Genre[];
  runtime: number | null;
  genre_ids?: number[];
}

export interface CastMember {
  person: Person;
  character: string;
  order: number;
}

export interface WatchProvider {
  provider_name: string;
  provider_type: "stream" | "rent" | "buy" | "free";
  logo_url: string | null;
  link: string;
}

export interface MovieDetail extends MovieCompact {
  imdb_id: string | null;
  original_title: string;
  tagline: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  trailer_embed_url: string | null;
  trailer_key: string | null;
  budget: number;
  revenue: number;
  status: string;
  homepage: string | null;
  directors: Person[];
  cast: CastMember[];
  watch_providers: WatchProvider[];
  wikipedia_url: string | null;
  wikipedia_summary: string | null;
}

// TMDB Raw Response Types (from /movies/tmdb/:id/ endpoint)

export interface TMDBCredits {
  cast: TMDBActor[];
  crew: TMDBCrew[];
}

export interface TMDBActor {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrew {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
  department: string;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: "YouTube" | string;
  type: "Trailer" | "Teaser" | string;
}

export interface TMDBWatchProviders {
  link?: string;
  flatrate?: TMDBProvider[];
  rent?: TMDBProvider[];
  buy?: TMDBProvider[];
}

export interface TMDBProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path: string | null;
  backdrop_path: string | null;
  budget: number;
  revenue: number;
  status: string;
  homepage: string | null;
  imdb_id: string | null;
  tagline: string | null;
  genres: Array<{ id: number; name: string }>;
  credits: TMDBCredits;
  videos: { results: TMDBVideo[] };
  recommendations: { results: Array<{ id: number; title: string; poster_path: string | null }> };
  similar: { results: Array<{ id: number; title: string; poster_path: string | null }> };
  "watch/providers"?: {
    results?: {
      [key: string]: TMDBWatchProviders;
    };
  };
}

// API Response Types 

export interface PaginatedResponse<T> {
  results: T[];
  total_pages?: number;
  total_results?: number;
  page: number;
  query?: string;
}

// User Types 

export interface User {
  id: number;
  username: string;
  email: string ;
  avatar_url: string | null;
  favorite_genres: number[];
  country_code: string;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// Recommendation Types

export interface GenrePreference {
  genre_tmdb_id: number;
  genre_name: string;
  weight: number;
  interaction_count: number;
}

export interface WatchlistItem {
  id: number;
  user: number;
  movie_tmdb_id: number;
  movie_title: string;
  poster_path: string | null;
  added_at: string;
  watched: boolean;
  watched_at: string | null;
}

// Mood Types

export interface Mood {
  slug: string;
  label: string;
  description: string;
}

export interface MoodMoviesResponse extends PaginatedResponse<MovieCompact> {
  mood: Mood;
}

// People Search Types

export interface PeopleSearchResult {
  results: Person[];
  total_pages: number;
  total_results: number;
  page: number;
}

// Comparison Types

export interface ComparisonData {
  movies: MovieDetail[];
}

// Dashboard & Interaction Types

export interface UserInteraction {
  id: number;
  user: number;
  movie_tmdb_id: number;
  movie_title: string;
  interaction_type: "view" | "like" | "dislike" | "watchlist" | "watched" | "search";
  genre_ids: number[];
  rating: number | null;
  created_at: string;
}

export interface GenreDistribution {
  name: string;
  tmdb_id: number;
  count: number;
}

export interface PreferenceScore {
  name: string;
  weight: number;
  count: number;
}

export interface ActivityEntry {
  date: string;
  count: number;
}

export interface DashboardSummary {
  total_interactions: number;
  likes: number;
  dislikes: number;
  watched: number;
  searches: number;
  watchlist_total: number;
  watchlist_watched: number;
  average_rating: number | null;
}

export interface DashboardStats {
  summary: DashboardSummary;
  genre_distribution: GenreDistribution[];
  preference_scores: PreferenceScore[];
  activity_timeline: ActivityEntry[];
  recent_activity: UserInteraction[];
}

// Movie Discovery Types

export interface BecauseYouWatchedResponse {
  [movieTitle: string]: MovieCompact[];
}

// Local Storage Types (for user preferences stored locally)

export interface LocalLikedMovie {
  id: number;
  title: string;
  poster_url: string | null;
  type: "like" | "dislike";
  genres: number[];
  timestamp: number;
}

export interface LocalWatchlistItem {
  id: number;
  title: string;
  poster_url: string | null;
  timestamp: number;
}


