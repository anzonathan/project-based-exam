from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


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



schema_view = get_schema_view(
    openapi.Info(
        title="CineQuest API",
        default_version='v1',
        description="Movie Recommendation API",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # YOUR APIs
    path('api/users/', include('users.urls')),
    path('api/movies/', include('movies.urls')),
    path('api/recommendations/', include('recommendations.urls')),

    # SWAGGER
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0)),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0)),
]