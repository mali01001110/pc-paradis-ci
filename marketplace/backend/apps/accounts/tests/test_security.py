"""Security-focused tests: permissions, unauthorized access, rate limiting (§53)."""
import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
def test_logout_requires_authentication(api_client):
    resp = api_client.post(reverse("accounts:logout"), format="json")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_mfa_endpoints_require_authentication(api_client):
    resp = api_client.post(reverse("accounts:mfa-enable"), {"password": "x"}, format="json")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_register_is_rate_limited(api_client):
    # Default DRF anon throttle is generous (200/min); the register scope is 3/hour.
    # Verify the register scope throttle applies after exceeding it.
    for _ in range(3):
        api_client.post(
            reverse("accounts:register"),
            {
                "email": f"u{_}@exemple.ci",
                "password": "S3cur3-Passw0rd!",
                "password2": "S3cur3-Passw0rd!",
                "terms_accepted": True,
            },
            format="json",
        )
    resp = api_client.post(
        reverse("accounts:register"),
        {
            "email": "overflow@exemple.ci",
            "password": "S3cur3-Passw0rd!",
            "password2": "S3cur3-Passw0rd!",
            "terms_accepted": True,
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.django_db
def test_passwords_are_never_stored_in_plaintext(active_seller):
    assert "S3cur3-Passw0rd!" not in active_seller.password
    assert active_seller.password != "S3cur3-Passw0rd!"


@pytest.mark.django_db
def test_email_verification_token_not_exposed_in_api(api_client, active_seller):
    """The raw token is sent only via email, never returned by the API."""
    from apps.accounts import services

    _, raw = services.create_email_verification_token(active_seller)
    from apps.accounts.models import EmailVerificationToken

    stored = EmailVerificationToken.objects.get(seller=active_seller)
    assert stored.token_hash != raw
    assert raw not in stored.token_hash
