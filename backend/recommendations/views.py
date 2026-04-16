"""
REST endpoints for personalized recommendations, interactions, and watchlist.

Business logic for the dashboard summary lives in
``recommendations.services.dashboard_stats``; this module wires it to DRF.
"""

from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

User = get_user_model()

from .models import UserMovieInteraction, UserGenrePreference, Watchlist
from .serializers import (
    UserMovieInteractionSerializer,
    UserGenrePreferenceSerializer,
    WatchlistSerializer,
)
from .services.engine import RecommendationEngine
from .services.dashboard_stats import build_dashboard_stats
from movies.serializers import TMDBMovieSerializer

engine = RecommendationEngine()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def personalized_recommendations(request):
    """GET /api/recommendations/for-you/ → personalized picks."""
    page = int(request.query_params.get("page", 1))
    movies = engine.get_recommendations(request.user, page=page)
    serializer = TMDBMovieSerializer(movies, many=True)
    return Response({"results": serializer.data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def because_you_watched(request):
    """GET /api/recommendations/because-you-watched/"""
    data = engine.get_because_you_watched(request.user)
    result = {}
    for title, movies in data.items():
        result[title] = TMDBMovieSerializer(movies, many=True).data
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def genre_preferences(request):
    """GET /api/recommendations/preferences/"""
    # Recomputing preferences
    engine.compute_genre_preferences(request.user)
    prefs = UserGenrePreference.objects.filter(user=request.user)
    serializer = UserGenrePreferenceSerializer(prefs, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def track_interaction(request):
    """
    POST /api/recommendations/track/
    Body: { movie_tmdb_id, movie_title, interaction_type, genre_ids?, rating? }
    """
    serializer = UserMovieInteractionSerializer(data=request.data)
    if serializer.is_valid():
        interaction = serializer.save(user=request.user)
        
        # If marked as watched, sync with watchlist
        if interaction.interaction_type == UserMovieInteraction.InteractionType.WATCHED:
            Watchlist.objects.filter(
                user=request.user, 
                movie_tmdb_id=interaction.movie_tmdb_id,
                watched=False
            ).update(watched=True, watched_at=timezone.now())
            
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WatchlistViewSet(viewsets.ModelViewSet):
    """User's watchlist CRUD."""
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def mark_watched(self, request, pk=None):
        """POST /api/recommendations/watchlist/{id}/mark_watched/"""
        item = self.get_object()
        item.watched = True
        item.watched_at = timezone.now()
        item.save()
        return Response(WatchlistSerializer(item).data)


### dashboard stats

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    GET /api/recommendations/dashboard/
    Returns aggregated stats for the user's dashboard.
    """
    return Response(build_dashboard_stats(request.user, engine))


@api_view(["GET"])
@permission_classes([AllowAny])
def public_wrapped(request, token):
    """
    GET /api/recommendations/wrapped/{token}/
    Returns Wrapped stats for a user via their share_token.
    """
    user = get_object_or_404(User, share_token=token)
    stats = build_dashboard_stats(user, engine)
    wrapped = stats.get("wrapped")
    if not wrapped:
        return Response({"detail": "No wrapped data available for this user."}, status=404)
    return Response(wrapped)
