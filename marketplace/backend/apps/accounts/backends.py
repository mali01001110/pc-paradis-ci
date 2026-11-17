"""Authentication backends.

CaseInsensitiveEmailBackend normalizes the email (USERNAME_FIELD) to lowercase
before authenticating so that the Django admin login behaves like the REST API
LoginView, which lowercases the email before lookup.

Stored emails are already normalized to lowercase by SellerManager.create_user().
Without this backend, an email typed with uppercase letters in the admin login
form fails to match the stored lowercase email on case-sensitive databases
(PostgreSQL), producing Django's generic "invalid email/password" error.
"""
from django.contrib.auth.backends import ModelBackend


class CaseInsensitiveEmailBackend(ModelBackend):
    """Authenticate using a case-insensitive email lookup."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is not None:
            username = username.strip().lower()
        return super().authenticate(request, username=username, password=password, **kwargs)
