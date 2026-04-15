from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from movies.models import Genre
from recommendations.models import UserGenrePreference, UserMovieInteraction
from recommendations.services.engine import RecommendationEngine


class RecommendationEngineTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="alice", email="alice@example.com", password="password123"
        )
        Genre.objects.create(tmdb_id=28, name="Action", slug="action")
        Genre.objects.create(tmdb_id=35, name="Comedy", slug="comedy")
        self.engine = RecommendationEngine()

    def test_compute_genre_preferences_persists_preference_rows(self):
        UserMovieInteraction.objects.create(
            user=self.user,
            movie_tmdb_id=100,
            movie_title="Action Hit",
            interaction_type="like",
            genre_ids=[28],
        )
        UserMovieInteraction.objects.create(
            user=self.user,
            movie_tmdb_id=101,
            movie_title="Comedy Night",
            interaction_type="watchlist",
            genre_ids=[35],
        )

        ranked = self.engine.compute_genre_preferences(self.user)

        self.assertEqual(len(ranked), 2)
        prefs = UserGenrePreference.objects.filter(user=self.user)
        self.assertEqual(prefs.count(), 2)
        action_pref = prefs.get(genre_tmdb_id=28)
        comedy_pref = prefs.get(genre_tmdb_id=35)
        self.assertGreater(action_pref.weight, comedy_pref.weight)

    @patch("recommendations.services.engine.TMDBService.discover_movies")
    def test_get_recommendations_excludes_watched_movies(self, mock_discover_movies):
        UserMovieInteraction.objects.create(
            user=self.user,
            movie_tmdb_id=200,
            movie_title="Already Watched",
            interaction_type="watched",
            genre_ids=[28],
        )
        UserMovieInteraction.objects.create(
            user=self.user,
            movie_tmdb_id=201,
            movie_title="Liked One",
            interaction_type="like",
            genre_ids=[28],
        )

        mock_discover_movies.return_value = {
            "results": [
                {
                    "id": 200,
                    "title": "Already Watched",
                    "overview": "skip",
                    "release_date": "2024-01-01",
                    "vote_average": 7.0,
                    "vote_count": 100,
                    "popularity": 10.0,
                    "poster_path": None,
                    "backdrop_path": None,
                    "genre_ids": [28],
                },
                {
                    "id": 202,
                    "title": "Fresh Pick",
                    "overview": "keep",
                    "release_date": "2024-01-01",
                    "vote_average": 8.5,
                    "vote_count": 200,
                    "popularity": 20.0,
                    "poster_path": None,
                    "backdrop_path": None,
                    "genre_ids": [28],
                },
            ]
        }

        recommendations = self.engine.get_recommendations(self.user)

        ids = [m["id"] for m in recommendations]
        self.assertIn(202, ids)
        self.assertNotIn(200, ids)
