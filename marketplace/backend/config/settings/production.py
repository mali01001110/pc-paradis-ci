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

ALLOWED_HOSTS = env("ALLOWED_HOSTS", default=[])
render_external_hostname = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if render_external_hostname and render_external_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_external_hostname)

# Production requires an explicit secret — fail fast rather than fall back
# to the insecure dev default from base.py.
SECRET_KEY = env("DJANGO_SECRET_KEY")

# Supabase requires SSL — enforce sslmode=require for the PostgreSQL connection.
DB_SSL_MODE = env("DB_SSL_MODE", default="require")
DATABASE_URL = env("DATABASE_URL", default="")
if DATABASE_URL:
    DATABASES["default"] = env.db_url_config(DATABASE_URL)
    DATABASES["default"]["CONN_MAX_AGE"] = 60
    DATABASES["default"].setdefault("OPTIONS", {})["sslmode"] = DB_SSL_MODE

# Use Redis whenever configured; Docker builds may not receive runtime env vars.
REDIS_URL = env("REDIS_URL", default="")
if REDIS_URL:
    CACHES["default"] = {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "KEY_PREFIX": "pcparadis",
    }
else:
    CACHES["default"] = {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "pcparadis-production-cache",
    }

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

# The production frontend must be allowed even when the optional env var is unset.
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
if "https://pc-paradis.vercel.app" not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append("https://pc-paradis.vercel.app")

# Keep the OpenAPI schema private in production unless explicitly enabled.
SHOW_API_DOCS = env.bool("SHOW_API_DOCS", default=False)

AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_ENDPOINT_URL = env("AWS_S3_ENDPOINT_URL", default="")
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="eu-west-1")
AWS_S3_CUSTOM_DOMAIN = env("AWS_S3_CUSTOM_DOMAIN", default="")
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = False

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME:
    STORAGES["default"]["BACKEND"] = "storages.backends.s3boto3.S3Boto3Storage"

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
