"""Development settings."""
from .base import *  # noqa: F401,F403
from .base import env

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Supabase connection for local development (DB host only).
# Override these via .env or environment to point at a Supabase project.
SUPABASE_URL = env("SUPABASE_URL", default="")
SUPABASE_ANON_KEY = env("SUPABASE_ANON_KEY", default="")
SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY", default="")

# Dev-friendly in-memory / local services already defined in base.
# Static and media served locally during development.

# Development-only CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
