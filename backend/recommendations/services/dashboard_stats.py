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


def build_dashboard_stats(user, engine: RecommendationEngine | None = None) -> dict:
    """
    Build the full dashboard payload for a user.

    Returns a dict matching the structure expected by GET /recommendations/dashboard/.

    ``engine`` is optional; when omitted a new RecommendationEngine is created.
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
    for gid, count in genre_counter.most_common(10):
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
    prefs = UserGenrePreference.objects.filter(user=user).order_by("-weight")[:10]
    preference_scores = [
        {"name": p.genre_name, "weight": round(p.weight, 1), "count": p.interaction_count}
        for p in prefs
    ]

    thirty_days_ago = timezone.now() - timedelta(days=30)
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

    recent = interactions.order_by("-created_at")[:10]
    recent_data = UserMovieInteractionSerializer(recent, many=True).data

    avg_rating = interactions.filter(rating__isnull=False).aggregate(avg=Avg("rating"))["avg"]

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
    }
