"""
Aggregates user interaction and watchlist data for the dashboard API.

Isolated from the view layer to keep HTTP handling separate from reporting logic.
"""

from collections import Counter
from datetime import timedelta

from django.db.models import Avg, Count
from django.db.models.functions import TruncDate
from django.utils import timezone

from movies.models import Genre
from recommendations.models import UserMovieInteraction, UserGenrePreference, Watchlist
from recommendations.serializers import UserMovieInteractionSerializer
from recommendations.services.engine import RecommendationEngine
from recommendations.constants import (
    DASHBOARD_ACTIVITY_LOOKBACK_DAYS,
    DASHBOARD_GENRE_DISTRIBUTION_LIMIT,
    DASHBOARD_PREFERENCE_ROW_LIMIT,
    DASHBOARD_RECENT_INTERACTIONS_LIMIT,
)


def build_dashboard_stats(user, engine: RecommendationEngine | None = None) -> dict:
    """
    Build the full dashboard payload for a user.

    Args:
        user: Django auth user owning interactions and watchlist rows.
        engine: Shared ``RecommendationEngine`` instance; a new one is used if omitted.

    Returns:
        Dict with keys ``summary``, ``genre_distribution``, ``preference_scores``,
        ``activity_timeline``, and ``recent_activity`` as returned by
        ``GET /api/recommendations/dashboard/``.
    """
    eng = engine or RecommendationEngine()
    interactions = UserMovieInteraction.objects.filter(user=user)
    total_interactions = interactions.count()
    likes = interactions.filter(interaction_type="like").count()
    dislikes = interactions.filter(interaction_type="dislike").count()
    watched = interactions.filter(interaction_type="watched").count()
    searches = interactions.filter(interaction_type="search").count()

    watchlist = Watchlist.objects.filter(user=user)
    watchlist_total = watchlist.count()
    watchlist_watched = watchlist.filter(watched=True).count()

    genre_counter = Counter()
    for interaction in interactions.filter(
        interaction_type__in=["like", "watched", "watchlist"]
    ):
        for gid in interaction.genre_ids:
            genre_counter[gid] += 1

    genre_distribution = []
    for gid, count in genre_counter.most_common(DASHBOARD_GENRE_DISTRIBUTION_LIMIT):
        try:
            genre = Genre.objects.get(tmdb_id=gid)
            genre_distribution.append(
                {"name": genre.name, "tmdb_id": gid, "count": count}
            )
        except Genre.DoesNotExist:
            genre_distribution.append(
                {"name": f"Genre {gid}", "tmdb_id": gid, "count": count}
            )

    eng.compute_genre_preferences(user)
    prefs = UserGenrePreference.objects.filter(user=user).order_by("-weight")[
        :DASHBOARD_PREFERENCE_ROW_LIMIT
    ]
    preference_scores = [
        {"name": p.genre_name, "weight": round(p.weight, 1), "count": p.interaction_count}
        for p in prefs
    ]

    thirty_days_ago = timezone.now() - timedelta(days=DASHBOARD_ACTIVITY_LOOKBACK_DAYS)
    daily_activity = (
        interactions.filter(created_at__gte=thirty_days_ago)
        .annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )
    activity_timeline = [
        {"date": str(d["date"]), "count": d["count"]} for d in daily_activity
    ]

    recent = interactions.order_by("-created_at")[:DASHBOARD_RECENT_INTERACTIONS_LIMIT]
    recent_data = UserMovieInteractionSerializer(recent, many=True).data

    # Detailed lists for mapping to dashboard
    liked_movies = interactions.filter(interaction_type="like").order_by("-created_at")[:10]
    disliked_movies = interactions.filter(interaction_type="dislike").order_by("-created_at")[:10]
    watched_movies = interactions.filter(interaction_type="watched").order_by("-created_at")[:10]
    
    # Watchlist items
    from recommendations.serializers import WatchlistSerializer
    watchlist_items = WatchlistSerializer(watchlist.order_by("-added_at")[:10], many=True).data

    avg_rating = interactions.filter(rating__isnull=False).aggregate(avg=Avg("rating"))["avg"]

    # Wrapped summary (yearly)
    now = timezone.now()
    one_year_ago = now - timedelta(days=365)
    interactions_year = interactions.filter(created_at__gte=one_year_ago)
    total_interactions_year = interactions_year.count()

    year_genre_counter = Counter()
    for interaction in interactions_year.filter(interaction_type__in=["like", "watched", "watchlist"]):
        for gid in interaction.genre_ids:
            year_genre_counter[gid] += 1

    top_genres = []
    for gid, count in year_genre_counter.most_common(5):
        try:
            genre = Genre.objects.get(tmdb_id=gid)
            top_genres.append({"name": genre.name, "tmdb_id": gid, "count": count})
        except Genre.DoesNotExist:
            top_genres.append({"name": f"Genre {gid}", "tmdb_id": gid, "count": count})

    movie_counter = Counter()
    for interaction in interactions_year:
        key = (getattr(interaction, "movie_tmdb_id", None), getattr(interaction, "movie_title", None), getattr(interaction, "poster_path", None))
        movie_counter[key] += 1

    top_movies = []
    for (tmdb_id, title, poster), count in movie_counter.most_common(5):
        top_movies.append({"tmdb_id": tmdb_id, "movie_title": title, "poster_url": (f"https://image.tmdb.org/t/p/w185{poster}" if poster else None), "count": count})

    wrapped = {
        "year": now.year,
        "total_interactions_year": total_interactions_year,
        "top_genres": top_genres,
        "top_movies": top_movies,
    }

    return {
        "summary": {
            "total_interactions": total_interactions,
            "likes": likes,
            "dislikes": dislikes,
            "watched": watched,
            "searches": searches,
            "watchlist_total": watchlist_total,
            "watchlist_watched": watchlist_watched,
            "average_rating": round(avg_rating, 1) if avg_rating else None,
        },
        "genre_distribution": genre_distribution,
        "preference_scores": preference_scores,
        "activity_timeline": activity_timeline,
        "recent_activity": recent_data,
        "liked_movies": UserMovieInteractionSerializer(liked_movies, many=True).data,
        "disliked_movies": UserMovieInteractionSerializer(disliked_movies, many=True).data,
        "watched_movies": UserMovieInteractionSerializer(watched_movies, many=True).data,
        "watchlist_items": watchlist_items,
        "wrapped": wrapped,
    }
