"""Production settings — hardened per django-security."""
import os

from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False

# WhiteNoise serves Django static files directly (no separate static server).
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# Production requires an explicit secret — fail fast rather than fall back
# to the insecure dev default from base.py.
SECRET_KEY = env("DJANGO_SECRET_KEY")

# Security headers & HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
# Behind a reverse proxy (nginx) — trust the proxy's protocol header.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# Keep the OpenAPI schema private in production unless explicitly enabled.
SHOW_API_DOCS = env.bool("SHOW_API_DOCS", default=False)

# Object storage (S3-compatible) for media in production — configured later.
# DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"

# Logging — logs to stdout in containers; file path configurable via env.
LOG_DIR = env("LOG_DIR", default="")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "level": "INFO",
        },
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "django.security": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}
if LOG_DIR:
    LOGGING["handlers"]["file"] = {
        "class": "logging.FileHandler",
        "filename": f"{LOG_DIR}/django/security.log",
        "formatter": "verbose",
        "level": "WARNING",
    }
    LOGGING["loggers"]["django.security"]["handlers"].append("file")
