"""Tests for password reset flow (spec §46)."""
import pytest
from django.core import mail
from django.urls import reverse
from rest_framework import status

from apps.accounts import services


@pytest.mark.django_db
def test_password_reset_request_sends_code(api_client, active_seller):
    resp = api_client.post(
        reverse("accounts:password-reset"),
        {"email": active_seller.email},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    assert len(mail.outbox) == 1
    assert "réinitialisation" in mail.outbox[0].subject.lower()


@pytest.mark.django_db
def test_password_reset_confirm_changes_password(api_client, active_seller):
    code = services.create_password_reset_code(active_seller)
    resp = api_client.post(
        reverse("accounts:password-reset-confirm"),
        {
            "email": active_seller.email,
            "code": code,
            "password": "New-S3cur3-Pass!",
            "password2": "New-S3cur3-Pass!",
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    active_seller.refresh_from_db()
    assert active_seller.check_password("New-S3cur3-Pass!")


@pytest.mark.django_db
def test_password_reset_rejects_wrong_code(api_client, active_seller):
    services.create_password_reset_code(active_seller)
    resp = api_client.post(
        reverse("accounts:password-reset-confirm"),
        {
            "email": active_seller.email,
            "code": "000000",
            "password": "New-S3cur3-Pass!",
            "password2": "New-S3cur3-Pass!",
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_password_reset_requires_matching_passwords(api_client, active_seller):
    code = services.create_password_reset_code(active_seller)
    resp = api_client.post(
        reverse("accounts:password-reset-confirm"),
        {
            "email": active_seller.email,
            "code": code,
            "password": "New-S3cur3-Pass!",
            "password2": "Different-Pass!",
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
