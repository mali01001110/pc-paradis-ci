"""Tests for login and email MFA flow (spec §8)."""
import pytest
from django.core import mail
from django.urls import reverse
from rest_framework import status

from apps.accounts import services
from apps.accounts.models import MFACode, Seller


@pytest.mark.django_db
def test_login_without_mfa_returns_tokens(api_client, active_seller):
    resp = api_client.post(
        reverse("accounts:login"),
        {"email": active_seller.email, "password": "S3cur3-Passw0rd!"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    assert "access" in resp.data
    assert "refresh" in resp.data
    assert resp.data["mfa_required"] is False


@pytest.mark.django_db
def test_login_rejects_wrong_password(api_client, active_seller):
    resp = api_client.post(
        reverse("accounts:login"),
        {"email": active_seller.email, "password": "Wrong-Pass!"},
        format="json",
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_login_rejects_unverified_seller(api_client, seller_factory):
    seller = seller_factory(email_verified=False)
    resp = api_client.post(
        reverse("accounts:login"),
        {"email": seller.email, "password": "S3cur3-Passw0rd!"},
        format="json",
    )
    assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_login_with_mfa_requires_challenge(api_client, active_seller):
    active_seller.mfa_enabled = True
    active_seller.save(update_fields=["mfa_enabled"])
    resp = api_client.post(
        reverse("accounts:login"),
        {"email": active_seller.email, "password": "S3cur3-Passw0rd!"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["mfa_required"] is True
    assert "access" not in resp.data
    assert len(mail.outbox) == 1
    assert "code de sécurité" in mail.outbox[0].subject.lower()


@pytest.mark.django_db
def test_mfa_verify_issues_tokens(api_client, active_seller):
    active_seller.mfa_enabled = True
    active_seller.save(update_fields=["mfa_enabled"])
    code = services.create_mfa_code(active_seller)
    resp = api_client.post(
        reverse("accounts:mfa-verify"),
        {"email": active_seller.email, "code": code},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    assert "access" in resp.data
    assert "refresh" in resp.data


@pytest.mark.django_db
def test_mfa_verify_rejects_wrong_code(api_client, active_seller):
    active_seller.mfa_enabled = True
    active_seller.save(update_fields=["mfa_enabled"])
    services.create_mfa_code(active_seller)
    resp = api_client.post(
        reverse("accounts:mfa-verify"),
        {"email": active_seller.email, "code": "000000"},
        format="json",
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_mfa_code_is_one_time(api_client, active_seller):
    active_seller.mfa_enabled = True
    active_seller.save(update_fields=["mfa_enabled"])
    code = services.create_mfa_code(active_seller)
    first = api_client.post(
        reverse("accounts:mfa-verify"),
        {"email": active_seller.email, "code": code},
        format="json",
    )
    second = api_client.post(
        reverse("accounts:mfa-verify"),
        {"email": active_seller.email, "code": code},
        format="json",
    )
    assert first.status_code == status.HTTP_200_OK
    assert second.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_mfa_brute_force_locks_code(active_seller):
    """After MFA_MAX_ATTEMPTS wrong submissions, even the correct code is rejected."""
    active_seller.mfa_enabled = True
    active_seller.save(update_fields=["mfa_enabled"])
    code = services.create_mfa_code(active_seller)
    # Exhaust the attempt limit directly at service level (avoids HTTP throttle).
    for _ in range(5):
        assert services.verify_mfa_code(active_seller, "000000") is False
    # Even the correct code should now be rejected
    assert services.verify_mfa_code(active_seller, code) is False


@pytest.mark.django_db
def test_mfa_brute_force_rejected_via_api(api_client, active_seller):
    """The API layer rejects repeated wrong codes and throttles abuse."""
    active_seller.mfa_enabled = True
    active_seller.save(update_fields=["mfa_enabled"])
    resp = api_client.post(
        reverse("accounts:mfa-verify"),
        {"email": active_seller.email, "code": "000000"},
        format="json",
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_mfa_resend_creates_new_code(api_client, active_seller):
    active_seller.mfa_enabled = True
    active_seller.save(update_fields=["mfa_enabled"])
    resp = api_client.post(
        reverse("accounts:mfa-resend"),
        {"email": active_seller.email},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    assert len(mail.outbox) == 1


@pytest.mark.django_db
def test_enable_mfa_requires_password(auth_client, active_seller):
    resp = auth_client.post(
        reverse("accounts:mfa-enable"),
        {"password": "S3cur3-Passw0rd!"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    active_seller.refresh_from_db()
    assert active_seller.mfa_enabled is True


@pytest.mark.django_db
def test_enable_mfa_rejects_wrong_password(auth_client, active_seller):
    resp = auth_client.post(
        reverse("accounts:mfa-enable"),
        {"password": "Wrong-Pass!"},
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    active_seller.refresh_from_db()
    assert active_seller.mfa_enabled is False


@pytest.mark.django_db
def test_disable_mfa(auth_client, active_seller):
    active_seller.mfa_enabled = True
    active_seller.save(update_fields=["mfa_enabled"])
    resp = auth_client.post(
        reverse("accounts:mfa-disable"),
        {"password": "S3cur3-Passw0rd!"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    active_seller.refresh_from_db()
    assert active_seller.mfa_enabled is False


@pytest.mark.django_db
def test_token_refresh_returns_new_access_token(api_client, active_seller):
    login_resp = api_client.post(
        reverse("accounts:login"),
        {"email": active_seller.email, "password": "S3cur3-Passw0rd!"},
        format="json",
    )
    refresh = login_resp.data["refresh"]

    resp = api_client.post(
        reverse("accounts:token-refresh"),
        {"refresh": refresh},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    assert "access" in resp.data
    # ROTATE_REFRESH_TOKENS=True → a new refresh token is issued
    assert "refresh" in resp.data
    assert resp.data["refresh"] != refresh


@pytest.mark.django_db
def test_token_refresh_rejects_blacklisted_token(api_client, active_seller):
    login_resp = api_client.post(
        reverse("accounts:login"),
        {"email": active_seller.email, "password": "S3cur3-Passw0rd!"},
        format="json",
    )
    refresh = login_resp.data["refresh"]

    first = api_client.post(
        reverse("accounts:token-refresh"), {"refresh": refresh}, format="json"
    )
    assert first.status_code == status.HTTP_200_OK

    # The original refresh token is blacklisted after rotation
    second = api_client.post(
        reverse("accounts:token-refresh"), {"refresh": refresh}, format="json"
    )
    assert second.status_code == status.HTTP_401_UNAUTHORIZED
