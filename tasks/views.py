from django.views.generic import TemplateView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Task
from .permissions import IsTaskOwner
from .serializers import (
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
    RegisterSerializer,
    TaskSerializer,
)


class FrontendAppView(TemplateView):
    """Serves the HTML/CSS/JS frontend."""

    template_name = 'index.html'


class RegisterView(generics.CreateAPIView):
    """Registers a new user account."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    """Issues JWT access and refresh tokens."""

    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    """Blacklists the submitted refresh token."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refresh_token = RefreshToken(serializer.validated_data['refresh'])
            refresh_token.blacklist()
        except TokenError as exc:
            raise ValidationError(
                {'refresh': 'Invalid or expired refresh token.'}
            ) from exc

        return Response(
            {'detail': 'Logged out successfully.'},
            status=status.HTTP_200_OK,
        )


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD APIs for tasks that belong to the authenticated user."""

    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsTaskOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']
    queryset = Task.objects.select_related('user')

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
