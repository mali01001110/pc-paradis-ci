"""Tests for the admin dashboard stats endpoint (Étape 5)."""
import pytest
from django.urls import reverse
from rest_framework import status

from .test_moderation import gpu_brand, gpu_category, make_product, seeded  # noqa: F401


@pytest.mark.django_db
def test_admin_stats_requires_staff(api_client):
    resp = api_client.get(reverse("products:admin-stats"))
    assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.django_db
def test_admin_stats_returns_counts(staff_client, active_seller, gpu_category, gpu_brand, seeded):
    make_product(active_seller, gpu_category, gpu_brand)
    make_product(active_seller, gpu_category, gpu_brand, title="Vendu", status="SOLD")
    p = make_product(active_seller, gpu_category, gpu_brand, title="Supprimé")
    p.is_deleted = True
    p.save(update_fields=["is_deleted"])

    resp = staff_client.get(reverse("products:admin-stats"))
    assert resp.status_code == status.HTTP_200_OK
    data = resp.data
    assert data["total_products"] == 3
    assert data["available"] == 2
    assert data["sold"] == 1
    assert data["deleted"] == 1
    assert data["top_categories"][0]["slug"] == "gpu"
