from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Task

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Small user payload for auth responses."""

    class Meta:
        model = User
        fields = ('id', 'username', 'email')


class RegisterSerializer(serializers.ModelSerializer):
    """Creates users with Django's password hashing."""

    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        read_only_fields = ('id',)
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends the login response with the authenticated user's details."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class LogoutSerializer(serializers.Serializer):
    """Validates logout requests."""

    refresh = serializers.CharField()


class TaskSerializer(serializers.ModelSerializer):
    """Serializes task data while enforcing title validation."""

    user = serializers.PrimaryKeyRelatedField(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Task
        fields = (
            'id',
            'title',
            'description',
            'status',
            'created_at',
            'updated_at',
            'user',
            'username',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'user', 'username')

    def validate_title(self, value):
        cleaned_title = value.strip()
        if not cleaned_title:
            raise serializers.ValidationError('Title should not be empty.')
        return cleaned_title
