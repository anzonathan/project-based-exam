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
from .mood_presets import MOOD_MAP, mood_discover_params, mood_list_payload
from .constants import (
    MIN_LOCAL_MOVIES_FOR_GENRE_LIST,
    COMPARE_MOVIE_SLOT_COUNT,
    DISCOVER_MIN_VOTE_COUNT_WITH_RATING_FILTER,
)

logger = logging.getLogger(__name__)
tmdb = TMDBService()
sync_service = MovieSyncService()


def _tmdb_page_payload(data: dict, page: int) -> dict:
    """Build a standard paginated body from a TMDB list/discover response."""
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)
    return {
        "results": serializer.data,
        "total_pages": data.get("total_pages", 1),
        "page": page,
    }


def _tmdb_recommendation_response(data: dict) -> Response:
    """Serialize TMDB recommendation/similar `results` array."""
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)
    return Response(serializer.data)


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
        return _tmdb_recommendation_response(tmdb.get_movie_recommendations(movie.tmdb_id))

    @action(detail=True, methods=["get"])
    def similar(self, request, pk=None):
        movie = self.get_object()
        return _tmdb_recommendation_response(tmdb.get_similar_movies(movie.tmdb_id))

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
        page = int(request.query_params.get("page", 1))
        sort = request.query_params.get("sort", "popularity.desc")

        # Try local DB first
        local_movies = Movie.objects.filter(genres=genre).order_by("-popularity")
        if local_movies.count() >= MIN_LOCAL_MOVIES_FOR_GENRE_LIST:
            paginator = self.paginate_queryset(local_movies)
            serializer = MovieCompactSerializer(paginator, many=True)
            return self.get_paginated_response(serializer.data)

        # Fallback to TMDB API
        data = tmdb.get_movies_by_genre(genre.tmdb_id, page=page, sort_by=sort)
        body = _tmdb_page_payload(data, page)
        body["total_results"] = data.get("total_results", 0)
        return Response(body)


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

@api_view(["POST"])
@permission_classes([AllowAny])
def search_movies(request):
    query = request.query_params.get("q", "").strip()
    page = int(request.query_params.get("page", 1))

    if not query:
        return Response(
            {"error": "Query parameter 'q' is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = tmdb.search_movies(query, page=page)
    body = _tmdb_page_payload(data, page)
    body["total_results"] = data.get("total_results", 0)
    body["query"] = query
    return Response(body)


@api_view(["POST"])
@permission_classes([AllowAny])
def trending_movies(request):
    window = request.query_params.get("window", "week")
    page = int(request.query_params.get("page", 1))

    data = tmdb.get_trending_movies(time_window=window, page=page)
    return Response(_tmdb_page_payload(data, page))


@api_view(["GET"])
@permission_classes([AllowAny])
def now_playing(request):
    page = int(request.query_params.get("page", 1))
    payload = tmdb.get_now_playing(page=page)
    results = payload.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)
    return Response({"results": serializer.data, "page": page})


@api_view(["GET"])
@permission_classes([AllowAny])
def top_rated(request):
    page = int(request.query_params.get("page", 1))
    payload = tmdb.get_top_rated_movies(page=page)
    results = payload.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)
    return Response({"results": serializer.data, "page": page})


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



@api_view(["GET"])
@permission_classes([AllowAny])
def mood_list(request):
    return Response(mood_list_payload())


@api_view(["GET"])
@permission_classes([AllowAny])
def mood_movies(request, mood_slug):
    mood = MOOD_MAP.get(mood_slug)
    if not mood:
        return Response({"error": "Unknown mood"}, status=404)

    page = int(request.query_params.get("page", 1))
    params = mood_discover_params(mood, page)

    data = tmdb.discover_movies(**params)
    body = _tmdb_page_payload(data, page)
    body["mood"] = {
        "slug": mood_slug,
        "label": mood["label"],
        "description": mood["description"],
    }
    return Response(body)


### advanced discover / filters
@api_view(["GET"])
@permission_classes([AllowAny])
def discover_filtered(request):
    params = {}
    page = int(request.query_params.get("page", 1))
    params["page"] = page

    genre = request.query_params.get("genre")
    if genre:
        params["with_genres"] = genre

    year_from = request.query_params.get("year_from")
    year_to = request.query_params.get("year_to")
    if year_from:
        params["primary_release_date.gte"] = f"{year_from}-01-01"
    if year_to:
        params["primary_release_date.lte"] = f"{year_to}-12-31"

    rating_min = request.query_params.get("rating_min")
    if rating_min:
        params["vote_average.gte"] = float(rating_min)
        params["vote_count.gte"] = DISCOVER_MIN_VOTE_COUNT_WITH_RATING_FILTER

    runtime_min = request.query_params.get("runtime_min")
    runtime_max = request.query_params.get("runtime_max")
    if runtime_min:
        params["with_runtime.gte"] = int(runtime_min)
    if runtime_max:
        params["with_runtime.lte"] = int(runtime_max)

    language = request.query_params.get("language")
    if language:
        params["with_original_language"] = language

    sort = request.query_params.get("sort", "popularity.desc")
    params["sort_by"] = sort

    data = tmdb.discover_movies(**params)
    body = _tmdb_page_payload(data, page)
    body["total_results"] = data.get("total_results", 0)
    return Response(body)


## movie comparison

@api_view(["GET"])
@permission_classes([AllowAny])
def compare_movies(request):
    ids_str = request.query_params.get("ids", "")
    ids = [int(i.strip()) for i in ids_str.split(",") if i.strip().isdigit()]

    if len(ids) < 2:
        return Response({"error": "Provide at least 2 TMDB IDs: ?ids=550,680"}, status=400)

    movies = []
    for tmdb_id in ids[:COMPARE_MOVIE_SLOT_COUNT]:
        data = tmdb.get_movie_details(tmdb_id)
        if data and "id" in data:
            movies.append(data)

    if len(movies) < 2:
        return Response({"error": "Could not fetch both movies"}, status=404)

    return Response({"movies": movies})
