"""Health check endpoint — verifies backend, PostgreSQL and Redis."""
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


def _redis_healthy():
    try:
        from django.core.cache import cache
        cache.set("healthcheck", "ok", 5)
        return cache.get("healthcheck") == "ok", "ok"
    except Exception as exc:  # noqa: BLE001
        logger.exception("Redis health check failed")
        return False, str(exc)


def health_check(request):
    """Return service status for backend, database and cache."""
    db_ok, db_status = _db_healthy()
    redis_ok, redis_status = _redis_healthy()

    payload = {
        "status": "ok" if db_ok and redis_ok else "degraded",
        "services": {
            "backend": {"status": "ok"},
            "postgresql": {"status": "ok" if db_ok else "error", "detail": db_status},
            "redis": {"status": "ok" if redis_ok else "error", "detail": redis_status},
        },
    }
    return JsonResponse(payload, status=200 if db_ok and redis_ok else 503)
