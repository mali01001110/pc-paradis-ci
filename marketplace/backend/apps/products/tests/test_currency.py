"""Tests for multi-currency pricing (Étape 5)."""
import pytest
from django.urls import reverse
from rest_framework import status

from .test_products import gpu_brand, gpu_category, make_product, seeded  # noqa: F401


@pytest.mark.django_db
def test_price_fcfa_for_fcfa_product(auth_client, active_seller, gpu_category, gpu_brand):
    from .test_products import make_product as _make  # noqa: F401

    product = _make(active_seller, gpu_category, gpu_brand, price=450000, currency="FCFA")
    resp = auth_client.get(f"/api/v1/products/{product.slug}/")
    assert resp.data["price_fcfa"] == 450000


@pytest.mark.django_db
def test_price_fcfa_converts_eur_product(auth_client, active_seller, gpu_category, gpu_brand):
    product = make_product(active_seller, gpu_category, gpu_brand, price=100, currency="EUR")
    resp = auth_client.get(f"/api/v1/products/{product.slug}/")
    # 100 EUR * 655.957 = 65595.7 -> rounds to 65596
    assert resp.data["price_fcfa"] == 65596


@pytest.mark.django_db
def test_price_fcfa_converts_usd_product(auth_client, active_seller, gpu_category, gpu_brand):
    product = make_product(active_seller, gpu_category, gpu_brand, price=100, currency="USD")
    resp = auth_client.get(f"/api/v1/products/{product.slug}/")
    assert resp.data["price_fcfa"] == 59000


@pytest.mark.django_db
def test_public_list_includes_price_fcfa(api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand, price=100, currency="EUR")
    resp = api_client.get("/api/v1/products/")
    assert resp.data["results"][0]["price_fcfa"] == 65596
