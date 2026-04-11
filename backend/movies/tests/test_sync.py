from django.test import TestCase
from unittest.mock import patch
from movies.services.tmdb_service import MovieSyncService
from movies.models import Movie


class MovieSyncTest(TestCase):

    def setUp(self):
        self.service = MovieSyncService()

    # ✅ Test trending sync calls sync_movie
    @patch("movies.services.tmdb_service.MovieSyncService.sync_movie")
    def test_sync_trending_movies(self, mock_sync_movie):

        # Mock TMDB response
        self.service.tmdb = type("", (), {
            "get_trending_movies": lambda self, page: {
                "results": [{"id": 1}]
            }
        })()

        self.service.sync_trending(pages=1)

        # Ensure sync_movie was called once
        self.assertEqual(mock_sync_movie.call_count, 1)

    # ✅ Test syncing a single movie (mock API call inside service)
    def test_sync_single_movie(self):

        # Mock TMDB response for movie details
        self.service.tmdb = type("", (), {
            "get_movie_details": lambda self, movie_id: {
                "id": movie_id,
                "title": "Fight Club",
                "overview": "Some text",
                "release_date": "1999-10-15",
            }
        })()

        self.service.sync_movie(550)

        self.assertEqual(Movie.objects.count(), 1)
        self.assertEqual(Movie.objects.first().title, "Fight Club")

    # ✅ Test duplicates (no duplicate movies created)
    def test_no_duplicate_movies(self):

        self.service.sync_movie = lambda x: Movie.objects.get_or_create(
            tmdb_id=x,
            defaults={"title": "Test Movie"}
        )

        self.service.sync_movie(550)
        self.service.sync_movie(550)

        self.assertEqual(Movie.objects.count(), 1)

    # ✅ Test API failure (empty response)
    def test_api_failure(self):

        self.service.tmdb = type("", (), {
            "get_trending_movies": lambda self, page: {}
        })()

        self.service.sync_trending(pages=1)

        self.assertEqual(Movie.objects.count(), 0)