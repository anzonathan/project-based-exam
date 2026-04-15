from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def api_root(_request):
    return JsonResponse(
        {
            "status": "ok",
            "service": "cinequest-backend",
            "endpoints": {
                "admin": "/admin/",
                "token": "/api/auth/token/",
                "token_refresh": "/api/auth/token/refresh/",
                "users": "/api/users/",
                "movies": "/api/movies/",
                "recommendations": "/api/recommendations/",
            },
        }
    )

urlpatterns = [
    path("", api_root, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/users/", include("users.urls")),
    path("api/movies/", include("movies.urls")),
    path("api/recommendations/", include("recommendations.urls")),
]
