"""Tests for moderation API (spec §44 — Phase 8)."""
import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status

from apps.categories.models import Brand, Category
from apps.products.models import Product


@pytest.fixture
def seeded(db):
    call_command("seed_catalogue")


@pytest.fixture
def gpu_category(seeded):
    return Category.objects.get(slug="gpu")


@pytest.fixture
def gpu_brand(seeded):
    return Brand.objects.get(name="MSI")


def make_product(seller, category, brand, **overrides):
    defaults = {
        "seller": seller,
        "category": category,
        "brand": brand,
        "title": "Annonce a moderer",
        "price": 100000,
        "condition": "OCCASION",
        "status": "AVAILABLE",
    }
    defaults.update(overrides)
    return Product.objects.create(**defaults)


@pytest.mark.django_db
def test_moderation_queue_requires_auth(api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand)
    resp = api_client.get(reverse("products:admin-products"))
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_moderation_queue_forbids_regular_seller(seeded, auth_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand)
    resp = auth_client.get(reverse("products:admin-products"))
    assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_moderation_queue_filters_by_status(staff_client, active_seller, gpu_category, gpu_brand, seeded):
    make_product(active_seller, gpu_category, gpu_brand, title="Visible")
    make_product(active_seller, gpu_category, gpu_brand, status="HIDDEN", title="Cache")
    resp = staff_client.get(reverse("products:admin-products"), {"status": "HIDDEN"})
    assert resp.status_code == status.HTTP_200_OK
    titles = [p["title"] for p in resp.data["results"]]
    assert "Cache" in titles
    assert "Visible" not in titles


@pytest.mark.django_db
def test_moderation_action_approve(staff_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand, status="HIDDEN")
    resp = staff_client.post(
        reverse("products:moderate-product", args=[p.id]),
        {"action": "approve"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    p.refresh_from_db()
    assert p.status == "AVAILABLE"


@pytest.mark.django_db
def test_moderation_action_reject_then_restore(staff_client, active_seller, gpu_category, gpu_brand):
    p = Product.objects.create(
        seller=active_seller,
        category=gpu_category,
        title="GPU",
        price=100,
        status="AVAILABLE",
    )
    resp = staff_client.post(
        reverse("products:moderate-product", args=[p.id]),
        {"action": "reject"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    p.refresh_from_db()
    assert p.status == "REJECTED"

    resp = staff_client.post(
        reverse("products:moderate-product", args=[p.id]),
        {"action": "restore"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    p.refresh_from_db()
    assert p.status == "AVAILABLE"


@pytest.mark.django_db
def test_moderation_action_invalid(staff_client, active_seller, gpu_category, gpu_brand):
    p = Product.objects.create(
        seller=active_seller, category=gpu_category, title="GPU", price=100
    )
    resp = staff_client.post(
        reverse("products:moderate-product", args=[p.id]),
        {"action": "nuke"},
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_moderation_forbidden_for_regular_seller(auth_client, active_seller, gpu_category, gpu_brand):
    p = Product.objects.create(
        seller=active_seller, category=gpu_category, title="GPU", price=100
    )
    resp = auth_client.post(
        reverse("products:moderate-product", args=[p.id]),
        {"action": "hide"},
        format="json",
    )
    assert resp.status_code == status.HTTP_403_FORBIDDEN
    p.refresh_from_db()
    assert p.status == "AVAILABLE"
