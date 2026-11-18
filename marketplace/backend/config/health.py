"""Health check endpoint — verifies backend, PostgreSQL and cache."""
import logging

from django.db import connections
from django.http import JsonResponse

logger = logging.getLogger(__name__)


def _db_healthy():
    try:
        connections["default"].cursor()
        return True, "ok"
    except Exception as exc:  # noqa: BLE001
        logger.exception("DB health check failed")
        return False, str(exc)


def _cache_healthy():
    try:
        from django.core.cache import cache
        cache.set("healthcheck", "ok", 5)
        return cache.get("healthcheck") == "ok", "ok"
    except Exception as exc:  # noqa: BLE001
        logger.exception("Cache health check failed")
        return False, str(exc)


def health_check(request):
    """Return service status for backend, database and cache."""
    db_ok, db_status = _db_healthy()
    cache_ok, cache_status = _cache_healthy()

    payload = {
        "status": "ok" if db_ok and cache_ok else "degraded",
        "services": {
            "backend": {"status": "ok"},
            "postgresql": {"status": "ok" if db_ok else "error", "detail": db_status},
            "cache": {"status": "ok" if cache_ok else "error", "detail": cache_status},
        },
    }
    return JsonResponse(payload, status=200 if db_ok and cache_ok else 503)
