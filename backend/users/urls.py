from django.urls import path
from django.http import JsonResponse
from . import views

def users_root(request):
    return JsonResponse({
        "register": "/api/users/register/",
        "profile": "/api/users/profile/"
    })

urlpatterns = [
    path('', users_root),
    path("register/", views.register, name="register"),
    path("profile/", views.profile, name="profile"),
]
