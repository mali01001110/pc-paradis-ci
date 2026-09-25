"""Tests for shops API (spec §10, §53)."""
import pytest
from django.urls import reverse
from rest_framework import status

from apps.shops.models import Shop


@pytest.mark.django_db
def test_get_my_shop_auto_creates(auth_client, active_seller):
    resp = auth_client.get("/api/v1/shops/me/")
    assert resp.status_code == status.HTTP_200_OK
    shop = Shop.objects.get(seller=active_seller)
    assert shop.name  # auto-created with a default name


@pytest.mark.django_db
def test_update_my_shop(auth_client, active_seller):
    resp = auth_client.patch(
        reverse("shops:my-shop"),
        {"description": "Spécialiste GPU et composants gaming", "commune": "Cocody"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    shop = Shop.objects.get(seller=active_seller)
    assert shop.commune == "Cocody"


@pytest.mark.django_db
def test_my_shop_requires_auth(api_client):
    resp = api_client.get("/api/v1/shops/me/")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_public_shop_by_slug(api_client, active_seller):
    Shop.objects.create(seller=active_seller, name="TechStore Abidjan", city="Abidjan", commune="Cocody")
    shop = Shop.objects.get(seller=active_seller)
    assert shop.slug == "techstore-abidjan"
    resp = api_client.get(reverse("shops:shop-detail", args=[shop.slug]))
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["name"] == "TechStore Abidjan"
    assert "product_count" in resp.data


@pytest.mark.django_db
def test_public_shop_invisible_when_inactive(api_client, active_seller):
    Shop.objects.create(seller=active_seller, name="TechStore", is_active=False)
    resp = api_client.get("/api/v1/shops/techstore/")
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_shop_slug_is_unique(seller_factory, db):
    s1 = seller_factory(email="a@x.ci", business_name="TechStore")
    s2 = seller_factory(email="b@x.ci", business_name="TechStore")
    shop1 = Shop.objects.create(seller=s1, name="TechStore")
    shop2 = Shop.objects.create(seller=s2, name="TechStore")
    assert shop1.slug != shop2.slug
