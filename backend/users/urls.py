from django.urls import path
from django.http import JsonResponse
from . import views

def users_root(request):
    return JsonResponse({
        "register": "/api/users/register/",
        "profile": "/api/users/profile/",
        "change_password": "/api/users/change-password/",
        "logout": "/api/users/logout/",
    })

urlpatterns = [
    path('', users_root),
    path("register/", views.register, name="register"),
    path("profile/", views.profile, name="profile"),
    path("change-password/", views.change_password, name="change-password"),
    path("logout/", views.logout, name="logout"),
]
