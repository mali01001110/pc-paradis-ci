"""Custom DRF permissions for seller accounts."""
from rest_framework import permissions


class IsVerifiedSeller(permissions.BasePermission):
    """Only allow active, email-verified sellers."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_verified)


class IsSelf(permissions.BasePermission):
    """Object-level: only the seller themselves."""

    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated and obj == request.user)
