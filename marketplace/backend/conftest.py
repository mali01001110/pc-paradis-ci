"""Shared pytest fixtures."""
import pytest
from django.core import mail
from rest_framework.test import APIClient

from apps.accounts.models import Seller, SellerStatus


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(active_seller):
    """An authenticated client with valid JWT tokens for an active seller."""
    from rest_framework_simplejwt.tokens import RefreshToken

    client = APIClient()
    refresh = RefreshToken.for_user(active_seller)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def seller_factory(db):
    """Factory helper to create sellers quickly in tests."""

    def _create(**kwargs):
        defaults = {
            "email": "seller@example.com",
            "password": "S3cur3-Passw0rd!",
            "first_name": "Jean",
            "last_name": "Kouassi",
            "business_name": "TechStore Abidjan",
            "phone": "+2250708091011",
            "whatsapp": "+2250708091011",
            "terms_accepted": True,
            "email_verified": False,
        }
        defaults.update(kwargs)
        password = defaults.pop("password")
        seller = Seller.objects.create_user(email=defaults.pop("email"), password=password, **defaults)
        return seller

    return _create


@pytest.fixture
def active_seller(seller_factory):
    """A fully verified, active seller."""
    return seller_factory(email_verified=True, status=SellerStatus.ACTIVE)


@pytest.fixture
def staff_seller(seller_factory):
    """A staff member (moderator) account."""
    return seller_factory(
        email="staff@example.com", email_verified=True, status="ACTIVE", is_staff=True
    )


@pytest.fixture
def staff_client(staff_seller):
    """An authenticated client acting as staff/moderator."""
    from rest_framework_simplejwt.tokens import RefreshToken

    client = APIClient()
    refresh = RefreshToken.for_user(staff_seller)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture(autouse=True)
def clear_mailbox_and_throttles():
    """Reset the locmem email backend and DRF throttle cache between tests."""
    mail.outbox.clear()
    from django.core.cache import cache

    cache.clear()
    yield
    mail.outbox.clear()
    cache.clear()
