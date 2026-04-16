from rest_framework import permissions


class IsTaskOwner(permissions.BasePermission):
    """Allows access only to the user who owns the task."""

    message = 'You can only update or delete your own tasks.'

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
