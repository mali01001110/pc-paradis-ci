"""Tests for seller registration and email verification (spec §6-§7)."""
import pytest
from django.core import mail
from django.urls import reverse
from rest_framework import status

from apps.accounts.models import Seller, SellerStatus


@pytest.mark.django_db
def test_register_creates_pending_seller_and_sends_email(api_client):
    resp = api_client.post(
        reverse("accounts:register"),
        {
            "email": "vendeur@exemple.ci",
            "first_name": "Jean",
            "last_name": "Kouassi",
            "business_name": "TechStore",
            "phone": "+2250708091011",
            "whatsapp": "+2250708091011",
            "password": "S3cur3-Passw0rd!",
            "password2": "S3cur3-Passw0rd!",
            "terms_accepted": True,
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_201_CREATED
    seller = Seller.objects.get(email="vendeur@exemple.ci")
    assert seller.status == SellerStatus.PENDING
    assert seller.email_verified is False
    assert seller.terms_accepted is True
    assert len(mail.outbox) == 1
    assert "Confirmez votre email" in mail.outbox[0].subject


@pytest.mark.django_db
def test_register_requires_matching_passwords(api_client):
    resp = api_client.post(
        reverse("accounts:register"),
        {
            "email": "vendeur@exemple.ci",
            "password": "S3cur3-Passw0rd!",
            "password2": "Different-Pass!",
            "terms_accepted": True,
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_register_requires_terms_acceptance(api_client):
    resp = api_client.post(
        reverse("accounts:register"),
        {
            "email": "vendeur@exemple.ci",
            "password": "S3cur3-Passw0rd!",
            "password2": "S3cur3-Passw0rd!",
            "terms_accepted": False,
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_register_rejects_duplicate_email(api_client, seller_factory):
    seller_factory(email="vendeur@exemple.ci")
    resp = api_client.post(
        reverse("accounts:register"),
        {
            "email": "vendeur@exemple.ci",
            "password": "S3cur3-Passw0rd!",
            "password2": "S3cur3-Passw0rd!",
            "terms_accepted": True,
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_verify_email_activates_account(api_client, seller_factory):
    from apps.accounts import services

    seller = seller_factory(email="vendeur@exemple.ci")
    _, raw = services.create_email_verification_token(seller)
    resp = api_client.post(reverse("accounts:verify-email", args=[raw]), format="json")
    assert resp.status_code == status.HTTP_200_OK
    seller.refresh_from_db()
    assert seller.email_verified is True
    assert seller.status == SellerStatus.ACTIVE


@pytest.mark.django_db
def test_verify_email_token_is_one_time(api_client, seller_factory):
    from apps.accounts import services

    seller = seller_factory(email="vendeur@exemple.ci")
    _, raw = services.create_email_verification_token(seller)
    first = api_client.post(reverse("accounts:verify-email", args=[raw]), format="json")
    second = api_client.post(reverse("accounts:verify-email", args=[raw]), format="json")
    assert first.status_code == status.HTTP_200_OK
    assert second.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_verify_email_rejects_invalid_token(api_client, seller_factory):
    seller_factory(email="vendeur@exemple.ci")
    resp = api_client.post(reverse("accounts:verify-email", args=["not-a-real-token"]), format="json")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
