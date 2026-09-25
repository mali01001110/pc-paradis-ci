"""Tests for the authenticated seller profile endpoints (spec §9)."""
import pytest
from django.urls import reverse
from rest_framework import status

from apps.accounts.models import SellerProfile


@pytest.mark.django_db
def test_me_returns_seller_data(auth_client, active_seller):
    resp = auth_client.get(reverse("accounts:me"))
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["email"] == active_seller.email
    assert resp.data["business_name"] == "TechStore Abidjan"


@pytest.mark.django_db
def test_me_requires_authentication(api_client):
    resp = api_client.get(reverse("accounts:me"))
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_me_patch_updates_profile(auth_client, active_seller):
    resp = auth_client.patch(
        reverse("accounts:me"),
        {"business_name": "Nouveau Nom"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    active_seller.refresh_from_db()
    assert active_seller.business_name == "Nouveau Nom"


@pytest.mark.django_db
def test_me_patch_creates_profile(auth_client, active_seller):
    resp = auth_client.patch(
        reverse("accounts:me"),
        {"profile": {"city": "Abidjan", "commune": "Cocody", "description": "Vendeur de GPU"}},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    profile = SellerProfile.objects.get(seller=active_seller)
    assert profile.city == "Abidjan"
    assert profile.commune == "Cocody"
