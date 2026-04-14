"""API tests for movies and related public endpoints (SYE3209)."""

from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from movies.models import Genre


class MoviesAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_search_requires_query(self):
        """Search without `q` must return 400 (no TMDB call)."""
        url = reverse("search-movies")
        r = self.client.get(url)

        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", r.json())
        self.assertEqual(r.json()["error"], "Query parameter 'q' is required")

    def test_trending_allows_get(self):
        """Trending must accept GET (browser and Next.js default)."""
        with patch("movies.views.tmdb.get_trending_movies") as mock_tmdb:
            mock_tmdb.return_value = {
                "results": [],
                "total_pages": 1,
                "page": 1
            }

            url = reverse("trending-movies")
            r = self.client.get(url)

        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.json().get("results"), [])

    def test_movie_list_empty_db(self):
        """Read-only movie list should return 200 with empty results."""
        url = reverse("movie-list")
        r = self.client.get(url)

        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.json().get("results"), [])

    def test_mood_list_returns_slugs(self):
        """Mood catalogue is static config; must always return JSON list."""
        url = reverse("mood-list")
        r = self.client.get(url)

        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()

        self.assertIsInstance(data, list)
        self.assertTrue(all("slug" in m and "label" in m for m in data))

    def test_upcoming_endpoint(self):
        """Upcoming releases endpoint wraps TMDB upcoming list."""
        fake = {
            "results": [
                {
                    "id": 999001,
                    "title": "Future Film",
                    "overview": "Synopsis",
                    "release_date": "2099-01-01",
                    "vote_average": 8.0,
                    "vote_count": 10,
                    "popularity": 1.0,
                    "poster_path": "/x.jpg",
                    "backdrop_path": "/y.jpg",
                    "genre_ids": [28],
                }
            ],
            "total_pages": 1,
            "total_results": 1,
            "page": 1,
        }

        with patch("movies.views.tmdb.get_upcoming_movies", return_value=fake):
            url = reverse("upcoming-movies")
            r = self.client.get(url)

        self.assertEqual(r.status_code, status.HTTP_200_OK)
        body = r.json()

        self.assertEqual(len(body["results"]), 1)
        self.assertEqual(body["results"][0]["tmdb_id"], 999001)


class GenreSyncLogicTestCase(TestCase):
    """Model / sync-adjacent tests without calling the real TMDB network."""

    @patch("movies.services.tmdb_service.TMDBService.get_genres")
    def test_sync_genres_creates_rows(self, mock_genres):
        mock_genres.return_value = [
            {"id": 99, "name": "Documentary"},
            {"id": 28, "name": "Action"},
        ]

        from movies.services.tmdb_service import MovieSyncService

        MovieSyncService().sync_genres()

        self.assertEqual(Genre.objects.count(), 2)

        doc = Genre.objects.get(tmdb_id=99)
        self.assertEqual(doc.slug, "documentary")