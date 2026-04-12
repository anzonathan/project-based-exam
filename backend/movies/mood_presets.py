"""
Curated mood presets for TMDB discover queries.

Keeps view layers thin by centralizing slug → filter configuration.
"""

from typing import Any

MOOD_MAP: dict[str, dict[str, Any]] = {
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


def mood_discover_params(mood: dict[str, Any], page: int) -> dict[str, Any]:
    """Translate a mood preset into TMDB discover keyword arguments."""
    params: dict[str, Any] = {
        "with_genres": mood["genres"],
        "sort_by": mood.get("sort_by", "popularity.desc"),
        "page": page,
    }
    if "vote_count_gte" in mood:
        params["vote_count.gte"] = mood["vote_count_gte"]
    if "vote_average_gte" in mood:
        params["vote_average.gte"] = mood["vote_average_gte"]
    return params


def mood_list_payload() -> list[dict[str, str]]:
    """Public list entries for the moods API (slug, label, description)."""
    return [
        {"slug": slug, "label": m["label"], "description": m["description"]}
        for slug, m in MOOD_MAP.items()
    ]
