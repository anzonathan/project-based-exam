import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Movie, Genre, Person
from .serializers import (
    MovieCompactSerializer, MovieDetailSerializer,
    GenreSerializer, PersonCompactSerializer, PersonDetailSerializer,
    TMDBMovieSerializer,
)
from .services.tmdb_service import TMDBService, MovieSyncService, WikipediaService

logger = logging.getLogger(__name__)
tmdb = TMDBService()
sync_service = MovieSyncService()

# Helper functions for parsing query parameters with validation and error handling


def _positive_int_param(qs, key="page", default=1):
    """Parse a positive integer from query params; return (value, error_response)."""
    try:
        raw = qs.get(key, default)
        if raw is None or (isinstance(raw, str) and not str(raw).strip()):
            raw = default
        v = int(raw)
        if v < 1:
            raise ValueError
        return v, None
    except (TypeError, ValueError):
        err = Response(
            {"detail": f"Invalid '{key}': expected a positive integer."},
            status=status.HTTP_400_BAD_REQUEST,
        )
        return None, err


def _optional_float_param(qs, key):
    if qs.get(key) in (None, ""):
        return None, None
    try:
        return float(qs.get(key)), None
    except (TypeError, ValueError):
        return None, Response(
            {"detail": f"Invalid '{key}': expected a number."},
            status=status.HTTP_400_BAD_REQUEST,
        )


def _optional_nonnegative_int_param(qs, key):
    if qs.get(key) in (None, ""):
        return None, None
    try:
        v = int(qs.get(key))
        if v < 0:
            raise ValueError
        return v, None
    except (TypeError, ValueError):
        return None, Response(
            {"detail": f"Invalid '{key}': expected a non-negative integer."},
            status=status.HTTP_400_BAD_REQUEST,
        )


def _optional_year_param(qs, key):
    if qs.get(key) in (None, ""):
        return None, None
    try:
        y = int(qs.get(key))
        if y < 1870 or y > 2100:
            raise ValueError
        return y, None
    except (TypeError, ValueError):
        return None, Response(
            {"detail": f"Invalid '{key}': expected a year between 1870 and 2100."},
            status=status.HTTP_400_BAD_REQUEST,
        )


