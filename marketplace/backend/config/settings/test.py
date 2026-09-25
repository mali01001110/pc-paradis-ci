"""Test settings — fast, isolated, no external services."""
from .base import *  # noqa: F401,F403

DEBUG = False

# Use SQLite in-memory for fast, isolated tests (no Postgres required).
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Console email backend — never send real emails in tests.
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Disable caching / use locmem for tests.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Speed up password hashing in tests.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Fast Celery in tests (execute eagerly).
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Tighten TTLs so expiry scenarios are testable quickly.
EMAIL_VERIFICATION_TOKEN_TTL_HOURS = 24
MFA_CODE_TTL_SECONDS = 300
MFA_MAX_ATTEMPTS = 5
