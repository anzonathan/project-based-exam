from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    LogoutSerializer,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """POST /api/users/register/"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile(request):
    """GET/PATCH /api/users/profile/"""
    if request.method == "GET":
        return Response(UserSerializer(request.user).data)

    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """POST /api/users/change-password/"""
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    current_password = serializer.validated_data["current_password"]
    new_password = serializer.validated_data["new_password"]

    if not user.check_password(current_password):
        return Response(
            {"current_password": ["Current password is incorrect."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save(update_fields=["password"])
    return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """POST /api/users/logout/ (best-effort JWT refresh blacklist + client token clear)."""
    serializer = LogoutSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    refresh = serializer.validated_data.get("refresh")
    if refresh:
        try:
            RefreshToken(refresh).blacklist()
        except (AttributeError, TokenError):
            # Token blacklist app may not be enabled; logout still succeeds client-side.
            pass

    return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)
