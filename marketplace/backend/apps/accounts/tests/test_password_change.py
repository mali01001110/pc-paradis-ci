"""Tests for password change (spec §46, Étape 1)."""
import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
def test_change_password_success(auth_client, active_seller):
    resp = auth_client.post(
        reverse("accounts:password-change"),
        {
            "current_password": "S3cur3-Passw0rd!",
            "new_password": "Nouveau-Passw0rd!",
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    active_seller.refresh_from_db()
    assert active_seller.check_password("Nouveau-Passw0rd!")


@pytest.mark.django_db
def test_change_password_wrong_current(auth_client, active_seller):
    resp = auth_client.post(
        reverse("accounts:password-change"),
        {
            "current_password": "Mauvais-Mdp!",
            "new_password": "Nouveau-Passw0rd!",
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    active_seller.refresh_from_db()
    assert active_seller.check_password("S3cur3-Passw0rd!")


@pytest.mark.django_db
def test_change_password_same_as_current(auth_client, active_seller):
    resp = auth_client.post(
        reverse("accounts:password-change"),
        {
            "current_password": "S3cur3-Passw0rd!",
            "new_password": "S3cur3-Passw0rd!",
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_change_password_requires_auth(api_client, active_seller):
    resp = api_client.post(
        reverse("accounts:password-change"),
        {"current_password": "x", "new_password": "y"},
        format="json",
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