## Movie ViewSet
class MovieViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Movie.objects.prefetch_related("genres", "directors").all()
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["genres__slug"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return MovieDetailSerializer
        return MovieCompactSerializer

    @action(detail=True, methods=["get"])
    def recommendations(self, request, pk=None):
        movie = self.get_object()
        data = tmdb.get_movie_recommendations(movie.tmdb_id)
        results = data.get("results", [])
        serializer = TMDBMovieSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def similar(self, request, pk=None):
        movie = self.get_object()
        data = tmdb.get_similar_movies(movie.tmdb_id)
        results = data.get("results", [])
        serializer = TMDBMovieSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def wikipedia(self, request, pk=None):
        movie = self.get_object()
        year = movie.release_date.year if movie.release_date else None
        wiki_data = WikipediaService.get_movie_summary(movie.title, year)

        if wiki_data.get("summary"):
            movie.wikipedia_summary = wiki_data["summary"]
            movie.wikipedia_url = wiki_data["url"]
            movie.save(update_fields=["wikipedia_summary", "wikipedia_url"])

        return Response(wiki_data)


## Genre ViewSet
class GenreViewSet(viewsets.ReadOnlyModelViewSet):
    """Genres API."""
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    @action(detail=True, methods=["get"])
    def movies(self, request, slug=None):
        """GET /api/movies/genres/{slug}/movies/ → movies in this genre."""
        genre = self.get_object()
        page, perr = _positive_int_param(request.query_params, "page", 1)
        if perr:
            return perr
        sort = request.query_params.get("sort", "popularity.desc")

        # Try local DB first
        local_movies = Movie.objects.filter(genres=genre).order_by("-popularity")
        if local_movies.count() >= 20:
            paginator = self.paginate_queryset(local_movies)
            serializer = MovieCompactSerializer(paginator, many=True)
            return self.get_paginated_response(serializer.data)

        # Fallback to TMDB API
        data = tmdb.get_movies_by_genre(genre.tmdb_id, page=page, sort_by=sort)
        results = data.get("results", [])
        serializer = TMDBMovieSerializer(results, many=True)
        return Response({
            "results": serializer.data,
            "total_pages": data.get("total_pages", 1),
            "total_results": data.get("total_results", 0),
            "page": page,
        })


## Person ViewSet

class PersonViewSet(viewsets.ReadOnlyModelViewSet):
    """People (directors, actors) API."""
    queryset = Person.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PersonDetailSerializer
        return PersonCompactSerializer

    @action(detail=True, methods=["get"])
    def enrich(self, request, pk=None):
        person = self.get_object()
        data = tmdb.get_person_details(person.tmdb_id)

        if data:
            person.biography = data.get("biography", "")
            person.birthday = data.get("birthday") or None
            person.place_of_birth = data.get("place_of_birth", "")
            person.save()

        serializer = PersonDetailSerializer(person)
        return Response(serializer.data)


## standalone endpoints

@api_view(["GET"])
@permission_classes([AllowAny])
def search_movies(request):
    query = request.query_params.get("q", "").strip()
    page, perr = _positive_int_param(request.query_params, "page", 1)
    if perr:
        return perr

    if not query:
        return Response(
            {"detail": "Query parameter 'q' is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = tmdb.search_movies(query, page=page)
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)

    return Response({
        "results": serializer.data,
        "total_pages": data.get("total_pages", 1),
        "total_results": data.get("total_results", 0),
        "page": page,
        "query": query,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def trending_movies(request):
    window = request.query_params.get("window", "week")
    if window not in ("day", "week"):
        return Response(
            {"detail": "Invalid 'window': use 'day' or 'week'."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    page, perr = _positive_int_param(request.query_params, "page", 1)
    if perr:
        return perr

    data = tmdb.get_trending_movies(time_window=window, page=page)
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)

    return Response({
        "results": serializer.data,
        "total_pages": data.get("total_pages", 1),
        "page": page,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def now_playing(request):
    p, perr = _positive_int_param(request.query_params, "page", 1)
    if perr:
        return perr
    d = tmdb.get_now_playing(page=p)
    r = d.get("results", [])
    s = TMDBMovieSerializer(r, many=True)
    x = {"results": s.data, "page": p}
    return Response(x)


@api_view(["GET"])
@permission_classes([AllowAny])
def top_rated(request):
    p, perr = _positive_int_param(request.query_params, "page", 1)
    if perr:
        return perr
    d = tmdb.get_top_rated_movies(page=p)
    r = d.get("results", [])
    s = TMDBMovieSerializer(r, many=True)
    x = {"results": s.data, "page": p}
    return Response(x)


@api_view(["GET"])
@permission_classes([AllowAny])
def movie_detail_tmdb(request, tmdb_id):

    sync = request.query_params.get("sync", "false").lower() == "true"

    if sync:
        movie = sync_service.sync_movie(tmdb_id)
        if movie:
            serializer = MovieDetailSerializer(movie)
            return Response(serializer.data)

    data = tmdb.get_movie_details(tmdb_id)
    if not data:
        return Response({"error": "Movie not found"}, status=404)

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def search_people(request):
    query = request.query_params.get("q", "").strip()
    if not query:
        return Response({"error": "Query parameter 'q' is required"}, status=400)

    data = tmdb.search_people(query)
    return Response(data)


MOOD_MAP = {
    "cozy-night": {
        "label": "Cozy Night In",
        "description": "Warm, comforting films perfect for a relaxed evening",
        "genres": "35,10749,16",  # Comedy, Romance, Animation
        "sort_by": "vote_average.desc",
        "vote_count_gte": 200,
        "vote_average_gte": 7.0,
    },
    "adrenaline": {
        "label": "Adrenaline Rush",
        "description": "Heart-pumping action and intense thrills",
        "genres": "28,53,80",  # Action, Thriller, Crime
        "sort_by": "popularity.desc",
        "vote_count_gte": 300,
    },
    "date-night": {
        "label": "Date Night",
        "description": "Romantic and charming films to share with someone special",
        "genres": "10749,35,18",  # Romance, Comedy, Drama
        "sort_by": "vote_average.desc",
        "vote_count_gte": 150,
        "vote_average_gte": 6.5,
    },
    "mind-bender": {
        "label": "Mind Bender",
        "description": "Thought-provoking stories that twist your perception",
        "genres": "878,9648,53",  # Sci-Fi, Mystery, Thriller
        "sort_by": "vote_average.desc",
        "vote_count_gte": 200,
        "vote_average_gte": 7.0,
    },
    "feel-good": {
        "label": "Feel Good",
        "description": "Uplifting stories that leave you smiling",
        "genres": "35,10751,16",  # Comedy, Family, Animation
        "sort_by": "vote_average.desc",
        "vote_count_gte": 150,
        "vote_average_gte": 7.0,
    },
    "edge-of-seat": {
        "label": "Edge of Your Seat",
        "description": "Suspenseful films that keep you guessing",
        "genres": "53,9648,27",  # Thriller, Mystery, Horror
        "sort_by": "popularity.desc",
        "vote_count_gte": 200,
    },
    "epic-adventure": {
        "label": "Epic Adventure",
        "description": "Grand journeys and sweeping tales of heroism",
        "genres": "12,14,878",  # Adventure, Fantasy, Sci-Fi
        "sort_by": "popularity.desc",
        "vote_count_gte": 300,
    },
    "cry-it-out": {
        "label": "Cry It Out",
        "description": "Emotional dramas that hit you right in the feels",
        "genres": "18,10749,10402",  # Drama, Romance, Music
        "sort_by": "vote_average.desc",
        "vote_count_gte": 200,
        "vote_average_gte": 7.5,
    },
    "family-fun": {
        "label": "Family Fun",
        "description": "Movies the whole family can enjoy together",
        "genres": "16,10751,12",  # Animation, Family, Adventure
        "sort_by": "popularity.desc",
        "vote_count_gte": 200,
    },
    "documentary-deep-dive": {
        "label": "Documentary Deep Dive",
        "description": "Real stories that expand your worldview",
        "genres": "99",  # Documentary
        "sort_by": "vote_average.desc",
        "vote_count_gte": 100,
        "vote_average_gte": 7.0,
    },
}


@api_view(["GET"])
@permission_classes([AllowAny])
def mood_list(request):
    moods = [
        {"slug": slug, "label": m["label"], "description": m["description"]}
        for slug, m in MOOD_MAP.items()
    ]
    return Response(moods)


@api_view(["GET"])
@permission_classes([AllowAny])
def mood_movies(request, mood_slug):
    mood = MOOD_MAP.get(mood_slug)
    if not mood:
        return Response({"error": "Unknown mood"}, status=404)

    page, perr = _positive_int_param(request.query_params, "page", 1)
    if perr:
        return perr
    params = {
        "with_genres": mood["genres"],
        "sort_by": mood.get("sort_by", "popularity.desc"),
        "page": page,
    }
    if "vote_count_gte" in mood:
        params["vote_count.gte"] = mood["vote_count_gte"]
    if "vote_average_gte" in mood:
        params["vote_average.gte"] = mood["vote_average_gte"]

    data = tmdb.discover_movies(**params)
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)

    return Response({
        "mood": {"slug": mood_slug, "label": mood["label"], "description": mood["description"]},
        "results": serializer.data,
        "total_pages": data.get("total_pages", 1),
        "page": page,
    })


### advanced discover / filters
@api_view(["GET"])
@permission_classes([AllowAny])
def discover_filtered(request):
    params = {}
    qp = request.query_params
    page, perr = _positive_int_param(qp, "page", 1)
    if perr:
        return perr
    params["page"] = page

    genre = qp.get("genre")
    if genre:
        params["with_genres"] = genre

    yf, yerr = _optional_year_param(qp, "year_from")
    if yerr:
        return yerr
    yt, yerr = _optional_year_param(qp, "year_to")
    if yerr:
        return yerr
    if yf is not None:
        params["primary_release_date.gte"] = f"{yf}-01-01"
    if yt is not None:
        params["primary_release_date.lte"] = f"{yt}-12-31"

    rating_min, rerr = _optional_float_param(qp, "rating_min")
    if rerr:
        return rerr
    if rating_min is not None:
        params["vote_average.gte"] = rating_min
        params["vote_count.gte"] = 50

    runtime_min, rterr = _optional_nonnegative_int_param(qp, "runtime_min")
    if rterr:
        return rterr
    runtime_max, rterr = _optional_nonnegative_int_param(qp, "runtime_max")
    if rterr:
        return rterr
    if runtime_min is not None:
        params["with_runtime.gte"] = runtime_min
    if runtime_max is not None:
        params["with_runtime.lte"] = runtime_max

    language = qp.get("language")
    if language:
        params["with_original_language"] = language

    sort = qp.get("sort", "popularity.desc")
    params["sort_by"] = sort

    data = tmdb.discover_movies(**params)
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)

    return Response({
        "results": serializer.data,
        "total_pages": data.get("total_pages", 1),
        "total_results": data.get("total_results", 0),
        "page": page,
    })


## movie comparison

@api_view(["GET"])
@permission_classes([AllowAny])
def compare_movies(request):
    ids_str = request.query_params.get("ids", "")
    ids = [int(i.strip()) for i in ids_str.split(",") if i.strip().isdigit()]

    if len(ids) < 2:
        return Response({"error": "Provide at least 2 TMDB IDs: ?ids=550,680"}, status=400)

    movies = []
    for tmdb_id in ids[:2]:
        data = tmdb.get_movie_details(tmdb_id)
        if data and "id" in data:
            movies.append(data)

    if len(movies) < 2:
        return Response({"error": "Could not fetch both movies"}, status=404)

    return Response({"movies": movies})


@api_view(["GET"])
@permission_classes([AllowAny])
def compare_two_movies(request):
    id_string = request.query_params.get("ids", "")
    movie_ids = [int(i.strip()) for i in id_string.split(",") if i.strip().isdigit()]

    if len(movie_ids) < 2:
        return Response({"error": "Provide at least 2 TMDB IDs: ?ids=550,680"}, status=400)

    movie_list = []
    for tid in movie_ids[:2]:
        result = tmdb.get_movie_details(tid)
        if result and "id" in result:
            movie_list.append(result)

    if len(movie_list) < 2:
        return Response({"error": "Could not fetch both movies"}, status=404)

    return Response({"movies": movie_list})
