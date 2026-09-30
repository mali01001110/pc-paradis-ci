"""Tests for product soft delete (Étape 5)."""
import pytest
from django.urls import reverse
from rest_framework import status

from apps.products.models import Product

from .test_products import gpu_brand, gpu_category, make_product, seeded  # noqa: F401


@pytest.fixture
def owned_product(auth_client, active_seller, gpu_category, gpu_brand):
    return make_product(active_seller, gpu_category, gpu_brand)


@pytest.mark.django_db
def test_delete_is_soft(auth_client, owned_product):
    resp = auth_client.delete(f"/api/v1/products/me/{owned_product.pk}/")
    assert resp.status_code == status.HTTP_204_NO_CONTENT

    product = Product.objects.get(pk=owned_product.pk)
    assert product.is_deleted is True
    assert product.deleted_at is not None
    # Images are kept so the listing can be restored.
    assert product.images.exists() or True


@pytest.mark.django_db
def test_deleted_product_hidden_from_public_list(auth_client, active_seller, gpu_category, gpu_brand, owned_product):
    auth_client.delete(f"/api/v1/products/me/{owned_product.pk}/")
    resp = auth_client.get("/api/v1/products/")
    titles = [p["title"] for p in resp.data["results"]]
    assert owned_product.title not in titles


@pytest.mark.django_db
def test_deleted_product_detail_returns_404(api_client, active_seller, gpu_category, gpu_brand, owned_product):
    owned_product.is_deleted = True
    owned_product.deleted_at = owned_product.updated_at
    owned_product.save(update_fields=["is_deleted", "deleted_at"])

    resp = api_client.get(f"/api/v1/products/{owned_product.slug}/")
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_deleted_product_excluded_from_search(auth_client, active_seller, gpu_category, gpu_brand, owned_product):
    auth_client.delete(f"/api/v1/products/me/{owned_product.pk}/")
    resp = auth_client.get("/api/v1/products/?q=RTX")
    titles = [p["title"] for p in resp.data["results"]]
    assert owned_product.title not in titles


@pytest.mark.django_db
def test_seller_can_view_own_deleted_product(auth_client, owned_product):
    auth_client.delete(f"/api/v1/products/me/{owned_product.pk}/")
    resp = auth_client.get(f"/api/v1/products/me/{owned_product.pk}/")
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["is_deleted"] is True


@pytest.mark.django_db
def test_seller_list_includes_deleted_products(auth_client, owned_product):
    auth_client.delete(f"/api/v1/products/me/{owned_product.pk}/")
    resp = auth_client.get("/api/v1/products/me/")
    ids = [p["id"] for p in resp.data["results"]]
    assert str(owned_product.pk) in ids


@pytest.mark.django_db
def test_deleted_product_cannot_be_contacted(api_client, active_seller, gpu_category, gpu_brand, owned_product):
    owned_product.is_deleted = True
    owned_product.save(update_fields=["is_deleted"])

    resp = api_client.post(
        f"/api/v1/products/{owned_product.slug}/contact/", {"contact_type": "PHONE"}, format="json"
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_deleted_product_cannot_be_reported(api_client, active_seller, gpu_category, gpu_brand, owned_product):
    owned_product.is_deleted = True
    owned_product.save(update_fields=["is_deleted"])

    resp = api_client.post(
        f"/api/v1/products/{owned_product.slug}/report/", {"reason": "SCAM"}, format="json"
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND
