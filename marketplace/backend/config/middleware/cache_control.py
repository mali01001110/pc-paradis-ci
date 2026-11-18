"""Cache-Control: public, max-age=60 on public (AllowAny) GET responses."""

from django.utils.deprecation import MiddlewareMixin
from rest_framework import permissions


class CacheControlMiddleware(MiddlewareMixin):
    """Adds ``Cache-Control: public, max-age=60`` to unauthenticated GET responses.

    Only applies to views whose permission classes include ``AllowAny``, so
    authenticated endpoints are never cached publicly. Complements the per-view
    Redis caching by throttling request stampedes at the edge/browser.
    """

    def process_response(self, request, response):
        if request.method != "GET" or response.status_code != 200:
            return response
        if response.has_header("Cache-Control"):
            return response

        resolver = getattr(request, "resolver_match", None)
        view_cls = None
        if resolver is not None:
            view_func = getattr(resolver, "func", None)
            view_cls = getattr(view_func, "cls", None)
        if view_cls is None:
            return response

        permission_classes = getattr(view_cls, "permission_classes", None) or []
        is_public = any(
            isinstance(perm, type) and issubclass(perm, permissions.AllowAny)
            for perm in permission_classes
        )
        if not is_public:
            return response

        response["Cache-Control"] = "public, max-age=60"
        return response
